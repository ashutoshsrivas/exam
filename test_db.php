<?php
// Test database connection and schema
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once 'lib/conn.php';

echo "<h2>Database Connection Test</h2>";

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
echo "✅ Connected to database: " . $dbname . "<br><br>";

// Check users table structure
echo "<h3>Users Table Structure:</h3>";
$result = $conn->query("DESCRIBE users");
if ($result) {
    echo "<table border='1'>";
    echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th></tr>";
    while ($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . htmlspecialchars($row['Field']) . "</td>";
        echo "<td>" . htmlspecialchars($row['Type']) . "</td>";
        echo "<td>" . htmlspecialchars($row['Null']) . "</td>";
        echo "<td>" . htmlspecialchars($row['Key']) . "</td>";
        echo "<td>" . htmlspecialchars($row['Default']) . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "❌ Error: " . $conn->error;
}

echo "<br><br><h3>Sample User Data:</h3>";
$result = $conn->query("SELECT id, employeeid, name, email, phone, role FROM users LIMIT 3");
if ($result) {
    echo "<table border='1'>";
    while ($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>#" . $row['id'] . "</td>";
        echo "<td>" . htmlspecialchars($row['employeeid']) . "</td>";
        echo "<td>" . htmlspecialchars($row['name']) . "</td>";
        echo "<td>" . htmlspecialchars($row['email'] ?? '') . "</td>";
        echo "<td>" . htmlspecialchars($row['phone'] ?? '') . "</td>";
        echo "<td>" . htmlspecialchars($row['role']) . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "❌ Error: " . $conn->error;
}

echo "<br><br><p>If you see this page, the database connection is working. Check the above for any schema issues.</p>";
?>
