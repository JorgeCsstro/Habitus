<?php
/**
 * Azure Translator Configuration Test
 */

// Load environment variables properly
require_once 'php/config/env_loader.php';

header('Content-Type: text/plain');

echo "=== Azure Translator Configuration Test ===\n\n";

// Check environment variables
$key = $_ENV['AZURE_TRANSLATOR_KEY'] ?? '';
$region = $_ENV['AZURE_TRANSLATOR_REGION'] ?? '';
$endpoint = $_ENV['AZURE_TRANSLATOR_ENDPOINT'] ?? '';

echo "Environment Variables:\n";
echo "- Key present: " . (!empty($key) ? "YES (" . substr($key, 0, 8) . "...)" : "NO") . "\n";
echo "- Region: " . ($region ?: "NOT SET") . "\n";
echo "- Endpoint: " . ($endpoint ?: "NOT SET") . "\n\n";

if (empty($key)) {
    echo "❌ AZURE_TRANSLATOR_KEY is missing from environment variables\n";
    echo "Check your .env file loading and make sure the file exists.\n";
    exit;
}

if (empty($region)) {
    echo "❌ AZURE_TRANSLATOR_REGION is missing from environment variables\n";
    exit;
}

echo "Testing Azure Translation API...\n";

// Test a simple translation
$url = "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=es";
$testData = json_encode([['text' => 'Hello World']]);

$headers = [
    'Ocp-Apim-Subscription-Key: ' . $key,
    'Ocp-Apim-Subscription-Region: ' . $region,
    'Content-Type: application/json',
    'Content-Length: ' . strlen($testData)
];

echo "Request URL: " . $url . "\n";
echo "Headers: " . implode(', ', array_map(function($h) { 
    return explode(':', $h)[0]; 
}, $headers)) . "\n\n";

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $testData,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_SSL_VERIFYPEER => true
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

echo "HTTP Status: " . $httpCode . "\n";

if (!empty($curlError)) {
    echo "❌ cURL Error: " . $curlError . "\n";
    exit;
}

echo "Response: " . $response . "\n\n";

if ($httpCode === 200) {
    $data = json_decode($response, true);
    if (isset($data[0]['translations'][0]['text'])) {
        echo "✅ SUCCESS! Translation: '" . $data[0]['translations'][0]['text'] . "'\n";
    } else {
        echo "❌ Unexpected response format\n";
    }
} else {
    echo "❌ API Error (HTTP " . $httpCode . ")\n";
    $errorData = json_decode($response, true);
    if (isset($errorData['error']['message'])) {
        echo "Error message: " . $errorData['error']['message'] . "\n";
    }
}
?>