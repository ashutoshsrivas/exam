<?php
// Temporary: enable error reporting for debugging 500 errors. Remove or disable in production.
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
require_once 'lib/conn.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $identifier = trim($_POST['identifier'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($identifier === '' || $password === '') {
        $error = 'Please fill in both fields.';
    } else {
        // Fetch user from database by name/email/employeeid (table uses `name`, `pass`, and `role` columns)
        $stmt = $conn->prepare("SELECT id, name, email, employeeid, pass, role FROM users WHERE name = ? OR email = ? OR employeeid = ? LIMIT 1");
        if ($stmt === false) {
            error_log('Prepare failed: ' . $conn->error);
            $error = 'Server error. Please try again later.';
        } else {
            $stmt->bind_param('sss', $identifier, $identifier, $identifier);
            if (! $stmt->execute()) {
                error_log('Execute failed: ' . $stmt->error);
                $error = 'Server error. Please try again later.';
            } else {
                $stmt->store_result();
                if ($stmt->num_rows === 1) {
                        $stmt->bind_result($db_id, $db_name, $db_email, $db_employeeid, $db_pass, $db_role);
                    $stmt->fetch();
                    $hashedPassword = hash('sha256', $password);
                        if ($hashedPassword === $db_pass) {
                            $_SESSION['user_id'] = $db_id;
                            $_SESSION['username'] = !empty($db_name) ? $db_name : (!empty($db_email) ? $db_email : $db_employeeid);
                            $_SESSION['role'] = $db_role;
                            // Redirect based on role
                            if (!empty($db_role) && strtolower($db_role) === 'admin') {
                                header('Location: admin/dashboard.php');
                            } else {
                                header('Location: user/dashboard.php');
                            }
                            exit;
                    } else {
                        $error = 'Invalid password.';
                    }
                } else {
                    $error = 'User not found.';
                }
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login</title>
    <link rel="stylesheet" href="public/style/styles.css">
    <style>
        body {
            background: url('public/img/geu.jpg') no-repeat center center fixed;
            background-size: cover;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Login</h1>
        <?php if (isset($error)): ?>
            <p class="error"> <?= $error ?> </p>
        <?php endif; ?>
        <form method="POST" action="">
                <div class="form-group">
                    <label for="identifier">Email or Employee ID:</label>
                    <input type="text" id="identifier" name="identifier" required placeholder="you@example.com or E12345">
                </div>
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit" class="btn">Login</button>
        </form>
    </div>
</body>
</html>