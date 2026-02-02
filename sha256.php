<?php
$hash = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST['password'])) {
    $password = $_POST['password'];
    $hash = hash('sha256', $password);
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>SHA-256 Generator</title>
    <link rel="stylesheet" href="./public/style/styles.css">
    <style>
        body { background: url('public/img/geu.jpg') no-repeat center center fixed; background-size: cover; }
        textarea.hash-box { width: 100%; height: 110px; padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.12); color: #fff; resize: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>SHA-256 </h1>
        <form method="POST" action="">
            <div class="form-group">
                <label for="password">Enter text / password</label>
                <input type="text" id="password" name="password" placeholder="Type anything...">
            </div>
            <button type="submit" class="btn">Generate Hash</button>
        </form>

        <?php if ($hash !== null): ?>
            <div class="form-group" style="margin-top:18px;">
                <label>SHA-256 Hash</label>
                <textarea class="hash-box" readonly><?= htmlspecialchars($hash) ?></textarea>
            </div>
        <?php endif; ?>

        <p style="margin-top:12px; font-size:0.9rem; color: rgba(255,255,255,0.85);">This tool computes the SHA-256 digest of the input text.</p>
    </div>
</body>
</html>