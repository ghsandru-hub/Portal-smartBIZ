<?php
/**
 * Email Sender with Microsoft Graph API
 * Versiune simplificată și robustă
 */

// Error handling
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Include dependencies
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib.php';

header('Content-Type: application/json');

/**
 * Get Microsoft Graph access token
 */
function getGraphToken($config) {
    $tenantId = $config['graph']['tenant_id'] ?? '';
    $clientId = $config['graph']['client_id'] ?? '';
    $clientSecret = $config['graph']['client_secret'] ?? '';
    
    if (empty($tenantId) || empty($clientId) || empty($clientSecret)) {
        throw new Exception('Graph API credentials missing in config');
    }
    
    $url = "https://login.microsoftonline.com/{$tenantId}/oauth2/v2.0/token";
    
    $postData = http_build_query([
        'client_id' => $clientId,
        'client_secret' => $clientSecret,
        'scope' => 'https://graph.microsoft.com/.default',
        'grant_type' => 'client_credentials'
    ]);
    
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $postData,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
        CURLOPT_TIMEOUT => 30
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        throw new Exception("cURL error: {$curlError}");
    }
    
    if ($httpCode !== 200) {
        throw new Exception("Token request failed: HTTP {$httpCode}");
    }
    
    $data = json_decode($response, true);
    
    if (!isset($data['access_token'])) {
        throw new Exception("No access token in response");
    }
    
    return $data['access_token'];
}

/**
 * Send email via Microsoft Graph API
 */
function sendViaGraph($config, $to, $subject, $htmlContent, $attachments = []) {
    $token = getGraphToken($config);
    $fromEmail = $config['from_email'] ?? 'ofertare@aiall.ro';
    
    // Build message
    $message = [
        'subject' => $subject,
        'body' => [
            'contentType' => 'HTML',
            'content' => $htmlContent
        ],
        'toRecipients' => [
            ['emailAddress' => ['address' => $to]]
        ],
        'bccRecipients' => [
            ['emailAddress' => ['address' => 'ofertare@aiall.ro']]
        ],
        'replyTo' => [
            ['emailAddress' => ['address' => $config['reply_to'] ?? $fromEmail]]
        ]
    ];
    
    if (!empty($attachments)) {
        $message['attachments'] = $attachments;
    }
    
    $payload = [
        'message' => $message,
        'saveToSentItems' => $config['graph']['save_to_sent_items'] ?? true
    ];
    
    $url = "https://graph.microsoft.com/v1.0/users/{$fromEmail}/sendMail";
    
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $token,
            'Content-Type: application/json'
        ],
        CURLOPT_TIMEOUT => 45
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        throw new Exception("cURL error: {$curlError}");
    }
    
    if (!in_array($httpCode, [200, 202])) {
        $errorMsg = "Graph sendMail failed: HTTP {$httpCode}";
        if ($response) {
            $errorData = json_decode($response, true);
            if (isset($errorData['error']['message'])) {
                $errorMsg .= " - " . $errorData['error']['message'];
            }
        }
        throw new Exception($errorMsg);
    }
    
    return true;
}

// Main execution
try {
    // Get input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    $userId = $input['user_id'] ?? null;
    $isPreview = $input['preview'] ?? false;
    
    if (!$userId) {
        throw new Exception('User ID required');
    }
    
    // Load Graph config
    $graphConfigPath = __DIR__ . '/graph_config.php';
    
    if (!file_exists($graphConfigPath)) {
        throw new Exception('graph_config.php not found');
    }
    
    $graphConfig = include $graphConfigPath;
    
    if (!is_array($graphConfig)) {
        throw new Exception('Invalid graph_config.php');
    }
    
    // Get user from database - INCLUDE first_name and last_name!
    $stmt = db()->prepare('SELECT username, email, first_name, last_name FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        throw new Exception('User not found');
    }
    
    if (empty($user['email'])) {
        throw new Exception('User has no email address');
    }
    
    // Validate email
    if (!filter_var($user['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email address: ' . $user['email']);
    }
    
    // Load email template
    $templatePath = __DIR__ . '/../portal/email_template.html';
    
    if (!file_exists($templatePath)) {
        throw new Exception('Email template not found');
    }
    
    $template = file_get_contents($templatePath);
    
    if (!$template) {
        throw new Exception('Failed to load email template');
    }
    
    // Generate temporary password
    $tempPassword = bin2hex(random_bytes(8));
    
    // Format names properly
    $lastName = !empty($user['last_name']) ? strtoupper($user['last_name']) : '';  // UPPERCASE
    $firstName = !empty($user['first_name']) ? ucfirst(strtolower($user['first_name'])) : '';  // Ucfirst
    
    // Fallback if no names - use username
    if (empty($lastName)) {
        $lastName = strtoupper($user['username']);
    }
    
    // Replace placeholders - INCLUDE [NUME] and [PRENUME]!
    $emailContent = str_replace(
        ['[NUME]', '[PRENUME]', '[USERNAME]', '[PAROLA_TEMPORARA]'],
        [
            htmlspecialchars($lastName),
            htmlspecialchars($firstName),
            htmlspecialchars($user['username']),
            htmlspecialchars($tempPassword)
        ],
        $template
    );
    
    $subject = '🚀 Bine ai venit în Portalul smartBIZ';
    
    // If preview mode, return content without sending
    if ($isPreview) {
        echo json_encode([
            'success' => true,
            'preview' => true,
            'to' => $user['email'],
            'subject' => $subject,
            'html' => $emailContent,
            'temp_password' => $tempPassword
        ]);
        exit;
    }
    
    // Update user password (only when actually sending)
    $hashedPassword = password_hash($tempPassword, PASSWORD_DEFAULT);
    $stmt = db()->prepare('UPDATE users SET password_hash = ?, password_changed = 0 WHERE id = ?');
    $stmt->execute([$hashedPassword, $userId]);
    
    // Embed gratuit.png as inline CID attachment so the recipient sees the badge
    // regardless of portal auth (server requires login for external URL access).
    // Template keeps the external URL for preview; here we swap it to cid: at send time.
    $attachments = [];
    $imagePath = __DIR__ . '/../portal/gratuit.png';
    
    if (file_exists($imagePath)) {
        $imageBytes = @file_get_contents($imagePath);
        if ($imageBytes !== false) {
            $attachments[] = [
                '@odata.type' => '#microsoft.graph.fileAttachment',
                'name' => 'gratuit.png',
                'contentType' => 'image/png',
                'isInline' => true,
                'contentId' => 'badge_v01_gratuit',
                'contentBytes' => base64_encode($imageBytes)
            ];
            
            // Replace the external URL with the inline CID reference
            $emailContent = str_replace(
                'https://sbcportal.aiall.ro/assets/gratuit.png',
                'cid:badge_v01_gratuit',
                $emailContent
            );
        }
    }
    
    // Send via Graph API
    sendViaGraph($graphConfig, $user['email'], $subject, $emailContent, $attachments);
    
    // Success response
    echo json_encode([
        'success' => true,
        'message' => 'Email trimis cu succes',
        'to' => $user['email'],
        'bcc' => 'ofertare@aiall.ro',
        'method' => 'graph'
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
