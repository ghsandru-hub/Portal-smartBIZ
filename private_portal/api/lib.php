<?php
// =============================================================
// Launch Portal — Library
// Database, JWT, authentication, and HTTP helpers.
// =============================================================



// ---------- Config ----------

function config() {
    static $config = null;
    if ($config === null) {
        $config = require __DIR__ . '/config.php';
    }
    return $config;
}

// ---------- Database ----------

function db() {
    static $pdo = null;
    if ($pdo) return $pdo;

    $config = config();
    $path = $config['db_path'];
    $needsInit = !file_exists($path);

    if ($needsInit) {
        $dir = dirname($path);
        if (!is_dir($dir)) {
            @mkdir($dir, 0700, true);
        }
    }

    $pdo = new PDO('sqlite:' . $path, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('PRAGMA journal_mode = WAL');

    if ($needsInit) {
        db_init_schema($pdo);
        @chmod($path, 0600);
    } else {
        db_migrate($pdo);
    }

    return $pdo;
}

function db_init_schema($pdo) {
    $pdo->exec("
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            company_cui TEXT,
            company_name TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );
        CREATE TABLE sections (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            color TEXT NOT NULL,
            icon TEXT NOT NULL DEFAULT 'folder',
            tab TEXT NOT NULL DEFAULT 'apps',
            position INTEGER DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE apps (
            id TEXT PRIMARY KEY,
            section_id TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            description TEXT,
            access_user TEXT,
            color TEXT NOT NULL,
            position INTEGER DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE favorites (
            id TEXT PRIMARY KEY,
            section_id TEXT,
            user_id INTEGER NOT NULL,
            label TEXT NOT NULL,
            url TEXT NOT NULL,
            color TEXT NOT NULL,
            position INTEGER DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE login_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip TEXT NOT NULL,
            attempted_at INTEGER NOT NULL,
            success INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX idx_login_attempts_ip ON login_attempts(ip, attempted_at);
        CREATE INDEX idx_sections_user ON sections(user_id, tab, position);
        CREATE INDEX idx_apps_section ON apps(section_id, position);
        CREATE INDEX idx_favorites_user ON favorites(user_id, position);
        CREATE INDEX idx_favorites_section ON favorites(section_id, position);
        CREATE INDEX idx_users_company ON users(company_cui);
        CREATE TABLE questionnaire_responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            code TEXT NOT NULL,
            answers TEXT NOT NULL DEFAULT '{}',
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            UNIQUE (user_id, code),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        PRAGMA user_version = 3;
    ");
}

function db_migrate($pdo) {
    $version = (int)$pdo->query('PRAGMA user_version')->fetchColumn();
    if ($version < 1) {
        $secCols = array_column($pdo->query("PRAGMA table_info(sections)")->fetchAll(), 'name');
        if (!in_array('icon', $secCols, true)) {
            $pdo->exec("ALTER TABLE sections ADD COLUMN icon TEXT NOT NULL DEFAULT 'folder'");
        }
        if (!in_array('tab', $secCols, true)) {
            $pdo->exec("ALTER TABLE sections ADD COLUMN tab TEXT NOT NULL DEFAULT 'apps'");
        }
        $appCols = array_column($pdo->query("PRAGMA table_info(apps)")->fetchAll(), 'name');
        if (!in_array('access_user', $appCols, true)) {
            $pdo->exec("ALTER TABLE apps ADD COLUMN access_user TEXT");
        }
        $favCols = array_column($pdo->query("PRAGMA table_info(favorites)")->fetchAll(), 'name');
        if (!in_array('section_id', $favCols, true)) {
            $pdo->exec("ALTER TABLE favorites ADD COLUMN section_id TEXT");
        }
        $pdo->exec('PRAGMA user_version = 1');
    }
    if ($version < 2) {
        $userCols = array_column($pdo->query("PRAGMA table_info(users)")->fetchAll(), 'name');
        $now = time();
        if (!in_array('role', $userCols, true)) {
            $pdo->exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
            // First user becomes admin
            $pdo->exec("UPDATE users SET role = 'admin' WHERE id = 1");
        }
        if (!in_array('company_cui', $userCols, true)) {
            $pdo->exec("ALTER TABLE users ADD COLUMN company_cui TEXT");
        }
        if (!in_array('company_name', $userCols, true)) {
            $pdo->exec("ALTER TABLE users ADD COLUMN company_name TEXT");
        }
        if (!in_array('updated_at', $userCols, true)) {
            $pdo->exec("ALTER TABLE users ADD COLUMN updated_at INTEGER DEFAULT $now");
        }
        // Create index for company_cui
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_cui)");
        $pdo->exec('PRAGMA user_version = 2');
    }
    if ($version < 3) {
        // Raspunsurile chestionarelor din html_app, un rand per utilizator si cod de chestionar
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS questionnaire_responses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                code TEXT NOT NULL,
                answers TEXT NOT NULL DEFAULT '{}',
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                UNIQUE (user_id, code),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ");
        $pdo->exec('PRAGMA user_version = 3');
    }
}

// ---------- JWT (HS256) ----------

function jwt_b64encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function jwt_b64decode($data) {
    $remainder = strlen($data) % 4;
    if ($remainder) $data .= str_repeat('=', 4 - $remainder);
    return base64_decode(strtr($data, '-_', '+/'));
}

function jwt_create($payload, $secret, $lifetime) {
    $header = ['typ' => 'JWT', 'alg' => 'HS256'];
    $payload['iat'] = time();
    $payload['exp'] = time() + $lifetime;
    $h = jwt_b64encode(json_encode($header));
    $p = jwt_b64encode(json_encode($payload));
    $sig = hash_hmac('sha256', "$h.$p", $secret, true);
    return "$h.$p." . jwt_b64encode($sig);
}

function jwt_verify($token, $secret) {
    if (!is_string($token) || empty($token)) return null;
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    list($h, $p, $sig) = $parts;
    $expected = jwt_b64encode(hash_hmac('sha256', "$h.$p", $secret, true));
    if (!hash_equals($expected, $sig)) return null;
    $payload = json_decode(jwt_b64decode($p), true);
    if (!$payload || empty($payload['exp']) || $payload['exp'] < time()) return null;
    return $payload;
}

// ---------- Authentication ----------

function hash_password($password) {
    if (defined('PASSWORD_ARGON2ID')) {
        return password_hash($password, PASSWORD_ARGON2ID);
    }
    return password_hash($password, PASSWORD_BCRYPT);
}

function verify_password($password, $hash) {
    return password_verify($password, $hash);
}

function set_session_cookie($token) {
    $config = config();
    $params = [
        'expires' => time() + $config['cookie_lifetime'],
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ];
    if (!empty($config['cookie_domain'])) {
        $params['domain'] = $config['cookie_domain'];
    }
    setcookie($config['cookie_name'], $token, $params);
}

function clear_session_cookie() {
    $config = config();
    $params = [
        'expires' => time() - 3600,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ];
    if (!empty($config['cookie_domain'])) {
        $params['domain'] = $config['cookie_domain'];
    }
    setcookie($config['cookie_name'], '', $params);
}

function current_user() {
    $config = config();
    $name = $config['cookie_name'];
    if (empty($_COOKIE[$name])) return null;
    $payload = jwt_verify($_COOKIE[$name], $config['jwt_secret']);
    if (!$payload || empty($payload['uid'])) return null;
    $stmt = db()->prepare('SELECT id, username, role, company_cui, company_name, password_changed FROM users WHERE id = ?');
    $stmt->execute([$payload['uid']]);
    return $stmt->fetch() ?: null;
}

function require_auth() {
    $user = current_user();
    if (!$user) json_error('Unauthorized', 401);
    return $user;
}

function require_admin() {
    $user = require_auth();
    if ($user['role'] !== 'admin') json_error('Forbidden - Admin only', 403);
    return $user;
}

function get_user_company($user_id) {
    $stmt = db()->prepare('SELECT company_cui, company_name FROM users WHERE id = ?');
    $stmt->execute([$user_id]);
    return $stmt->fetch() ?: null;
}

// ---------- Rate Limiting ----------

function check_rate_limit($ip) {
    $config = config();
    $maxAttempts = $config['login_max_attempts'] ?? 5;
    $window = $config['login_window_seconds'] ?? 900;
    $cutoff = time() - $window;
    
    $stmt = db()->prepare('SELECT COUNT(*) FROM login_attempts WHERE ip = ? AND attempted_at > ? AND success = 0');
    $stmt->execute([$ip, $cutoff]);
    $failedAttempts = (int)$stmt->fetchColumn();
    
    // Return TRUE if under limit (allows login)
    // Return FALSE if at or over limit (blocks login)
    return $failedAttempts < $maxAttempts;
}

function record_login_attempt($ip, $success) {
    $stmt = db()->prepare('INSERT INTO login_attempts (ip, attempted_at, success) VALUES (?, ?, ?)');
    $stmt->execute([$ip, time(), $success ? 1 : 0]);
    if (rand(1, 100) === 1) {
        db()->exec('DELETE FROM login_attempts WHERE attempted_at < ' . (time() - 86400));
    }
}

function get_client_ip() {
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'] as $h) {
        if (!empty($_SERVER[$h])) {
            return trim(explode(',', $_SERVER[$h])[0]);
        }
    }
    return '0.0.0.0';
}

// ---------- HTTP Helpers ----------

function json_response($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function json_error($message, $status = 400) {
    json_response(['error' => $message], $status);
}

function read_json_body() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) return [];
    $data = json_decode($raw, true);
    if (!is_array($data)) json_error('Invalid JSON body', 400);
    return $data;
}

// ---------- Validation ----------

function gen_id() {
    return bin2hex(random_bytes(8));
}

function clean_string($value, $max = 255) {
    if (!is_string($value)) return null;
    $value = trim($value);
    if ($value === '' || mb_strlen($value) > $max) return null;
    return $value;
}

function validate_color($color) {
    return is_string($color) && preg_match('/^#[0-9a-fA-F]{6}$/', $color);
}

function validate_url($url) {
    if (!is_string($url) || empty($url)) return false;
    if (preg_match('#^(?:agentsaga|sagabulk)://start$#i', $url)) return true;
    if (!preg_match('#^https?://#i', $url)) return false;
    return filter_var($url, FILTER_VALIDATE_URL) !== false;
}

function validate_icon($icon) {
    if (!is_string($icon) || $icon === '') return false;
    if (strlen($icon) > 50) return false;
    return preg_match('/^[a-z0-9-]+$/', $icon) === 1;
}

function validate_tab($tab) {
    return $tab === 'apps' || $tab === 'favorites';
}
