<?php
// =============================================================
// Launch Portal API — Entry Point
// =============================================================

require_once __DIR__ . '/lib.php';
require_once __DIR__ . '/routes.php';

$config = config();

// CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin === $config['cors_origin']) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
    header('Access-Control-Max-Age: 86400');
    header('Vary: Origin');
}

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Security headers
header_remove('X-Powered-By');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'");

// Path normalization
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = preg_replace('#^/api/?#', '/', $path);
$path = '/' . trim($path, '/');
$method = $_SERVER['REQUEST_METHOD'];

// Init DB (creates schema on first run)
db();

// Routing
try {
    if ($path === '/setup') {
        if ($method === 'POST') route_setup();
        else json_error('Method not allowed', 405);
    } elseif ($path === '/login') {
        if ($method === 'POST') route_login();
        else json_error('Method not allowed', 405);
    } elseif ($path === '/logout') {
        if ($method === 'POST') route_logout();
        else json_error('Method not allowed', 405);
    } elseif ($path === '/me') {
        if ($method === 'GET') route_me();
        else json_error('Method not allowed', 405);
    } elseif ($path === '/data') {
        if ($method === 'GET') route_data();
        else json_error('Method not allowed', 405);
    } elseif (preg_match('#^/sections/?(.*)$#', $path, $m)) {
        route_sections($method, $m[1] ?: null);
    } elseif (preg_match('#^/apps/?(.*)$#', $path, $m)) {
        route_apps($method, $m[1] ?: null);
    } elseif (preg_match('#^/favorites/?(.*)$#', $path, $m)) {
        route_favorites($method, $m[1] ?: null);
    } elseif (preg_match('#^/questionnaires/([a-z0-9-]{1,40})(?:/([a-f0-9]{16}))?$#', $path, $m)) {
        route_questionnaire($method, $m[1], $m[2] ?? null);
    } elseif ($path === '/admin/users') {
        if ($method === 'GET') route_admin_users();
        elseif ($method === 'POST') route_admin_users_create();
        else json_error('Method not allowed', 405);
    } elseif (preg_match('#^/admin/users/(\d+)$#', $path, $m)) {
        $_GET['id'] = $m[1];
        if ($method === 'PUT') route_admin_users_update();
        elseif ($method === 'DELETE') route_admin_users_delete();
        else json_error('Method not allowed', 405);
    } elseif (preg_match('#^/admin/view-as/(\d+)$#', $path, $m)) {
        $_GET['id'] = $m[1];
        if ($method === 'POST') route_admin_view_as();
        else json_error('Method not allowed', 405);
    } elseif ($path === '/admin/return-from-view-as' && $method === 'POST') {
        route_admin_return_from_view_as();
    } elseif ($path === '/admin/import' && $method === 'POST') {
        route_admin_import();
    } elseif ($path === '/change-password' && $method === 'POST') {
        route_change_password();
    } elseif ($path === '/admin/reset-password' && $method === 'POST') {
        route_admin_reset_password();
    } elseif ($path === '/admin/send-email' && $method === 'POST') {
        require __DIR__ . '/send_email.php';
    } else {
        json_error('Not found', 404);
    }
} catch (Throwable $e) {
    error_log('Portal API: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
    json_error('Server error', 500);
}
