<?php
/**
 * Assets Server
 * Serves static files from private folder
 */

// Get requested file
$file = $_GET['file'] ?? '';

// Security: only allow specific extensions
$allowedExtensions = ['js', 'css', 'html'];
$ext = pathinfo($file, PATHINFO_EXTENSION);

if (!in_array($ext, $allowedExtensions)) {
    http_response_code(403);
    die('Forbidden');
}

// Security: prevent directory traversal
$file = basename($file);

// Build path to private portal folder
$privatePath = dirname(dirname(__FILE__)) . '/private_portal/portal/' . $file;

if (!file_exists($privatePath)) {
    http_response_code(404);
    die('Not Found');
}

// Set appropriate content type
$contentTypes = [
    'js' => 'application/javascript',
    'css' => 'text/css',
    'html' => 'text/html'
];

header('Content-Type: ' . $contentTypes[$ext]);

// Cache headers for static assets
header('Cache-Control: public, max-age=86400'); // 1 day

// Output file
readfile($privatePath);
