<?php
// php/include/translation.php - Translation service with Azure Translator integration

class TranslationService {
    private $conn;
    private $apiKey;
    private $endpoint;
    private $region;
    private $enabledLanguages;
    private $defaultLanguage;
    private $cacheEnabled;
    
    public function __construct($conn) {
        $this->conn = $conn;
        $this->apiKey = $_ENV['AZURE_TRANSLATOR_KEY'] ?? '';
        $this->endpoint = $_ENV['AZURE_TRANSLATOR_ENDPOINT'] ?? 'https://api.cognitive.microsofttranslator.com';
        $this->region = $_ENV['AZURE_TRANSLATOR_REGION'] ?? 'global';
        $this->enabledLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'];
        $this->defaultLanguage = 'en';
        $this->cacheEnabled = true;
        
        if (empty($this->apiKey)) {
            error_log('Warning: Azure Translator API key not configured');
        }
    }
    
    /**
     * Translate text using Azure Translator API
     */
    public function translate($text, $targetLanguage, $sourceLanguage = null) {
        try {
            // Validate inputs
            if (empty($text) || empty($targetLanguage)) {
                throw new InvalidArgumentException('Text and target language are required');
            }
            
            // Check if target language is supported
            if (!in_array($targetLanguage, $this->enabledLanguages)) {
                throw new InvalidArgumentException('Unsupported target language: ' . $targetLanguage);
            }
            
            // Skip translation if already in target language
            if ($sourceLanguage === $targetLanguage) {
                return [
                    'text' => $text,
                    'detected_language' => $sourceLanguage,
                    'provider' => 'none',
                    'cached' => false
                ];
            }
            
            // Check cache first
            if ($this->cacheEnabled) {
                $cached = $this->getCachedTranslation($text, $targetLanguage, $sourceLanguage);
                if ($cached) {
                    $this->updateCacheUsage($cached['id']);
                    return [
                        'text' => $cached['translated_text'],
                        'detected_language' => $cached['source_language'],
                        'provider' => $cached['provider'],
                        'cached' => true
                    ];
                }
            }
            
            // Make API call if not in cache
            if (empty($this->apiKey)) {
                throw new Exception('Azure Translator API key not configured');
            }
            
            $result = $this->callAzureTranslator($text, $targetLanguage, $sourceLanguage);
            
            // Cache the result
            if ($this->cacheEnabled && $result) {
                $this->cacheTranslation($text, $result['text'], $result['detected_language'], $targetLanguage, 'azure');
            }
            
            // Track usage
            $this->trackUsage(strlen($text), 'azure');
            
            return $result;
            
        } catch (Exception $e) {
            error_log('Translation error: ' . $e->getMessage());
            
            // Return original text as fallback
            return [
                'text' => $text,
                'detected_language' => $sourceLanguage ?? 'unknown',
                'provider' => 'fallback',
                'cached' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Call Azure Translator API
     */
    private function callAzureTranslator($text, $targetLanguage, $sourceLanguage = null) {
        $url = $this->endpoint . '/translate?api-version=3.0&to=' . $targetLanguage;
        if ($sourceLanguage) {
            $url .= '&from=' . $sourceLanguage;
        }
        
        $headers = [
            'Ocp-Apim-Subscription-Key: ' . $this->apiKey,
            'Ocp-Apim-Subscription-Region: ' . $this->region,
            'Content-Type: application/json'
        ];
        
        $data = [
            ['text' => $text]
        ];
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => true
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new Exception('CURL error: ' . $error);
        }
        
        if ($httpCode !== 200) {
            throw new Exception('Azure Translator API error: HTTP ' . $httpCode . ' - ' . $response);
        }
        
        $result = json_decode($response, true);
        
        if (!$result || !isset($result[0]['translations'][0]['text'])) {
            throw new Exception('Invalid response from Azure Translator API');
        }
        
        return [
            'text' => $result[0]['translations'][0]['text'],
            'detected_language' => $result[0]['detectedLanguage']['language'] ?? $sourceLanguage,
            'provider' => 'azure',
            'cached' => false
        ];
    }
    
    /**
     * Get cached translation
     */
    private function getCachedTranslation($text, $targetLanguage, $sourceLanguage = null) {
        $textHash = hash('sha256', $text);
        
        $sql = "SELECT * FROM translation_cache 
                WHERE text_hash = ? AND target_language = ?";
        $params = [$textHash, $targetLanguage];
        
        if ($sourceLanguage) {
            $sql .= " AND source_language = ?";
            $params[] = $sourceLanguage;
        }
        
        $sql .= " ORDER BY usage_count DESC LIMIT 1";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetch();
    }
    
    /**
     * Cache translation result
     */
    private function cacheTranslation($originalText, $translatedText, $sourceLanguage, $targetLanguage, $provider) {
        $textHash = hash('sha256', $originalText);
        
        $sql = "INSERT INTO translation_cache 
                (text_hash, source_language, target_language, original_text, translated_text, provider, character_count)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    translated_text = VALUES(translated_text),
                    last_used = CURRENT_TIMESTAMP,
                    usage_count = usage_count + 1";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            $textHash,
            $sourceLanguage,
            $targetLanguage,
            $originalText,
            $translatedText,
            $provider,
            strlen($originalText)
        ]);
    }
    
    /**
     * Update cache usage
     */
    private function updateCacheUsage($cacheId) {
        $sql = "UPDATE translation_cache 
                SET usage_count = usage_count + 1, last_used = CURRENT_TIMESTAMP 
                WHERE id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$cacheId]);
    }
    
    /**
     * Track API usage
     */
    private function trackUsage($characterCount, $provider) {
        $userId = $_SESSION['user_id'] ?? null;
        $date = date('Y-m-d');
        
        $sql = "INSERT INTO translation_usage (user_id, date, provider, character_count, api_calls)
                VALUES (?, ?, ?, ?, 1)
                ON DUPLICATE KEY UPDATE 
                    character_count = character_count + VALUES(character_count),
                    api_calls = api_calls + 1";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$userId, $date, $provider, $characterCount]);
    }
    
    /**
     * Get interface translation
     */
    public function getInterfaceTranslation($key, $language = null) {
        if (!$language) {
            $language = $_SESSION['user_language'] ?? $this->defaultLanguage;
        }
        
        $sql = "SELECT translated_text FROM translations 
                WHERE content_type = 'interface' 
                AND translation_key = ? 
                AND language_code = ?";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$key, $language]);
        
        $result = $stmt->fetch();
        return $result ? $result['translated_text'] : $key;
    }
    
    /**
     * Translate user content (habits, tasks, etc.)
     */
    public function translateUserContent($contentType, $contentId, $text, $targetLanguage) {
        // Check if translation already exists
        $sql = "SELECT translated_text FROM translations 
                WHERE content_type = ? AND content_id = ? AND language_code = ?";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$contentType, $contentId, $targetLanguage]);
        
        $existing = $stmt->fetch();
        if ($existing) {
            return $existing['translated_text'];
        }
        
        // Translate and store
        $result = $this->translate($text, $targetLanguage);
        
        // Store in translations table
        $sql = "INSERT INTO translations 
                (content_type, content_id, language_code, translation_key, original_text, translated_text, auto_translated)
                VALUES (?, ?, ?, ?, ?, ?, 1)";
        
        $key = $contentType . '_' . $contentId;
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            $contentType,
            $contentId,
            $targetLanguage,
            $key,
            $text,
            $result['text']
        ]);
        
        return $result['text'];
    }
    
    /**
     * Get usage statistics
     */
    public function getUsageStats($period = 'month') {
        $sql = "SELECT 
                    provider,
                    SUM(character_count) as total_characters,
                    SUM(api_calls) as total_calls,
                    SUM(cost_estimate) as total_cost
                FROM translation_usage 
                WHERE date >= DATE_SUB(CURDATE(), INTERVAL 1 " . strtoupper($period) . ")
                GROUP BY provider";
        
        $stmt = $this->conn->query($sql);
        return $stmt->fetchAll();
    }
    
    /**
     * Clean old cache entries
     */
    public function cleanupCache($daysOld = 30) {
        $sql = "DELETE FROM translation_cache 
                WHERE last_used < DATE_SUB(NOW(), INTERVAL ? DAY)
                AND usage_count = 1";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$daysOld]);
        
        return $stmt->rowCount();
    }
}