<?php
/**
 * Public API Entry Point
 * 
 * This file is in the public folder but includes code from private folder
 * Structure:
 * - This file: /home/aiallro/sbcportal.aiall.ro/api/index.php
 * - Includes from: /home/aiallro/private_portal/api/
 */

// Include the actual API from private folder
$privatePath = dirname(dirname(dirname(__FILE__))) . '/private_portal/api/index.php';

if (!file_exists($privatePath)) {
    http_response_code(500);
    die('API configuration error - private path not found');
}

require $privatePath;
