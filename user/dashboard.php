<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: ../login.php');
    exit;
}
require_once __DIR__ . '/../lib/conn.php';

$username = htmlspecialchars($_SESSION['username']);
$user_role = isset($_SESSION['role']) ? trim($_SESSION['role']) : 'Research Scholar';
$active_page = 'dashboard';

$user_id = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : 0;
if ($user_id > 0) {
    if ($stmt = $conn->prepare("SELECT role FROM users WHERE id = ? LIMIT 1")) {
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $userRow = $result->fetch_assoc();
        if (!empty($userRow['role'])) {
            $user_role = trim($userRow['role']);
            $_SESSION['role'] = $user_role;
        }
        $stmt->close();
    }
}

$roleLimitColumn = [
    'Professor' => 'professor',
    'Assistant Professor' => 'assistantprofessor',
    'Associate Professor' => 'associateprofessor',
    'Research Scholar' => 'researchscholar',
];
$normalizedRole = ucwords(strtolower($user_role));
$limitColumn = $roleLimitColumn[$user_role] ?? $roleLimitColumn[$normalizedRole] ?? 'researchscholar';

$duties = [];
$query = "SELECT id, title, academicsession, type, createdat, professor, assistantprofessor, associateprofessor, researchscholar FROM duties ORDER BY createdat DESC";
if ($result = $conn->query($query)) {
    while ($row = $result->fetch_assoc()) {
        $stmt = $conn->prepare("SELECT COUNT(*) as cnt FROM slot WHERE duty = ?");
        $stmt->bind_param("i", $row['id']);
        $stmt->execute();
        $res2 = $stmt->get_result();
        $row['slots'] = intval($res2->fetch_assoc()['cnt'] ?? 0);
        $stmt->close();
        $duties[] = $row;
    }
}

$total_duties = 0;
$total_slots = 0;
if ($r = $conn->query("SELECT COUNT(*) as cnt FROM duties")) {
    $total_duties = intval($r->fetch_assoc()['cnt'] ?? 0);
}
if ($r = $conn->query("SELECT COUNT(*) as cnt FROM slot")) {
    $total_slots = intval($r->fetch_assoc()['cnt'] ?? 0);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>User Dashboard</title>
    <link rel="stylesheet" href="../public/style/styles.css">
    <link rel="stylesheet" href="../public/style/admin.css">
    <link rel="stylesheet" href="../public/style/user.css">
</head>
<body class="user-open">
    <?php include __DIR__ . '/sidebar.php'; ?>

    <div class="main">
        <header class="topbar">
            <h1 class="page-title">Dashboard</h1>
            <div class="top-actions">
                <a href="../logout.php" class="btn small">Logout</a>
            </div>
        </header>

        <section class="content">
            <div class="duties-table">
                <div class="table-header">
                    <h2>Available Duties</h2>
                </div>

                <div class="duties-cards">
                    <?php if (count($duties) === 0): ?>
                        <div class="card empty">No duties available.</div>
                    <?php else: foreach ($duties as $duty): ?>
                        <div class="card" role="article" aria-labelledby="duty-<?= $duty['id'] ?>">
                            <h3 id="duty-<?= $duty['id'] ?>"><?= htmlspecialchars($duty['title']) ?></h3>
                            <div class="meta-row">
                                <p class="meta"><?= htmlspecialchars($duty['academicsession']) ?> • <?= htmlspecialchars($duty['type']) ?></p>
                                <p class="meta">Slots: <?= $duty['slots'] ?> • <?= date('M d, Y', strtotime($duty['createdat'])) ?></p>
                            </div>
                            <hr class="card-divider" aria-hidden="true">
                            <p class="desc"><?= htmlspecialchars(substr($duty['title'], 0, 160)) ?><?= strlen($duty['title']) > 160 ? '...' : '' ?></p>
                            <p class="meta" style="font-weight:600;">Your limit: <?= intval($duty[$limitColumn] ?? 0) ?></p>
                            <div class="card-actions">
                                <a class="btn small primary" href="slots.php?duty=<?= $duty['id'] ?>" role="button" aria-label="View slots for <?= htmlspecialchars($duty['title']) ?>">View Slots</a>
                            </div>
                        </div>
                    <?php endforeach; endif; ?>
                </div>
            </div>
        </section>
    </div>

    <script>
    // Add a small loading state for primary actions
    document.addEventListener('click', function(e){
        var btn = e.target.closest && e.target.closest('.btn.primary');
        if(!btn) return;
        btn.classList.add('loading');
        btn.setAttribute('aria-disabled','true');
        btn.style.pointerEvents = 'none';
    });
    </script>
    <script src="../public/js/admin.js"></script>
</body>
</html>
