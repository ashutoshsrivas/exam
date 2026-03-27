<?php
session_start();
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || strtolower($_SESSION['role']) !== 'admin') {
    header('Location: ../login.php');
    exit;
}
$username = htmlspecialchars($_SESSION['username']);
$active_page = 'slots';

require_once '../lib/conn.php';

$slot_id = isset($_GET['slot']) ? intval($_GET['slot']) : 0;
$duty_param = isset($_GET['duty']) ? intval($_GET['duty']) : 0;

$slot = null;
$participants = [];
$errorMessage = '';
$infoMessage = '';

if ($slot_id > 0) {
    $slotStmt = $conn->prepare("SELECT s.slottext, s.slottime, s.slotdate, s.requirement, s.duty, d.title AS duty_title, d.academicsession, d.type FROM slot s LEFT JOIN duties d ON s.duty = d.id WHERE s.id = ? LIMIT 1");
    $slotStmt->bind_param('i', $slot_id);
    $slotStmt->execute();
    $slot = $slotStmt->get_result()->fetch_assoc();
    $slotStmt->close();

    if ($slot) {
        $participantStmt = $conn->prepare("SELECT u.id, u.name, u.email, u.role, u.department FROM preferences p JOIN users u ON p.userid = u.id WHERE p.slotid = ? ORDER BY u.name");
        $participantStmt->bind_param('i', $slot_id);
        $participantStmt->execute();
        $participantResult = $participantStmt->get_result();
        while ($row = $participantResult->fetch_assoc()) {
            $participants[] = $row;
        }
        $participantStmt->close();

        if (empty($participants)) {
            $infoMessage = 'No attendees have selected this slot yet.';
        }
    } else {
        $errorMessage = 'Slot not found.';
    }
} else {
    $errorMessage = 'Missing slot identifier.';
}

if ($slot && count($participants) > 0 && isset($_GET['export']) && $_GET['export'] === '1') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="slot_' . $slot_id . '_attendees.csv"');
    $output = fopen('php://output', 'w');
    fputcsv($output, ['Sno.', 'Name', 'Email', 'Department', 'Role']);
    $sno = 1;
    foreach ($participants as $participant) {
        fputcsv($output, [$sno++, $participant['name'], $participant['email'], $participant['department'] ?: '—', $participant['role']]);
    }
    fclose($output);
    exit;
}

$selected_duty = $duty_param;
if ($slot && isset($slot['duty'])) {
    $selected_duty = intval($slot['duty']);
}
$backUrl = 'slots.php';
if ($selected_duty) {
    $backUrl .= '?duty=' . $selected_duty;
}
$exportUrl = '';
if ($slot && $selected_duty) {
    $exportUrl = 'slot_applicants.php?slot=' . $slot_id . '&duty=' . $selected_duty . '&export=1';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Admin - Slot Attendees</title>
    <link rel="stylesheet" href="../public/style/styles.css">
    <link rel="stylesheet" href="../public/style/admin.css">
</head>
<body class="admin-open">
    <?php include 'sidebar.php'; ?>

    <div class="main">
        <header class="topbar">
            <div class="topbar-left">
                <div class="title-block">
                    <h1 class="page-title">Slot Attendees</h1>
                    <?php if ($slot): ?>
                    <p class="page-subtitle">
                        <?= htmlspecialchars($slot['duty_title'] ?? 'Duty') ?> &ndash; <?= htmlspecialchars($slot['academicsession'] ?? '') ?>
                    </p>
                    <?php endif; ?>
                </div>
            </div>
            <div class="top-actions">
                <a href="<?= htmlspecialchars($backUrl) ?>" class="btn small">Back to Slots</a>
                <?php if ($slot && count($participants) > 0 && $exportUrl): ?>
                <a href="<?= htmlspecialchars($exportUrl) ?>" class="btn small export-btn" title="Export attendees">
                    Export CSV
                </a>
                <?php endif; ?>
            </div>
        </header>

        <section class="content">
            <div class="duties-table">
                <div class="table-header">
                    <h2>Participants</h2>
                    <?php if ($slot): ?>
                    <div class="meta" style="margin-top:4px; color:rgba(0,0,0,0.65); font-size:0.95rem;">
                        <?= htmlspecialchars($slot['slottext']) ?> &middot; <?= htmlspecialchars($slot['slotdate']) ?> @ <?= htmlspecialchars($slot['slottime']) ?>
                    </div>
                    <?php endif; ?>
                </div>

                <?php if ($errorMessage): ?>
                <div class="message error">
                    <?= htmlspecialchars($errorMessage) ?>
                </div>
                <?php elseif ($infoMessage): ?>
                <div class="message info">
                    <?= htmlspecialchars($infoMessage) ?>
                </div>
                <?php endif; ?>

                <?php if ($slot && count($participants) > 0): ?>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($participants as $participant): ?>
                        <tr>
                            <td><?= htmlspecialchars($participant['id']) ?></td>
                            <td><?= htmlspecialchars($participant['name']) ?></td>
                            <td><?= htmlspecialchars($participant['email']) ?></td>
                            <td><?= htmlspecialchars($participant['department'] ?? '—') ?></td>
                            <td><?= htmlspecialchars($participant['role']) ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                <?php endif; ?>
            </div>
        </section>
    </div>
</body>
</html>
