<?php
session_start();
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || strtolower($_SESSION['role']) !== 'admin') {
    header('Location: ../login.php');
    exit;
}
$username = htmlspecialchars($_SESSION['username']);
$active_page = 'dashboard';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Admin Dashboard</title>
    <link rel="stylesheet" href="../public/style/styles.css">
    <link rel="stylesheet" href="../public/style/admin.css">
</head>
<body class="admin-open">
    <?php include 'sidebar.php'; ?>

    <div class="main">
        <header class="topbar">
            <h1 class="page-title">Dashboard</h1>
        </header>

        <section class="content">
            <div class="welcome">
                <h2>Welcome to the Admin Dashboard, <?= $username ?>!</h2>
                <p>Here you can manage users, duties, slots, and view reports.</p>
                <p>Use the sidebar to navigate to different sections.</p>
            </div>
        </section>
    </div>

    <script src="../public/js/admin.js"></script>
</body>
</html>