<?php
// debug_uploads.php - Comprehensive upload debugging

session_start();
require_once 'php/include/config.php';
require_once 'php/include/db_connect.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    die('Please log in first');
}

$userId = $_SESSION['user_id'];
?>
<!DOCTYPE html>
<html>
<head>
    <title>Upload Debug Tool</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .debug-section { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .test-image { max-width: 100px; border: 2px solid #ccc; margin: 5px; }
        pre { background: #eee; padding: 10px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Upload Debug Tool</h1>
    
    <div class="debug-section">
        <h2>1. Current User Profile Picture</h2>
        <?php
        $stmt = $conn->prepare("SELECT profile_picture FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $currentPic = $stmt->fetchColumn();
        
        echo "<p><strong>Database value:</strong> " . htmlspecialchars($currentPic ?: 'NULL') . "</p>";
        
        if ($currentPic) {
            // Test different URL constructions
            $urls = [
                'Relative from current dir' => $currentPic,
                'With ../' => '../' . $currentPic,
                'With /' => '/' . $currentPic,
                'Full domain' => 'https://' . $_SERVER['HTTP_HOST'] . '/' . $currentPic
            ];
            
            foreach ($urls as $label => $url) {
                echo "<p><strong>$label:</strong> $url</p>";
                echo "<img src='$url' class='test-image' onerror=\"this.style.border='2px solid red'\" onload=\"this.style.border='2px solid green'\">";
            }
        }
        ?>
    </div>
    
    <div class="debug-section">
        <h2>2. Directory Information</h2>
        <?php
        $paths = [
            'Current script directory' => __DIR__,
            'Document root' => $_SERVER['DOCUMENT_ROOT'],
            'Current working directory' => getcwd(),
            'Script filename' => __FILE__
        ];
        
        foreach ($paths as $label => $path) {
            echo "<p><strong>$label:</strong> $path</p>";
        }
        
        // Check uploads directory
        $uploadsDir = __DIR__ . '/uploads/profiles/';
        echo "<p><strong>Uploads directory:</strong> $uploadsDir</p>";
        echo "<p><strong>Directory exists:</strong> " . (file_exists($uploadsDir) ? '✅ YES' : '❌ NO') . "</p>";
        echo "<p><strong>Directory writable:</strong> " . (is_writable($uploadsDir) ? '✅ YES' : '❌ NO') . "</p>";
        echo "<p><strong>Directory permissions:</strong> " . (file_exists($uploadsDir) ? substr(sprintf('%o', fileperms($uploadsDir)), -4) : 'N/A') . "</p>";
        ?>
    </div>
    
    <div class="debug-section">
        <h2>3. Files in Uploads Directory</h2>
        <?php
        if (file_exists($uploadsDir)) {
            $files = scandir($uploadsDir);
            $profileFiles = array_filter($files, function($file) use ($userId) {
                return strpos($file, "profile_{$userId}_") === 0;
            });
            
            if (empty($profileFiles)) {
                echo "<p class='warning'>No profile files found for user $userId</p>";
            } else {
                echo "<h3>Your Profile Files:</h3>";
                foreach ($profileFiles as $file) {
                    $filePath = $uploadsDir . $file;
                    $fileUrl = '/uploads/profiles/' . $file;
                    $fileSize = filesize($filePath);
                    $fileTime = date('Y-m-d H:i:s', filemtime($filePath));
                    
                    echo "<div style='border: 1px solid #ccc; padding: 10px; margin: 5px 0;'>";
                    echo "<p><strong>File:</strong> $file</p>";
                    echo "<p><strong>Size:</strong> " . number_format($fileSize) . " bytes</p>";
                    echo "<p><strong>Modified:</strong> $fileTime</p>";
                    echo "<p><strong>Full path:</strong> $filePath</p>";
                    echo "<p><strong>Web URL:</strong> $fileUrl</p>";
                    echo "<p><strong>File readable:</strong> " . (is_readable($filePath) ? '✅ YES' : '❌ NO') . "</p>";
                    
                    // Test different URL approaches
                    $testUrls = [
                        $fileUrl,
                        '/uploads/profiles/' . $file,
                        'uploads/profiles/' . $file,
                        '../uploads/profiles/' . $file
                    ];
                    
                    echo "<p><strong>URL Tests:</strong></p>";
                    foreach ($testUrls as $testUrl) {
                        echo "<div>$testUrl: <img src='$testUrl' class='test-image' onerror=\"this.style.border='2px solid red'; this.alt='FAILED'\" onload=\"this.style.border='2px solid green'; this.alt='SUCCESS'\"></div>";
                    }
                    echo "</div>";
                }
            }
            
            echo "<h3>All Files in Directory:</h3>";
            foreach ($files as $file) {
                if ($file != '.' && $file != '..') {
                    echo "<p>$file</p>";
                }
            }
        } else {
            echo "<p class='error'>Uploads directory does not exist!</p>";
        }
        ?>
    </div>
    
    <div class="debug-section">
        <h2>4. Test Upload</h2>
        <form enctype="multipart/form-data" method="post">
            <input type="file" name="test_upload" accept="image/*">
            <button type="submit" name="do_upload">Test Upload</button>
        </form>
        
        <?php
        if (isset($_POST['do_upload']) && isset($_FILES['test_upload'])) {
            $file = $_FILES['test_upload'];
            
            echo "<h3>Upload Test Results:</h3>";
            echo "<pre>";
            print_r($file);
            echo "</pre>";
            
            if ($file['error'] === UPLOAD_ERR_OK) {
                $filename = 'test_' . $userId . '_' . time() . '.jpg';
                $uploadPath = $uploadsDir . $filename;
                
                echo "<p><strong>Attempting to upload to:</strong> $uploadPath</p>";
                
                if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
                    echo "<p class='success'>✅ File uploaded successfully!</p>";
                    chmod($uploadPath, 0644);
                    
                    $webUrl = '/uploads/profiles/' . $filename;
                    echo "<p><strong>Web URL:</strong> $webUrl</p>";
                    echo "<p><strong>Test image:</strong></p>";
                    echo "<img src='$webUrl' style='max-width: 200px; border: 2px solid blue;'>";
                    
                } else {
                    echo "<p class='error'>❌ Failed to move uploaded file</p>";
                }
            } else {
                echo "<p class='error'>❌ Upload error: " . $file['error'] . "</p>";
            }
        }
        ?>
    </div>
    
    <div class="debug-section">
        <h2>5. Server Information</h2>
        <?php
        echo "<p><strong>Server software:</strong> " . $_SERVER['SERVER_SOFTWARE'] . "</p>";
        echo "<p><strong>PHP version:</strong> " . PHP_VERSION . "</p>";
        echo "<p><strong>Upload max filesize:</strong> " . ini_get('upload_max_filesize') . "</p>";
        echo "<p><strong>Post max size:</strong> " . ini_get('post_max_size') . "</p>";
        echo "<p><strong>Max execution time:</strong> " . ini_get('max_execution_time') . "</p>";
        
        // Check if mod_rewrite is enabled
        if (function_exists('apache_get_modules')) {
            $modules = apache_get_modules();
            echo "<p><strong>mod_rewrite enabled:</strong> " . (in_array('mod_rewrite', $modules) ? '✅ YES' : '❌ NO') . "</p>";
        }
        ?>
    </div>
    
    <div class="debug-section">
        <h2>6. .htaccess Check</h2>
        <?php
        $htaccessFiles = [
            'Root .htaccess' => __DIR__ . '/.htaccess',
            'Uploads .htaccess' => __DIR__ . '/uploads/.htaccess',
            'Profiles .htaccess' => __DIR__ . '/uploads/profiles/.htaccess'
        ];
        
        foreach ($htaccessFiles as $label => $path) {
            echo "<h4>$label</h4>";
            if (file_exists($path)) {
                echo "<p class='success'>✅ File exists</p>";
                echo "<pre>" . htmlspecialchars(file_get_contents($path)) . "</pre>";
            } else {
                echo "<p class='warning'>⚠️ File does not exist</p>";
            }
        }
        ?>
    </div>
</body>
</html>