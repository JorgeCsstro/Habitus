<?php
// test_paths.php - Test path resolution from different locations

echo "<h2>Path Resolution Test</h2>";

echo "<h3>From Root Directory (like debug_uploads.php):</h3>";
$rootDir = __DIR__;
$rootUploadsDir = $rootDir . '/uploads/profiles/';
echo "<p><strong>Root __DIR__:</strong> $rootDir</p>";
echo "<p><strong>Root uploads dir:</strong> $rootUploadsDir</p>";
echo "<p><strong>Root uploads exists:</strong> " . (file_exists($rootUploadsDir) ? 'YES' : 'NO') . "</p>";

echo "<h3>Simulating from php/api/user/ directory:</h3>";
$apiFile = __DIR__ . '/php/api/user/upload_profile_picture.php';
echo "<p><strong>API file path:</strong> $apiFile</p>";

// Simulate the dirname calls
$apiDir = dirname($apiFile); // php/api/user/
$apiParent1 = dirname($apiDir); // php/api/
$apiParent2 = dirname($apiParent1); // php/
$apiParent3 = dirname($apiParent2); // root
$apiUploadsDir = $apiParent3 . '/uploads/profiles/';

echo "<p><strong>API dirname(file):</strong> $apiDir</p>";
echo "<p><strong>API dirname x2:</strong> $apiParent1</p>";
echo "<p><strong>API dirname x3:</strong> $apiParent2</p>";
echo "<p><strong>API dirname x4:</strong> $apiParent3</p>";
echo "<p><strong>API uploads dir:</strong> $apiUploadsDir</p>";
echo "<p><strong>API uploads exists:</strong> " . (file_exists($apiUploadsDir) ? 'YES' : 'NO') . "</p>";

echo "<h3>Comparison:</h3>";
echo "<p><strong>Paths match:</strong> " . ($rootUploadsDir === $apiUploadsDir ? 'YES' : 'NO') . "</p>";

// Test both approaches
echo "<h3>Testing file creation in both directories:</h3>";

// Test 1: Root approach
$testFile1 = $rootUploadsDir . 'test_root_' . time() . '.txt';
if (file_put_contents($testFile1, 'test from root')) {
    echo "<p style='color: green;'>✅ Root approach works: " . basename($testFile1) . "</p>";
} else {
    echo "<p style='color: red;'>❌ Root approach failed</p>";
}

// Test 2: API approach  
$testFile2 = $apiUploadsDir . 'test_api_' . time() . '.txt';
if (file_put_contents($testFile2, 'test from api simulation')) {
    echo "<p style='color: green;'>✅ API approach works: " . basename($testFile2) . "</p>";
} else {
    echo "<p style='color: red;'>❌ API approach failed</p>";
}

// Check actual files
echo "<h3>Files actually in uploads directory:</h3>";
if (file_exists($rootUploadsDir)) {
    $files = scandir($rootUploadsDir);
    foreach ($files as $file) {
        if ($file != '.' && $file != '..') {
            echo "<p>$file</p>";
        }
    }
}
?>