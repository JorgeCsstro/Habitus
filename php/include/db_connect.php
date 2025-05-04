<?php
// Database connection details
$dbHost = 'localhost';
$dbUser = 'u343618305_habit'; // Replace with your database username
$dbPass = 'habit090402DJct.'; // Replace with your database password
$dbName = 'u343618305_habitus_zone'; // Your database name

// Create connection
$conn = new mysqli($dbHost, $dbUser, $dbPass, $dbName);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Set charset to ensure proper encoding of data
$conn->set_charset("utf8mb4");