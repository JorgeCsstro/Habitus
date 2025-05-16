<?php
// db_connect.php

// Database connection details
$dbHost = 'localhost';
$dbUser = 'u343618305_habit'; // Replace with your database username
$dbPass = 'habit090402DJct.'; // Replace with your database password
$dbName = 'u343618305_habitus_zone'; // Your database name

// Create connection using PDO
try {
    $conn = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass);
    // Set the PDO error mode to exception
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Set fetch mode to associative array
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}