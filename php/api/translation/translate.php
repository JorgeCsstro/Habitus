<?php
/**
 * Azure Translator Service API Endpoint for Habitus Zone
 * Handles text translation using Azure Cognitive Services
 */

require_once '../../config/database.php';
require_once '../../includes/auth.php';

// Load environment variables
function loadEnv($path) {
    if (!file_exists($path)) {
        return;
    }
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && !str_starts_with(trim($line), '#')) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

loadEnv('../../.env');

// Set response headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

class AzureTranslator {
    private $subscriptionKey;
    private $endpoint;
    private $region;
    private $maxCharsPerRequest;
    private $cacheEnabled;
    private $cacheTTL;
    
    public function __construct() {
        $this->subscriptionKey = $_ENV['AZURE_TRANSLATOR_KEY'] ?? '';
        $this->endpoint = $_ENV['AZURE_TRANSLATOR_ENDPOINT'] ?? 'https://api.cognitive.microsofttranslator.com';
        $this->region = $_ENV['AZURE_TRANSLATOR_REGION'] ?? 'westeurope';
        $this->maxCharsPerRequest = intval($_ENV['TRANSLATION_MAX_CHARACTERS_PER_REQUEST'] ?? 5000);
        $this->cacheEnabled = ($_ENV['TRANSLATION_CACHE_ENABLED'] ?? 'true') === 'true';
        $this->cacheTTL = intval($_ENV['TRANSLATION_CACHE_TTL'] ?? 86400);
        
        if (empty($this->subscriptionKey)) {
            throw new Exception('Azure Translator key not configured');
        }
    }
    
    public function translate($text, $targetLanguage, $sourceLanguage = null) {
        try {
            // Validate input
            if (empty($text) || empty($targetLanguage)) {
                throw new InvalidArgumentException('Text and target language are required');
            }
            
            if (strlen($text) > $this->maxCharsPerRequest) {
                throw new InvalidArgumentException('Text exceeds maximum character limit');
            }
            
            // Check cache first
            if ($this->cacheEnabled) {
                $cached = $this->getCachedTranslation($text, $targetLanguage, $sourceLanguage);
                if ($cached) {
                    return [
                        'success' => true,
                        'translatedText' => $cached,
                        'cached' => true
                    ];
                }
            }
            
            // Perform translation
            $result = $this->callAzureAPI($text, $targetLanguage, $sourceLanguage);
            
            if ($result['success']) {
                // Cache the result
                if ($this->cacheEnabled) {
                    $this->cacheTranslation($text, $targetLanguage, $sourceLanguage, $result['translatedText']);
                }
                
                return $result;
            }
            
            return $result;
            
        } catch (Exception $e) {
            error_log("Translation error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    private function callAzureAPI($text, $targetLanguage, $sourceLanguage = null) {
        $url = $this->endpoint . '/translate?api-version=3.0';
        $url .= '&to=' . urlencode($targetLanguage);
        
        if ($sourceLanguage) {
            $url .= '&from=' . urlencode($sourceLanguage);
        }
        
        $body = json_encode([['text' => $text]]);
        
        $headers = [
            'Ocp-Apim-Subscription-Key: ' . $this->subscriptionKey,
            'Ocp-Apim-Subscription-Region: ' . $this->region,
            'Content-Type: application/json',
            'Content-Length: ' . strlen($body),
            'X-ClientTraceId: ' . $this->generateGuid()
        ];
        
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => implode("\r\n", $headers),
                'content' => $body,
                'timeout' => 30,
                'ignore_errors' => true
            ]
        ]);
        
        $response = file_get_contents($url, false, $context);
        
        if ($response === false) {
            $error = error_get_last();
            throw new Exception('Azure API request failed: ' . ($error['message'] ?? 'Unknown error'));
        }
        
        // Get response headers
        $responseHeaders = $http_response_header ?? [];
        $httpCode = 0;
        foreach ($responseHeaders as $header) {
            if (preg_match('/HTTP\/\d\.\d\s+(\d+)/', $header, $matches)) {
                $httpCode = intval($matches[1]);
                break;
            }
        }
        
        $data = json_decode($response, true);
        
        if ($httpCode >= 200 && $httpCode < 300 && $data) {
            if (isset($data[0]['translations'][0]['text'])) {
                return [
                    'success' => true,
                    'translatedText' => $data[0]['translations'][0]['text'],
                    'detectedLanguage' => $data[0]['detectedLanguage']['language'] ?? null,
                    'cached' => false
                ];
            }
        }
        
        // Handle error response
        $errorMessage = 'Translation failed';
        if (isset($data['error']['message'])) {
            $errorMessage = $data['error']['message'];
        } elseif (isset($data['message'])) {
            $errorMessage = $data['message'];
        }
        
        throw new Exception($errorMessage . " (HTTP {$httpCode})");
    }
    
    private function getCachedTranslation($text, $targetLanguage, $sourceLanguage) {
        if (!$this->cacheEnabled) return null;
        
        global $conn;
        
        try {
            $cacheKey = $this->generateCacheKey($text, $targetLanguage, $sourceLanguage);
            
            $stmt = $conn->prepare("SELECT translated_text FROM translation_cache WHERE cache_key = ? AND expires_at > NOW()");
            $stmt->bind_param("s", $cacheKey);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($row = $result->fetch_assoc()) {
                return $row['translated_text'];
            }
            
        } catch (Exception $e) {
            error_log("Cache retrieval error: " . $e->getMessage());
        }
        
        return null;
    }
    
    private function cacheTranslation($text, $targetLanguage, $sourceLanguage, $translatedText) {
        if (!$this->cacheEnabled) return;
        
        global $conn;
        
        try {
            $cacheKey = $this->generateCacheKey($text, $targetLanguage, $sourceLanguage);
            $expiresAt = date('Y-m-d H:i:s', time() + $this->cacheTTL);
            
            $stmt = $conn->prepare("INSERT INTO translation_cache (cache_key, original_text, translated_text, source_language, target_language, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE translated_text = ?, expires_at = ?, updated_at = NOW()");
            $stmt->bind_param("ssssssss", $cacheKey, $text, $translatedText, $sourceLanguage, $targetLanguage, $expiresAt, $translatedText, $expiresAt);
            $stmt->execute();
            
        } catch (Exception $e) {
            error_log("Cache storage error: " . $e->getMessage());
        }
    }
    
    private function generateCacheKey($text, $targetLanguage, $sourceLanguage) {
        return hash('sha256', $text . '|' . ($sourceLanguage ?? 'auto') . '|' . $targetLanguage);
    }
    
    private function generateGuid() {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}

// Main request handling
try {
    session_start();
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Only POST method allowed');
    }
    
    // Optional: Check authentication (uncomment if needed)
    // if (!isset($_SESSION['user_id'])) {
    //     http_response_code(401);
    //     echo json_encode(['success' => false, 'error' => 'Authentication required']);
    //     exit;
    // }
    
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if ($data === null) {
        throw new InvalidArgumentException('Invalid JSON data');
    }
    
    $text = $data['text'] ?? '';
    $targetLanguage = $data['targetLanguage'] ?? '';
    $sourceLanguage = $data['sourceLanguage'] ?? null;
    
    if (empty($text) || empty($targetLanguage)) {
        throw new InvalidArgumentException('Text and target language are required');
    }
    
    $translator = new AzureTranslator();
    $result = $translator->translate($text, $targetLanguage, $sourceLanguage);
    
    if ($result['success']) {
        http_response_code(200);
    } else {
        http_response_code(400);
    }
    
    echo json_encode($result);
    
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'error_type' => 'validation'
    ]);
} catch (Exception $e) {
    error_log("Translation API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Translation service temporarily unavailable',
        'error_type' => 'server'
    ]);
}
?>