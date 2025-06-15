<?php
// php/api/user/interface.php - Get interface translations

require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../include/translation.php';

header('Content-Type: application/json');

try {
    $language = $_GET['lang'] ?? 'en';
    
    // Validate language
    $allowedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'];
    if (!in_array($language, $allowedLanguages)) {
        $language = 'en';
    }
    
    // Get all interface translations for the language
    $sql = "SELECT translation_key, translated_text 
            FROM translations 
            WHERE content_type = 'interface' 
            AND language_code = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([$language]);
    
    $translations = [];
    while ($row = $stmt->fetch()) {
        $translations[$row['translation_key']] = $row['translated_text'];
    }
    
    // Cache headers for better performance
    header('Cache-Control: public, max-age=3600'); // 1 hour cache
    header('ETag: "' . md5(json_encode($translations)) . '"');
    
    echo json_encode([
        'success' => true,
        'language' => $language,
        'translations' => $translations
    ]);
    
} catch (Exception $e) {
    error_log('Interface translation error: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to load translations',
        'translations' => []
    ]);
}
?>