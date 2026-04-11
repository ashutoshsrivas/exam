<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: ../login.php');
    exit;
}
require_once __DIR__ . '/../lib/conn.php';

$user_id = intval($_SESSION['user_id']);
$username = isset($_SESSION['username']) ? htmlspecialchars($_SESSION['username']) : 'User';
$active_page = 'profile';

$message = '';
$message_type = '';

// Handle password change
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['change_password'])) {
    $current = $_POST['current_password'] ?? '';
    $new = $_POST['new_password'] ?? '';
    $confirm = $_POST['confirm_password'] ?? '';

    if ($current === '' || $new === '' || $confirm === '') {
        $message = 'All fields are required.';
        $message_type = 'error';
    } elseif ($new !== $confirm) {
        $message = 'New passwords do not match.';
        $message_type = 'error';
    } elseif (strlen($new) < 6) {
        $message = 'Password must be at least 6 characters.';
        $message_type = 'error';
    } else {
        // Fetch current hash
        $stmt = $conn->prepare('SELECT pass FROM users WHERE id = ? LIMIT 1');
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res->fetch_assoc();
        $stmt->close();
        $stored = $row['pass'] ?? '';
        $current_hash = hash('sha256', $current);
        if ($stored === '' || $current_hash !== $stored) {
            $message = 'Current password is incorrect.';
            $message_type = 'error';
        } else {
            $new_hash = hash('sha256', $new);
            $up = $conn->prepare('UPDATE users SET pass = ? WHERE id = ?');
            $up->bind_param('si', $new_hash, $user_id);
            if ($up->execute()) {
                $message = 'Password updated successfully.';
                $message_type = 'success';
            } else {
                $message = 'Error updating password.';
                $message_type = 'error';
            }
            $up->close();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Profile - Reset Password</title>
    <link rel="stylesheet" href="../public/style/styles.css">
    <link rel="stylesheet" href="../public/style/user.css">
    <link rel="stylesheet" href="../public/style/admin.css">
    <style>
        .profile-card { max-width: 720px; margin: 0; }
        .profile-card form { display: grid; gap: 16px; }
    </style>
</head>
<body class="user-open">
<?php include __DIR__ . '/sidebar.php'; ?>
<div class="main">
    <header class="topbar">
        <h1 class="page-title">Profile</h1>
        <div class="top-actions">
            <a href="dashboard.php" class="btn small">Back</a>
        </div>
    </header>
    <section class="content">
        <div class="profile-card">
            <div class="table-header">
                <h2>Reset Password</h2>
            </div>
            <?php if ($message): ?>
                <div class="message <?= $message_type ?>"><?= htmlspecialchars($message) ?></div>
            <?php endif; ?>
            <form method="post">
                <input type="hidden" name="change_password" value="1">
                <div class="form-group">
                    <label for="current_password">Current Password</label>
                    <div class="password-container">
                        <input type="password" id="current_password" name="current_password" required>
                        <button type="button" class="toggle-password" onclick="togglePassword('current_password')">Show</button>
                    </div>
                </div>
                <div class="form-group">
                    <label for="new_password">New Password</label>
                    <div class="password-container">
                        <input type="password" id="new_password" name="new_password" required>
                        <button type="button" class="toggle-password" onclick="togglePassword('new_password')">Show</button>
                    </div>
                </div>
                <div class="form-group">
                    <label for="confirm_password">Confirm New Password</label>
                    <div class="password-container">
                        <input type="password" id="confirm_password" name="confirm_password" required>
                        <button type="button" class="toggle-password" onclick="togglePassword('confirm_password')">Show</button>
                    </div>
                </div>
                <button class="btn" type="submit">Update Password</button>
            </form>
        </div>
    </section>
</div>
<script>
function togglePassword(id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (el.type === 'password') { el.type = 'text'; } else { el.type = 'password'; }
}
</script>
<script src="../public/js/admin.js"></script>
</body>
</html>
