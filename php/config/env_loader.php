<?php
/**
 * Environment Variable Loader for Habitus Zone
 */

function loadEnvironmentVariables($envFilePath = null) {
    // Try multiple possible locations for .env file
    $possiblePaths = [
        $envFilePath,
        __DIR__ . '/../../.env',
        $_SERVER['DOCUMENT_ROOT'] . '/.env',
        dirname(dirname(__DIR__)) . '/.env',
        dirname(dirname(dirname(__FILE__))) . '/.env'
    ];
    
    foreach ($possiblePaths as $path) {
        if ($path && file_exists($path)) {
            return parseEnvFile($path);
        }
    }
    
    error_log("Warning: .env file not found in any expected location");
    return false;
}

function parseEnvFile($filePath) {
    try {
        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (!$lines) {
            error_log("Error: Could not read .env file: " . $filePath);
            return false;
        }
        
        foreach ($lines as $line) {
            $line = trim($line);
            
            // Skip comments and empty lines
            if (empty($line) || $line[0] === '#') {
                continue;
            }
            
            // Parse key=value pairs
            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                
                // Remove quotes if present
                if (($value[0] === '"' && $value[-1] === '"') || 
                    ($value[0] === "'" && $value[-1] === "'")) {
                    $value = substr($value, 1, -1);
                }
                
                $_ENV[$key] = $value;
                putenv("$key=$value");
            }
        }
        
        error_log("Successfully loaded environment variables from: " . $filePath);
        return true;
        
    } catch (Exception $e) {
        error_log("Error parsing .env file: " . $e->getMessage());
        return false;
    }
}

// Auto-load when this file is included
loadEnvironmentVariables();
?>