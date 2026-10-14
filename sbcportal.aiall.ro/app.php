<?php
/**
 * app.php — Gatekeeper pentru aplicațiile HTML din private_portal/html_app
 *
 * Amplasare: în webroot-ul public, lângă assets.php
 *   /home/aiallro/sbcportal.aiall.ro/app.php
 *
 * Refolosește autentificarea portalului (același cookie JWT, prin current_user()).
 * Servește fișierele HTML private DOAR utilizatorilor logați.
 *
 * Lansare din portal: https://sbcportal.aiall.ro/app.php?f=buget
 *                      https://sbcportal.aiall.ro/app.php?f=chestionar
 */

require_once dirname(dirname(__FILE__)) . '/private_portal/api/lib.php';

// 1) Verifică login-ul portalului (același cookie ca în API)
$user = current_user();
if (!$user) {
    http_response_code(401);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><meta charset="utf-8">'
       . '<p style="font:16px/1.5 system-ui,sans-serif;padding:2rem">'
       . 'Sesiune expirată sau neautentificat. '
       . '<a href="/">Autentifică-te în portal</a> și reîncearcă.</p>';
    exit;
}

// 2) Whitelist: cheie URL curată  ->  nume fișier real din html_app
//    (cheia ascunde numele real și elimină problema spațiului din nume)
$apps = [
    'buget'      => 'buget_manopera_v1.html',
    'certificat' => 'smartbiz_certificat_licenta.html',
    'chestionar' => 'chestionar-cae-rm-01.html',
    // 'dashboard'  => 'Dashboard_Recurenta_vs_Goluri.html',
];

$key = $_GET['f'] ?? '';
if (!isset($apps[$key])) {
    http_response_code(404);
    exit('App inexistentă');
}

// 3) (opțional) acces pe rol / pe utilizator
//    Decomentează ca să restricționezi un app doar la admini:
// if ($user['role'] !== 'admin') { http_response_code(403); exit('Acces interzis'); }

// 4) Rezolvă calea și verifică să rămână în html_app (anti path-traversal)
$baseDir = dirname(dirname(__FILE__)) . '/private_portal/html_app/';
$real    = realpath($baseDir);
$path    = realpath($baseDir . $apps[$key]);

if ($path === false || $real === false
    || strpos($path, $real . DIRECTORY_SEPARATOR) !== 0
    || !is_file($path)) {
    http_response_code(404);
    exit('Fișier lipsă');
}

// 5) Servește HTML-ul
header('Content-Type: text/html; charset=utf-8');
header('X-Frame-Options: SAMEORIGIN');
header('Cache-Control: private, no-store');
readfile($path);
