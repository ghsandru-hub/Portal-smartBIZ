<?php
// =============================================================
// Launch Portal — Route Handlers
// =============================================================

// ---------- Auth ----------

function route_setup() {
    $body = read_json_body();
    $username = clean_string($body['username'] ?? null, 100);
    $password = $body['password'] ?? '';

    if (empty($username) || strlen($username) < 2) {
        json_error('Utilizator invalid (minim 2 caractere)', 400);
    }
    if (!is_string($password) || strlen($password) < 8) {
        json_error('Parola trebuie sa aiba minim 8 caractere', 400);
    }

    db()->beginTransaction();
    try {
        $count = (int)db()->query('SELECT COUNT(*) FROM users')->fetchColumn();
        if ($count > 0) {
            db()->rollBack();
            json_error('Configurarea initiala a fost deja facuta', 403);
        }
        $now = time();
        $stmt = db()->prepare('INSERT INTO users (username, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$username, hash_password($password), 'admin', $now, $now]);
        $uid = (int)db()->lastInsertId();
        db()->commit();
    } catch (Throwable $e) {
        if (db()->inTransaction()) db()->rollBack();
        throw $e;
    }

    $config = config();
    $token = jwt_create(['uid' => $uid], $config['jwt_secret'], $config['cookie_lifetime']);
    set_session_cookie($token);

    json_response(['user' => ['id' => $uid, 'username' => $username, 'role' => 'admin', 'company' => null]]);
}

function route_login() {
    $ip = get_client_ip();
    if (!check_rate_limit($ip)) {
        json_error('Prea multe incercari. Incearca peste 15 minute.', 429);
    }

    $body = read_json_body();
    $username = clean_string($body['username'] ?? null, 100);
    $password = $body['password'] ?? '';

    if (empty($username) || empty($password)) {
        record_login_attempt($ip, false);
        json_error('Date invalide', 400);
    }

    $stmt = db()->prepare('SELECT id, username, password_hash, password_changed, role, company_cui, company_name FROM users WHERE username = ?');
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user || !verify_password($password, $user['password_hash'])) {
        record_login_attempt($ip, false);
        usleep(rand(100000, 300000));
        json_error('Utilizator sau parola incorecte', 401);
    }

    record_login_attempt($ip, true);

    $config = config();
    $token = jwt_create(['uid' => (int)$user['id']], $config['jwt_secret'], $config['cookie_lifetime']);
    set_session_cookie($token);

    json_response([
        'user' => [
            'id' => (int)$user['id'], 
            'username' => $user['username'],
            'role' => $user['role'],
            'company_cui' => $user['company_cui'],
            'company_name' => $user['company_name'],
            'company' => $user['company_cui'] ? [
                'cui' => $user['company_cui'],
                'name' => $user['company_name']
            ] : null,
            'password_changed' => (bool)($user['password_changed'] ?? 1)
        ]
    ]);
}

function route_logout() {
    clear_session_cookie();
    json_response(['ok' => true]);
}

function route_me() {
    $user = current_user();
    $needsSetup = ((int)db()->query('SELECT COUNT(*) FROM users')->fetchColumn()) === 0;
    if (!$user) {
        json_response(['user' => null, 'needs_setup' => $needsSetup]);
    }
    $company = null;
    if ($user['company_cui'] || $user['company_name']) {
        $company = [
            'cui' => $user['company_cui'],
            'name' => $user['company_name']
        ];
    }
    json_response([
        'user' => [
            'id' => (int)$user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'company' => $company,
            'password_changed' => (bool)($user['password_changed'] ?? 1)
        ],
        'needs_setup' => false
    ]);
}

// ---------- Data ----------

function route_data() {
    $user = require_auth();
    $uid = $user['id'];

    $sectionsStmt = db()->prepare('SELECT id, name, color, icon, tab, position FROM sections WHERE user_id = ? ORDER BY position, created_at');
    $sectionsStmt->execute([$uid]);
    $sections = $sectionsStmt->fetchAll();

    $appsStmt = db()->prepare('SELECT id, section_id, name, url, description, access_user, color, position FROM apps WHERE user_id = ? ORDER BY position, created_at');
    $appsStmt->execute([$uid]);
    $apps = $appsStmt->fetchAll();

    $favoritesStmt = db()->prepare('SELECT id, section_id, label, url, color, position FROM favorites WHERE user_id = ? ORDER BY position, created_at');
    $favoritesStmt->execute([$uid]);
    $favorites = $favoritesStmt->fetchAll();

    $appsSections = [];
    $favSections = [];
    $secMap = [];

    foreach ($sections as $sec) {
        $tab = $sec['tab'];
        unset($sec['tab']);
        if ($tab === 'apps') {
            $sec['apps'] = [];
            $appsSections[] = $sec;
            $secMap[$sec['id']] = ['type' => 'apps', 'index' => count($appsSections) - 1];
        } else {
            $sec['favorites'] = [];
            $favSections[] = $sec;
            $secMap[$sec['id']] = ['type' => 'favorites', 'index' => count($favSections) - 1];
        }
    }

    foreach ($apps as $app) {
        $sid = $app['section_id'];
        if (isset($secMap[$sid]) && $secMap[$sid]['type'] === 'apps') {
            unset($app['section_id']);
            $appsSections[$secMap[$sid]['index']]['apps'][] = $app;
        }
    }

    foreach ($favorites as $fav) {
        $sid = $fav['section_id'];
        if ($sid !== null && isset($secMap[$sid]) && $secMap[$sid]['type'] === 'favorites') {
            unset($fav['section_id']);
            $favSections[$secMap[$sid]['index']]['favorites'][] = $fav;
        }
    }

    json_response([
        'appsSections' => $appsSections,
        'favSections' => $favSections,
    ]);
}

// ---------- Sections ----------

function route_sections($method, $id) {
    $user = require_auth();

    if ($method === 'POST' && !$id) {
        $body = read_json_body();
        $name = clean_string($body['name'] ?? null, 100);
        $color = $body['color'] ?? null;
        $icon = $body['icon'] ?? 'folder';
        $tab = $body['tab'] ?? 'apps';

        if (empty($name)) json_error('Nume invalid', 400);
        if (!validate_color($color)) json_error('Culoare invalida', 400);
        if (!validate_icon($icon)) json_error('Icon invalid', 400);
        if (!validate_tab($tab)) json_error('Tab invalid', 400);

        $newId = gen_id();
        $now = time();
        $maxStmt = db()->prepare('SELECT COALESCE(MAX(position), -1) + 1 FROM sections WHERE user_id = ? AND tab = ?');
        $maxStmt->execute([$user['id'], $tab]);
        $position = (int)$maxStmt->fetchColumn();

        $stmt = db()->prepare('INSERT INTO sections (id, user_id, name, color, icon, tab, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$newId, $user['id'], $name, $color, $icon, $tab, $position, $now, $now]);

        json_response(['ok' => true, 'id' => $newId]);
    }

    if ($method === 'PUT' && $id) {
        $body = read_json_body();
        $name = clean_string($body['name'] ?? null, 100);
        $color = $body['color'] ?? null;
        $icon = $body['icon'] ?? 'folder';

        if (empty($name)) json_error('Nume invalid', 400);
        if (!validate_color($color)) json_error('Culoare invalida', 400);
        if (!validate_icon($icon)) json_error('Icon invalid', 400);

        $stmt = db()->prepare('UPDATE sections SET name = ?, color = ?, icon = ?, updated_at = ? WHERE id = ? AND user_id = ?');
        $stmt->execute([$name, $color, $icon, time(), $id, $user['id']]);
        if ($stmt->rowCount() === 0) json_error('Sectiunea nu exista', 404);

        json_response(['ok' => true]);
    }

    if ($method === 'DELETE' && $id) {
        $stmt = db()->prepare('DELETE FROM sections WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $user['id']]);
        json_response(['ok' => true]);
    }

    json_error('Method not allowed', 405);
}

// ---------- Apps ----------

function route_apps($method, $id) {
    $user = require_auth();

    if ($method === 'POST' && !$id) {
        $body = read_json_body();
        $sectionId = $body['section_id'] ?? null;
        $name = clean_string($body['name'] ?? null, 100);
        $url = clean_string($body['url'] ?? null, 500);
        $description = isset($body['description']) ? clean_string($body['description'], 500) : null;
        $accessUser = isset($body['access_user']) ? clean_string($body['access_user'], 200) : null;
        $color = $body['color'] ?? null;

        if (empty($sectionId)) json_error('section_id invalid', 400);
        if (empty($name)) json_error('Nume invalid', 400);
        if (!validate_url($url)) json_error('URL invalid', 400);
        if (!validate_color($color)) json_error('Culoare invalida', 400);

        $check = db()->prepare("SELECT id FROM sections WHERE id = ? AND user_id = ? AND tab = 'apps'");
        $check->execute([$sectionId, $user['id']]);
        if (!$check->fetch()) json_error('Sectiune invalida', 404);

        $newId = gen_id();
        $now = time();
        $maxStmt = db()->prepare('SELECT COALESCE(MAX(position), -1) + 1 FROM apps WHERE section_id = ?');
        $maxStmt->execute([$sectionId]);
        $position = (int)$maxStmt->fetchColumn();

        $stmt = db()->prepare('INSERT INTO apps (id, section_id, user_id, name, url, description, access_user, color, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$newId, $sectionId, $user['id'], $name, $url, $description, $accessUser, $color, $position, $now, $now]);

        json_response(['ok' => true, 'id' => $newId]);
    }

    if ($method === 'PUT' && $id) {
        $body = read_json_body();
        $name = clean_string($body['name'] ?? null, 100);
        $url = clean_string($body['url'] ?? null, 500);
        $description = isset($body['description']) ? clean_string($body['description'], 500) : null;
        $accessUser = isset($body['access_user']) ? clean_string($body['access_user'], 200) : null;
        $color = $body['color'] ?? null;

        if (empty($name)) json_error('Nume invalid', 400);
        if (!validate_url($url)) json_error('URL invalid', 400);
        if (!validate_color($color)) json_error('Culoare invalida', 400);

        $stmt = db()->prepare('UPDATE apps SET name = ?, url = ?, description = ?, access_user = ?, color = ?, updated_at = ? WHERE id = ? AND user_id = ?');
        $stmt->execute([$name, $url, $description, $accessUser, $color, time(), $id, $user['id']]);
        if ($stmt->rowCount() === 0) json_error('Aplicatia nu exista', 404);

        json_response(['ok' => true]);
    }

    if ($method === 'DELETE' && $id) {
        $stmt = db()->prepare('DELETE FROM apps WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $user['id']]);
        json_response(['ok' => true]);
    }

    json_error('Method not allowed', 405);
}

// ---------- Favorites ----------

function route_favorites($method, $id) {
    $user = require_auth();

    if ($method === 'POST' && !$id) {
        $body = read_json_body();
        $sectionId = $body['section_id'] ?? null;
        $label = clean_string($body['label'] ?? null, 100);
        $url = clean_string($body['url'] ?? null, 500);
        $color = $body['color'] ?? null;

        if (empty($sectionId)) json_error('section_id invalid', 400);
        if (empty($label)) json_error('Eticheta invalida', 400);
        if (!validate_url($url)) json_error('URL invalid', 400);
        if (!validate_color($color)) json_error('Culoare invalida', 400);

        $check = db()->prepare("SELECT id FROM sections WHERE id = ? AND user_id = ? AND tab = 'favorites'");
        $check->execute([$sectionId, $user['id']]);
        if (!$check->fetch()) json_error('Sectiune favorit invalida', 404);

        $newId = gen_id();
        $now = time();
        $maxStmt = db()->prepare('SELECT COALESCE(MAX(position), -1) + 1 FROM favorites WHERE section_id = ?');
        $maxStmt->execute([$sectionId]);
        $position = (int)$maxStmt->fetchColumn();

        $stmt = db()->prepare('INSERT INTO favorites (id, section_id, user_id, label, url, color, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$newId, $sectionId, $user['id'], $label, $url, $color, $position, $now, $now]);

        json_response(['ok' => true, 'id' => $newId]);
    }

    if ($method === 'PUT' && $id) {
        $body = read_json_body();
        $label = clean_string($body['label'] ?? null, 100);
        $url = clean_string($body['url'] ?? null, 500);
        $color = $body['color'] ?? null;

        if (empty($label)) json_error('Eticheta invalida', 400);
        if (!validate_url($url)) json_error('URL invalid', 400);
        if (!validate_color($color)) json_error('Culoare invalida', 400);

        $stmt = db()->prepare('UPDATE favorites SET label = ?, url = ?, color = ?, updated_at = ? WHERE id = ? AND user_id = ?');
        $stmt->execute([$label, $url, $color, time(), $id, $user['id']]);
        if ($stmt->rowCount() === 0) json_error('Favoritul nu exista', 404);

        json_response(['ok' => true]);
    }

    if ($method === 'DELETE' && $id) {
        $stmt = db()->prepare('DELETE FROM favorites WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $user['id']]);
        json_response(['ok' => true]);
    }

    json_error('Method not allowed', 405);
}

// ---------- Questionnaires (html_app) ----------
// Completari multiple per chestionar. Sunt comune utilizatorilor aceleiasi firme (company_cui);
// un utilizator fara firma vede doar completarile proprii. Fiecare completare retine autorul si ultimul editor.

function validate_questionnaire_answers($answers) {
    if (!is_array($answers)) return null;
    $clean = [];
    foreach ($answers as $qid => $item) {
        if (!is_string($qid) || !preg_match('/^[A-Z][A-Za-z0-9.]{0,11}$/', $qid)) return null;
        if (!is_array($item)) return null;
        $row = [];
        if (array_key_exists('a', $item)) {
            if (!in_array($item['a'], ['da', 'partial', 'nu', 'na'], true)) return null;
            $row['a'] = $item['a'];
        }
        if (array_key_exists('n', $item)) {
            if (!is_string($item['n']) || mb_strlen($item['n']) > 300) return null;
            if ($item['n'] !== '') $row['n'] = $item['n'];
        }
        if ($row) $clean[$qid] = $row;
    }
    return $clean;
}

function questionnaire_scope($user) {
    $cui = clean_string($user['company_cui'] ?? null, 50);
    if ($cui !== null) return ['s.company_cui = ?', [$cui], $cui];
    return ['s.company_cui IS NULL AND s.user_id = ?', [(int)$user['id']], null];
}

function questionnaire_find($code, $id, $user) {
    list($where, $params) = questionnaire_scope($user);
    $stmt = db()->prepare("SELECT s.*, c.username AS created_by_name, u.username AS updated_by_name
        FROM questionnaire_sessions s
        LEFT JOIN users c ON c.id = s.user_id
        LEFT JOIN users u ON u.id = s.updated_by
        WHERE s.code = ? AND s.id = ? AND $where");
    $stmt->execute(array_merge([$code, $id], $params));
    return $stmt->fetch() ?: null;
}

function questionnaire_json($row, $withAnswers) {
    $out = [
        'id' => $row['id'],
        'name' => $row['name'],
        'status' => $row['status'],
        'created_at' => (int)$row['created_at'],
        'updated_at' => (int)$row['updated_at'],
        'finalized_at' => $row['finalized_at'] !== null ? (int)$row['finalized_at'] : null,
        'created_by' => $row['created_by_name'],
        'updated_by' => $row['updated_by_name'],
    ];
    if ($withAnswers) {
        $answers = json_decode($row['answers'], true);
        $out['answers'] = (object)(is_array($answers) ? $answers : []);
    }
    return $out;
}

function route_questionnaire($method, $code, $id) {
    $user = require_auth();
    list($where, $scopeParams, $cui) = questionnaire_scope($user);
    $now = time();

    if ($method === 'GET' && !$id) {
        $stmt = db()->prepare("SELECT s.*, c.username AS created_by_name, u.username AS updated_by_name
            FROM questionnaire_sessions s
            LEFT JOIN users c ON c.id = s.user_id
            LEFT JOIN users u ON u.id = s.updated_by
            WHERE s.code = ? AND $where ORDER BY s.updated_at DESC");
        $stmt->execute(array_merge([$code], $scopeParams));
        $list = [];
        foreach ($stmt->fetchAll() as $row) $list[] = questionnaire_json($row, false);
        json_response(['code' => $code, 'sessions' => $list]);
    }

    if ($method === 'POST' && !$id) {
        $body = read_json_body();
        $name = clean_string($body['name'] ?? null, 100);
        if ($name === null) json_error('Denumire invalida', 400);
        $answers = [];
        if (array_key_exists('answers', $body)) {
            $answers = validate_questionnaire_answers($body['answers']);
            if ($answers === null) json_error('Raspunsuri invalide', 400);
        }
        $newId = gen_id();
        $stmt = db()->prepare('INSERT INTO questionnaire_sessions (id, code, company_cui, user_id, updated_by, name, status, answers, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$newId, $code, $cui, $user['id'], $user['id'], $name, 'draft', json_encode((object)$answers, JSON_UNESCAPED_UNICODE), $now, $now]);
        json_response(['ok' => true, 'session' => questionnaire_json(questionnaire_find($code, $newId, $user), true)]);
    }

    if (!$id) json_error('Method not allowed', 405);

    $row = questionnaire_find($code, $id, $user);
    if (!$row) json_error('Completarea nu exista', 404);

    if ($method === 'GET') {
        json_response(['session' => questionnaire_json($row, true)]);
    }

    if ($method === 'PUT') {
        $body = read_json_body();
        $sets = [];
        $params = [];
        if (array_key_exists('name', $body)) {
            $name = clean_string($body['name'], 100);
            if ($name === null) json_error('Denumire invalida', 400);
            $sets[] = 'name = ?';
            $params[] = $name;
        }
        if (array_key_exists('status', $body)) {
            if (!in_array($body['status'], ['draft', 'final'], true)) json_error('Stare invalida', 400);
            $sets[] = 'status = ?';
            $params[] = $body['status'];
            $sets[] = 'finalized_at = ?';
            $params[] = $body['status'] === 'final' ? $now : null;
            $row['status'] = $body['status'];
        }
        if (array_key_exists('answers', $body)) {
            if ($row['status'] === 'final') json_error('Completarea este finalizata', 409);
            $answers = validate_questionnaire_answers($body['answers']);
            if ($answers === null) json_error('Raspunsuri invalide', 400);
            $json = json_encode((object)$answers, JSON_UNESCAPED_UNICODE);
            if (strlen($json) > 65536) json_error('Raspunsuri prea mari', 413);
            $sets[] = 'answers = ?';
            $params[] = $json;
        }
        if (!$sets) json_error('Nimic de modificat', 400);
        $sets[] = 'updated_by = ?';
        $params[] = $user['id'];
        $sets[] = 'updated_at = ?';
        $params[] = $now;
        $params[] = $id;
        db()->prepare('UPDATE questionnaire_sessions SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($params);
        json_response(['ok' => true, 'session' => questionnaire_json(questionnaire_find($code, $id, $user), false)]);
    }

    if ($method === 'DELETE') {
        db()->prepare('DELETE FROM questionnaire_sessions WHERE id = ?')->execute([$id]);
        json_response(['ok' => true]);
    }

    json_error('Method not allowed', 405);
}

// ---------- Admin ----------

function route_admin_users() {
    $admin = require_admin();
    
    // First admin (id=1) is super-admin and sees ALL users
    if ((int)$admin['id'] === 1) {
        $stmt = db()->query('SELECT id, username, role, email, first_name, last_name, company_cui, company_name, created_at FROM users ORDER BY created_at');
        $users = $stmt->fetchAll();
    } else {
        // Other admins see only users from their company
        $companyCui = $admin['company_cui'];
        if (empty($companyCui)) {
            // Admin has no company set - show only themselves
            $stmt = db()->prepare('SELECT id, username, role, email, first_name, last_name, company_cui, company_name, created_at FROM users WHERE id = ? ORDER BY created_at');
            $stmt->execute([$admin['id']]);
            $users = $stmt->fetchAll();
        } else {
            // Filter by company
            $stmt = db()->prepare('SELECT id, username, role, email, first_name, last_name, company_cui, company_name, created_at FROM users WHERE company_cui = ? ORDER BY created_at');
            $stmt->execute([$companyCui]);
            $users = $stmt->fetchAll();
        }
    }
    
    json_response(['users' => $users]);
}

function route_admin_users_create() {
    $admin = require_admin();
    $body = read_json_body();
    
    $username = clean_string($body['username'] ?? null, 100);
    $email = clean_string($body['email'] ?? null, 255);
    $firstName = clean_string($body['first_name'] ?? null, 100);
    $lastName = clean_string($body['last_name'] ?? null, 100);
    $password = $body['password'] ?? '';
    $role = $body['role'] ?? 'user';
    $companyCui = clean_string($body['company_cui'] ?? null, 20);
    $companyName = clean_string($body['company_name'] ?? null, 200);
    
    // Validations
    if (empty($username) || strlen($username) < 2) {
        json_error('Username invalid (minim 2 caractere)', 400);
    }
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_error('Email invalid', 400);
    }
    if (!is_string($password) || strlen($password) < 8) {
        json_error('Parola trebuie sa aiba minim 8 caractere)', 400);
    }
    if (!in_array($role, ['admin', 'user'], true)) {
        json_error('Rol invalid (admin sau user)', 400);
    }
    
    // If creating admin, check max 2 admins per company
    if ($role === 'admin' && !empty($companyCui)) {
        $stmt = db()->prepare('SELECT COUNT(*) FROM users WHERE company_cui = ? AND role = ?');
        $stmt->execute([$companyCui, 'admin']);
        $adminCount = (int)$stmt->fetchColumn();
        if ($adminCount >= 2) {
            json_error('Maxim 2 admini per companie', 400);
        }
    }
    
    // Check username uniqueness
    $stmt = db()->prepare('SELECT COUNT(*) FROM users WHERE username = ?');
    $stmt->execute([$username]);
    if ((int)$stmt->fetchColumn() > 0) {
        json_error('Username deja existent', 400);
    }
    
    db()->beginTransaction();
    try {
        $now = time();
        // Always use 'SchimbaParola' as temporary password - user must change on first login
        $tempPassword = 'SchimbaParola';
        $stmt = db()->prepare('INSERT INTO users (username, email, first_name, last_name, password_hash, role, company_cui, company_name, password_changed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$username, $email, $firstName, $lastName, hash_password($tempPassword), $role, $companyCui, $companyName, 0, $now, $now]);
        $uid = (int)db()->lastInsertId();
        db()->commit();
        
        // Send welcome email with credentials
        try {
            // Load email template
            $config = config();
            $templatePath = $config['email_template_path'];
            
            if (file_exists($templatePath)) {
                $emailContent = file_get_contents($templatePath);
                
                // Replace placeholders
                $emailContent = str_replace('[NUME_UTILIZATOR]', htmlspecialchars($username), $emailContent);
                $emailContent = str_replace('[USERNAME]', htmlspecialchars($username), $emailContent);
                $emailContent = str_replace('[PAROLA_TEMPORARA]', htmlspecialchars($tempPassword), $emailContent);
                
                // Prepare email
                $to = $username . '@' . ($companyName ?? 'company.ro');
                $subject = '🚀 Bine ai venit în Portalul smartBIZ - Datele tale de acces';
                $from = 'ofertare@aiall.ro';
                
                // Headers for HTML email
                $headers = [
                    'MIME-Version: 1.0',
                    'Content-type: text/html; charset=UTF-8',
                    'From: AiALL Portal <' . $from . '>',
                    'Reply-To: ' . $from,
                    'X-Mailer: PHP/' . phpversion()
                ];
                
                // Send email
                mail($to, $subject, $emailContent, implode("\r\n", $headers));
            }
        } catch (Exception $e) {
            // Email sending failed but user was created - don't fail the whole operation
            error_log('Email sending failed after user creation: ' . $e->getMessage());
        }
        
        json_response([
            'user' => [
                'id' => $uid,
                'username' => $username,
                'email' => $email,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'role' => $role,
                'company_cui' => $companyCui,
                'company_name' => $companyName,
                'created_at' => $now
            ]
        ]);
    } catch (Throwable $e) {
        if (db()->inTransaction()) db()->rollBack();
        throw $e;
    }
}

function route_admin_users_update() {
    $admin = require_admin();
    $userId = (int)($_GET['id'] ?? 0);
    
    if ($userId < 1) {
        json_error('ID utilizator invalid', 400);
    }
    
    $body = read_json_body();
    
    // Get current user data
    $stmt = db()->prepare('SELECT id, username, email, first_name, last_name, role, company_cui, company_name FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        json_error('Utilizator inexistent', 404);
    }
    
    // Check if admin can edit this user (same company or super-admin)
    $isSuperAdmin = (int)$admin['id'] === 1;
    if (!$isSuperAdmin && !empty($admin['company_cui']) && $user['company_cui'] !== $admin['company_cui']) {
        json_error('Nu puteti edita utilizatori din alta companie', 403);
    }
    
    // Parse updates
    $email = isset($body['email']) ? clean_string($body['email'], 255) : $user['email'];
    $firstName = isset($body['first_name']) ? clean_string($body['first_name'], 100) : ($user['first_name'] ?? null);
    $lastName = isset($body['last_name']) ? clean_string($body['last_name'], 100) : ($user['last_name'] ?? null);
    $role = $body['role'] ?? $user['role'];
    $companyCui = isset($body['company_cui']) ? clean_string($body['company_cui'], 20) : $user['company_cui'];
    $companyName = isset($body['company_name']) ? clean_string($body['company_name'], 200) : $user['company_name'];
    
    // Validate email if provided
    if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_error('Email invalid', 400);
    }
    
    if (!in_array($role, ['admin', 'user'], true)) {
        json_error('Rol invalid', 400);
    }
    
    // If promoting to admin, check max 2 admins per company
    if ($role === 'admin' && $user['role'] !== 'admin' && !empty($companyCui)) {
        $stmt = db()->prepare('SELECT COUNT(*) FROM users WHERE company_cui = ? AND role = ?');
        $stmt->execute([$companyCui, 'admin']);
        $adminCount = (int)$stmt->fetchColumn();
        if ($adminCount >= 2) {
            json_error('Maxim 2 admini per companie', 400);
        }
    }
    
    $stmt = db()->prepare('UPDATE users SET email = ?, first_name = ?, last_name = ?, role = ?, company_cui = ?, company_name = ?, updated_at = ? WHERE id = ?');
    $stmt->execute([$email, $firstName, $lastName, $role, $companyCui, $companyName, time(), $userId]);
    
    json_response(['ok' => true]);
}

function route_admin_users_delete() {
    $admin = require_admin();
    $userId = (int)($_GET['id'] ?? 0);
    
    if ($userId < 1) {
        json_error('ID utilizator invalid', 400);
    }
    
    // Can't delete yourself
    if ($userId === (int)$admin['id']) {
        json_error('Nu te poti sterge pe tine insuti', 400);
    }
    
    // Get user to delete
    $stmt = db()->prepare('SELECT id, company_cui, role FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        json_error('Utilizator inexistent', 404);
    }
    
    // Check if admin can delete this user (same company or super-admin)
    $isSuperAdmin = (int)$admin['id'] === 1;
    if (!$isSuperAdmin && !empty($admin['company_cui']) && $user['company_cui'] !== $admin['company_cui']) {
        json_error('Nu puteti sterge utilizatori din alta companie', 403);
    }
    
    // Check if this is the last admin of the company
    if ($user['role'] === 'admin' && !empty($user['company_cui'])) {
        $stmt = db()->prepare('SELECT COUNT(*) FROM users WHERE company_cui = ? AND role = ?');
        $stmt->execute([$user['company_cui'], 'admin']);
        $adminCount = (int)$stmt->fetchColumn();
        if ($adminCount <= 1) {
            json_error('Nu puteti sterge ultimul admin al companiei', 400);
        }
    }
    
    $stmt = db()->prepare('DELETE FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    
    json_response(['ok' => true]);
}

function route_admin_view_as() {
    $admin = require_admin();
    $userId = (int)($_GET['id'] ?? 0);
    
    if ($userId < 1) {
        json_error('ID utilizator invalid', 400);
    }
    
    // Can't view as yourself
    if ($userId === (int)$admin['id']) {
        json_error('Nu poti vizualiza ca tine insuti', 400);
    }
    
    // Get target user
    $stmt = db()->prepare('SELECT id, username, role, company_cui, company_name FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $targetUser = $stmt->fetch();
    
    if (!$targetUser) {
        json_error('Utilizator inexistent', 404);
    }
    
    // Check if admin can view as this user (same company or super-admin)
    $isSuperAdmin = (int)$admin['id'] === 1;
    if (!$isSuperAdmin && !empty($admin['company_cui']) && $targetUser['company_cui'] !== $admin['company_cui']) {
        json_error('Nu puteti vizualiza utilizatori din alta companie', 403);
    }
    
    // Store original admin ID in session
    $_SESSION['original_admin_id'] = $admin['id'];
    $_SESSION['viewing_as_user_id'] = $userId;
    
    // Create new JWT token for target user
    $config = config();
    $token = jwt_create(['uid' => $userId, 'viewing_as' => true, 'original_admin_id' => $admin['id']], $config['jwt_secret'], $config['cookie_lifetime']);
    set_session_cookie($token);
    
    json_response(['ok' => true, 'user_id' => $userId]);
}

function route_admin_return_from_view_as() {
    // Get original admin ID from session or JWT
    $originalAdminId = $_SESSION['original_admin_id'] ?? null;
    
    if (!$originalAdminId) {
        // Try to get from JWT
        $jwt = get_session_cookie();
        if ($jwt) {
            $config = config();
            $payload = jwt_decode($jwt, $config['jwt_secret']);
            $originalAdminId = $payload['original_admin_id'] ?? null;
        }
    }
    
    if (!$originalAdminId) {
        json_error('Nu sunteti in modul de vizualizare', 400);
    }
    
    // Verify original admin still exists
    $stmt = db()->prepare('SELECT id, username, role FROM users WHERE id = ? AND role = ?');
    $stmt->execute([$originalAdminId, 'admin']);
    $admin = $stmt->fetch();
    
    if (!$admin) {
        json_error('Adminul original nu mai exista', 404);
    }
    
    // Clear viewing-as session data
    unset($_SESSION['original_admin_id']);
    unset($_SESSION['viewing_as_user_id']);
    
    // Create new JWT token for original admin
    $config = config();
    $token = jwt_create(['uid' => $originalAdminId], $config['jwt_secret'], $config['cookie_lifetime']);
    set_session_cookie($token);
    
    json_response(['ok' => true, 'admin_id' => $originalAdminId]);
}

function route_admin_import() {
    $admin = require_admin();
    $body = read_json_body();
    
    $userId = (int)($body['user_id'] ?? 0);
    $data = $body['data'] ?? null;
    
    if ($userId < 1 || !$data) {
        json_error('Date invalide', 400);
    }
    
    // Check if admin can manage this user
    $isSuperAdmin = (int)$admin['id'] === 1;
    $stmt = db()->prepare('SELECT company_cui FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $targetUser = $stmt->fetch();
    
    if (!$targetUser) {
        json_error('Utilizator inexistent', 404);
    }
    
    if (!$isSuperAdmin && $targetUser['company_cui'] !== $admin['company_cui']) {
        json_error('Nu puteti importa pentru utilizatori din alta companie', 403);
    }
    
    db()->beginTransaction();
    try {
        $now = time();
        
        // Import apps
        if (!empty($data['apps'])) {
            $sectionMap = []; // section_name => section_id
            
            foreach ($data['apps'] as $app) {
                $sectionName = $app['section'] ?? 'General';
                
                // Get or create section
                if (!isset($sectionMap[$sectionName])) {
                    $stmt = db()->prepare('SELECT id FROM sections WHERE user_id = ? AND name = ? AND tab = ?');
                    $stmt->execute([$userId, $sectionName, 'apps']);
                    $section = $stmt->fetch();
                    
                    if (!$section) {
                        $sectionId = bin2hex(random_bytes(8));
                        $stmt = db()->prepare('INSERT INTO sections (id, user_id, name, color, icon, tab, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)');
                        $stmt->execute([
                            $sectionId,
                            $userId,
                            $sectionName,
                            $app['section_color'] ?? '#2D8B8E',
                            $app['section_icon'] ?? 'folder',
                            'apps',
                            $now,
                            $now
                        ]);
                    } else {
                        $sectionId = $section['id'];
                    }
                    
                    $sectionMap[$sectionName] = $sectionId;
                }
                
                // Create app
                $appId = bin2hex(random_bytes(8));
                $stmt = db()->prepare('INSERT INTO apps (id, section_id, user_id, name, url, description, color, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)');
                $stmt->execute([
                    $appId,
                    $sectionMap[$sectionName],
                    $userId,
                    $app['name'] ?? 'App',
                    $app['url'] ?? '',
                    $app['description'] ?? '',
                    $app['color'] ?? '#2D8B8E',
                    $now,
                    $now
                ]);
            }
        }
        
        // Import favorites
        if (!empty($data['favorites'])) {
            $sectionMap = [];
            
            foreach ($data['favorites'] as $fav) {
                $sectionName = $fav['section'] ?? 'General';
                
                if (!isset($sectionMap[$sectionName])) {
                    $stmt = db()->prepare('SELECT id FROM sections WHERE user_id = ? AND name = ? AND tab = ?');
                    $stmt->execute([$userId, $sectionName, 'favorites']);
                    $section = $stmt->fetch();
                    
                    if (!$section) {
                        $sectionId = bin2hex(random_bytes(8));
                        $stmt = db()->prepare('INSERT INTO sections (id, user_id, name, color, icon, tab, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)');
                        $stmt->execute([
                            $sectionId,
                            $userId,
                            $sectionName,
                            $fav['section_color'] ?? '#d97706',
                            'star',
                            'favorites',
                            $now,
                            $now
                        ]);
                    } else {
                        $sectionId = $section['id'];
                    }
                    
                    $sectionMap[$sectionName] = $sectionId;
                }
                
                $favId = bin2hex(random_bytes(8));
                $stmt = db()->prepare('INSERT INTO favorites (id, section_id, user_id, label, url, color, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)');
                $stmt->execute([
                    $favId,
                    $sectionMap[$sectionName],
                    $userId,
                    $fav['label'] ?? 'Link',
                    $fav['url'] ?? '',
                    $fav['color'] ?? '#d97706',
                    $now,
                    $now
                ]);
            }
        }
        
        db()->commit();
        json_response(['ok' => true]);
    } catch (Throwable $e) {
        if (db()->inTransaction()) db()->rollBack();
        throw $e;
    }
}




// Change own password
function route_change_password() {
    $user = require_auth();
    $body = read_json_body();
    
    $currentPassword = $body['current_password'] ?? '';
    $newPassword = $body['new_password'] ?? '';
    
    if (strlen($newPassword) < 8) {
        json_error('Parola noua trebuie sa aiba minim 8 caractere', 400);
    }
    
    // Verify current password
    $stmt = db()->prepare('SELECT password_hash FROM users WHERE id = ?');
    $stmt->execute([$user['id']]);
    $row = $stmt->fetch();
    
    if (!$row || !password_verify($currentPassword, $row['password_hash'])) {
        json_error('Parola curenta incorecta', 401);
    }
    
    // Hash new password
    $hashedPassword = password_hash($newPassword, PASSWORD_ARGON2ID);
    
    // Update password and set password_changed flag
    $stmt = db()->prepare('UPDATE users SET password_hash = ?, password_changed = 1, updated_at = ? WHERE id = ?');
    $stmt->execute([$hashedPassword, time(), $user['id']]);
    
    json_response(['ok' => true]);
}

// Admin reset user password
function route_admin_reset_password() {
    $admin = require_admin();
    $body = read_json_body();
    
    $userId = (int)($body['user_id'] ?? 0);
    $newPassword = $body['new_password'] ?? '';
    
    if ($userId < 1) {
        json_error('ID utilizator invalid', 400);
    }
    
    if (strlen($newPassword) < 8) {
        json_error('Parola trebuie sa aiba minim 8 caractere', 400);
    }
    
    // Get user to reset
    $stmt = db()->prepare('SELECT id, company_cui FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        json_error('Utilizator inexistent', 404);
    }
    
    // Check permissions (same company or super-admin)
    $isSuperAdmin = (int)$admin['id'] === 1;
    if (!$isSuperAdmin && $user['company_cui'] !== $admin['company_cui']) {
        json_error('Nu puteti reseta parola pentru utilizatori din alta companie', 403);
    }
    
    // Always use 'SchimbaParola' as temporary password - user must change on next login
    $tempPassword = 'SchimbaParola';
    $hashedPassword = password_hash($tempPassword, PASSWORD_ARGON2ID);
    
    // Update password and set password_changed = 0 (force change on next login)
    $stmt = db()->prepare('UPDATE users SET password_hash = ?, password_changed = 0, updated_at = ? WHERE id = ?');
    $stmt->execute([$hashedPassword, time(), $userId]);
    
    // Send email notification with temporary password
    try {
        // Get full user details for email
        $stmt = db()->prepare('SELECT username, company_name FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $userDetails = $stmt->fetch();
        
        if ($userDetails) {
            // Load email template
            $config = config();
            $templatePath = $config['email_template_path'];
            
            if (file_exists($templatePath)) {
                $emailContent = file_get_contents($templatePath);
                
                // Replace placeholders
                $emailContent = str_replace('[NUME_UTILIZATOR]', htmlspecialchars($userDetails['username']), $emailContent);
                $emailContent = str_replace('[USERNAME]', htmlspecialchars($userDetails['username']), $emailContent);
                $emailContent = str_replace('[PAROLA_TEMPORARA]', htmlspecialchars($tempPassword), $emailContent);
                
                // Prepare email
                $to = $userDetails['username'] . '@' . ($userDetails['company_name'] ?? 'company.ro');
                $subject = '🔑 Parola ta a fost resetată - Portalul smartBIZ';
                $from = 'ofertare@aiall.ro';
                
                // Headers for HTML email
                $headers = [
                    'MIME-Version: 1.0',
                    'Content-type: text/html; charset=UTF-8',
                    'From: AiALL Portal <' . $from . '>',
                    'Reply-To: ' . $from,
                    'X-Mailer: PHP/' . phpversion()
                ];
                
                // Send email
                mail($to, $subject, $emailContent, implode("\r\n", $headers));
            }
        }
    } catch (Exception $e) {
        // Email sending failed but password was reset - don't fail the whole operation
        error_log('Email sending failed after password reset: ' . $e->getMessage());
    }
    
    json_response(['ok' => true, 'message' => 'Parola resetată și email trimis cu succes']);
}

function route_admin_send_email() {
    $admin = require_admin();
    
    // Include send_email.php
    require __DIR__ . '/send_email.php';
};
