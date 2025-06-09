<?php
// translate.php - API endpoint for translation requests

require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../include/auth.php';
require_once '../../include/translation.php';

header('Content-Type: application/json');

// Check authentication
if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['text']) || !isset($input['target_language'])) {
        throw new InvalidArgumentException('Missing required parameters: text, target_language');
    }
    
    $text = trim($input['text']);
    $targetLanguage = $input['target_language'];
    $sourceLanguage = $input['source_language'] ?? null;
    $contentType = $input['content_type'] ?? 'user_content';
    $contentId = $input['content_id'] ?? null;
    
    if (empty($text)) {
        throw new InvalidArgumentException('Text cannot be empty');
    }
    
    $translator = new TranslationService($conn);
    
    // Use appropriate translation method based on content type
    if ($contentType === 'user_content' && $contentId) {
        $translatedText = $translator->translateUserContent($contentType, $contentId, $text, $targetLanguage);
        $result = [
            'text' => $translatedText,
            'content_type' => $contentType,
            'content_id' => $contentId
        ];
    } else {
        $result = $translator->translate($text, $targetLanguage, $sourceLanguage);
    }
    
    $result['success'] = true;
    echo json_encode($result);
    
} catch (Exception $e) {
    error_log('Translation API error: ' . $e->getMessage());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'fallback_text' => $input['text'] ?? ''
    ]);
}
?>