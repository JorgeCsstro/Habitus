<?php
/**
 * Azure Translator Service API Endpoint for Habitus Zone
 * Fixed version with proper error handling
 */

// CRITICAL: Disable HTML error output
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Set JSON headers immediately
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Function to send JSON response and exit
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

// Function to send error response
function errorResponse($message, $statusCode = 500, $errorType = 'server') {
    jsonResponse([
        'success' => false,
        'error' => $message,
        'error_type' => $errorType
    ], $statusCode);
}

try {
    // Load environment variables from multiple possible locations
    $envPaths = [
        __DIR__ . '/../../../.env',
        __DIR__ . '/../../.env',
        __DIR__ . '/../.env',
        $_SERVER['DOCUMENT_ROOT'] . '/.env'
    ];
    
    $envLoaded = false;
    foreach ($envPaths as $envPath) {
        if (file_exists($envPath)) {
            $envLoaded = loadEnv($envPath);
            if ($envLoaded) break;
        }
    }
    
    if (!$envLoaded) {
        error_log("Warning: .env file not found in any expected location");
    }

} catch (Exception $e) {
    error_log("Error loading environment: " . $e->getMessage());
}

function loadEnv($path) {
    try {
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (!$lines) return false;
        
        foreach ($lines as $line) {
            if (strpos($line, '=') !== false && !str_starts_with(trim($line), '#')) {
                list($key, $value) = explode('=', $line, 2);
                $_ENV[trim($key)] = trim($value);
            }
        }
        return true;
    } catch (Exception $e) {
        error_log("Error reading .env file: " . $e->getMessage());
        return false;
    }
}

class AzureTranslator {
    private $subscriptionKey;
    private $endpoint;
    private $region;
    
    public function __construct() {
        // Get Azure configuration from environment
        $this->subscriptionKey = $_ENV['AZURE_TRANSLATOR_KEY'] ?? '';
        $this->endpoint = $_ENV['AZURE_TRANSLATOR_ENDPOINT'] ?? 'https://api.cognitive.microsofttranslator.com';
        $this->region = $_ENV['AZURE_TRANSLATOR_REGION'] ?? 'westeurope';
        
        if (empty($this->subscriptionKey)) {
            throw new Exception('Azure Translator key not configured in environment');
        }
    }
    
    public function translate($text, $targetLanguage, $sourceLanguage = null) {
        // Validate input
        if (empty($text) || empty($targetLanguage)) {
            throw new InvalidArgumentException('Text and target language are required');
        }
        
        if (strlen($text) > 5000) {
            throw new InvalidArgumentException('Text exceeds maximum character limit of 5000');
        }
        
        // Build API URL
        $url = $this->endpoint . '/translate?api-version=3.0&to=' . urlencode($targetLanguage);
        if ($sourceLanguage) {
            $url .= '&from=' . urlencode($sourceLanguage);
        }
        
        // Prepare request
        $body = json_encode([['text' => $text]]);
        
        $headers = [
            'Ocp-Apim-Subscription-Key: ' . $this->subscriptionKey,
            'Ocp-Apim-Subscription-Region: ' . $this->region,
            'Content-Type: application/json',
            'Content-Length: ' . strlen($body),
            'X-ClientTraceId: ' . $this->generateGuid()
        ];
        
        // Make request using cURL for better error handling
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 3
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        if ($response === false || !empty($curlError)) {
            throw new Exception('Azure API request failed: ' . $curlError);
        }
        
        $data = json_decode($response, true);
        
        if ($httpCode >= 200 && $httpCode < 300 && $data) {
            if (isset($data[0]['translations'][0]['text'])) {
                return [
                    'success' => true,
                    'translatedText' => $data[0]['translations'][0]['text'],
                    'detectedLanguage' => $data[0]['detectedLanguage']['language'] ?? null,
                    'httpCode' => $httpCode
                ];
            }
        }
        
        // Handle Azure API errors
        $errorMessage = 'Translation failed';
        if (isset($data['error']['message'])) {
            $errorMessage = $data['error']['message'];
        } elseif (isset($data['message'])) {
            $errorMessage = $data['message'];
        }
        
        throw new Exception($errorMessage . " (HTTP {$httpCode})");
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
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        errorResponse('Only POST method allowed', 405, 'method');
    }
    
    // Get and validate input
    $input = file_get_contents('php://input');
    if (empty($input)) {
        errorResponse('No input data received', 400, 'input');
    }
    
    $data = json_decode($input, true);
    if ($data === null) {
        errorResponse('Invalid JSON data: ' . json_last_error_msg(), 400, 'json');
    }
    
    $text = $data['text'] ?? '';
    $targetLanguage = $data['targetLanguage'] ?? '';
    $sourceLanguage = $data['sourceLanguage'] ?? null;
    
    if (empty($text)) {
        errorResponse('Text parameter is required', 400, 'validation');
    }
    
    if (empty($targetLanguage)) {
        errorResponse('Target language parameter is required', 400, 'validation');
    }
    
    // Perform translation
    $translator = new AzureTranslator();
    $result = $translator->translate($text, $targetLanguage, $sourceLanguage);
    
    jsonResponse($result, 200);
    
} catch (InvalidArgumentException $e) {
    error_log("Validation error: " . $e->getMessage());
    errorResponse($e->getMessage(), 400, 'validation');
} catch (Exception $e) {
    error_log("Translation error: " . $e->getMessage());
    errorResponse('Translation service temporarily unavailable', 500, 'service');
}
?>