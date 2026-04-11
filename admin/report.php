<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || strtolower($_SESSION['role']) !== 'admin') {
    header('Location: ../login.php');
    exit;
}
require_once '../lib/conn.php';

$conn->query("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT NULL AFTER email");

$username = htmlspecialchars($_SESSION['username']);
$active_page = 'reports';

// Fetch duties
$duties = [];
$duties_q = "SELECT id, title, academicsession FROM duties ORDER BY createdat DESC";
if ($res = $conn->query($duties_q)) {
    while ($row = $res->fetch_assoc()) {
        $duties[] = $row;
    }
}

$selected_duty = isset($_REQUEST['duty']) ? intval($_REQUEST['duty']) : 0;
$selected_slot = isset($_REQUEST['slot']) ? intval($_REQUEST['slot']) : 0;

// Fetch slots for selected duty
$slots = [];
if ($selected_duty) {
    $sstmt = $conn->prepare('SELECT id, slottext, slottime, slotdate FROM slot WHERE duty = ? ORDER BY slotdate, slottime');
    $sstmt->bind_param('i', $selected_duty);
    $sstmt->execute();
    $sr = $sstmt->get_result();
    while ($r = $sr->fetch_assoc()) {
        $slots[] = $r;
    }
    $sstmt->close();
}


$results = [];
$report_title = '';
$csv_headers = ['ID','Name','Email','Phone','Department','EmployeeID','Role'];
$report_type = '';
$filename = 'report.csv';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $action = $_POST['action'];
    $duty = intval($_POST['duty'] ?? 0);
    $slot = intval($_POST['slot'] ?? 0);
    $download = false;

    // Normalize actions ending with _csv to trigger export (safe for PHP <8: use substr)
    if (substr($action, -4) === '_csv') {
        $download = true;
        $action = substr($action, 0, -4);
    }

    if ($action === 'slot_attendees' && $slot > 0) {
        // Users who selected a specific slot
        $stmt = $conn->prepare('SELECT u.id,u.name,u.email,u.phone,u.department,u.employeeid,u.role FROM preferences p JOIN users u ON p.userid = u.id WHERE p.slotid = ? ORDER BY u.name');
        $stmt->bind_param('i', $slot);
        $stmt->execute();
        $res = $stmt->get_result();
        while ($row = $res->fetch_assoc()) $results[] = $row;
        $stmt->close();
        $report_type = 'users';
        $report_title = 'Attendees for slot ID ' . $slot;
        $filename = 'slot_' . $slot . '_attendees.csv';
    } elseif ($action === 'duty_opted' && $duty > 0) {
        // Users who opted any slot in duty
        $stmt = $conn->prepare('SELECT DISTINCT u.id,u.name,u.email,u.phone,u.department,u.employeeid,u.role FROM preferences p JOIN slot s ON p.slotid = s.id JOIN users u ON p.userid = u.id WHERE s.duty = ? ORDER BY u.name');
        $stmt->bind_param('i', $duty);
        $stmt->execute();
        $res = $stmt->get_result();
        while ($row = $res->fetch_assoc()) $results[] = $row;
        $stmt->close();
        $report_type = 'users';
        $report_title = 'Users who opted any slot for duty ID ' . $duty;
        $filename = 'duty_' . $duty . '_opted.csv';
    } elseif ($action === 'duty_not_opted' && $duty > 0) {
        // Users who have not opted any slot in that duty
        $stmt = $conn->prepare('SELECT u.id,u.name,u.email,u.phone,u.department,u.employeeid,u.role FROM users u WHERE u.id NOT IN (SELECT p.userid FROM preferences p JOIN slot s ON p.slotid = s.id WHERE s.duty = ?) ORDER BY u.name');
        $stmt->bind_param('i', $duty);
        $stmt->execute();
        $res = $stmt->get_result();
        while ($row = $res->fetch_assoc()) $results[] = $row;
        $stmt->close();
        $report_type = 'users';
        $report_title = 'Users who DID NOT opt any slot for duty ID ' . $duty;
        $filename = 'duty_' . $duty . '_not_opted.csv';
    } elseif ($action === 'duty_slotwise' && $duty > 0) {
        // All slots for duty with users under each slot
        $stmt = $conn->prepare('SELECT s.id AS slot_id,s.slottext,s.slotdate,s.slottime,u.id AS user_id,u.name,u.email,u.phone,u.department,u.employeeid,u.role FROM slot s LEFT JOIN preferences p ON p.slotid = s.id LEFT JOIN users u ON p.userid = u.id WHERE s.duty = ? ORDER BY s.slotdate, s.slottime, u.name');
        $stmt->bind_param('i', $duty);
        $stmt->execute();
        $res = $stmt->get_result();
        while ($row = $res->fetch_assoc()) $results[] = $row;
        $stmt->close();
        $report_title = 'Slotwise list for duty ID ' . $duty;
        $report_type = 'slotwise';
        $csv_headers = ['SlotID','Slot','SlotDate','SlotTime','UserID','Name','Email','Phone','Department','EmployeeID','Role'];
        $filename = 'duty_' . $duty . '_slotwise.csv';
    } elseif ($action === 'duty_userwise' && $duty > 0) {
        // Users with the slot they opted for this duty
        $stmt = $conn->prepare('SELECT u.id AS user_id,u.name,u.email,u.phone,u.department,u.employeeid,u.role,s.id AS slot_id,s.slottext,s.slotdate,s.slottime FROM preferences p JOIN slot s ON p.slotid = s.id JOIN users u ON p.userid = u.id WHERE s.duty = ? ORDER BY u.name, s.slotdate, s.slottime');
        $stmt->bind_param('i', $duty);
        $stmt->execute();
        $res = $stmt->get_result();
        while ($row = $res->fetch_assoc()) $results[] = $row;
        $stmt->close();
        $report_title = 'Userwise list for duty ID ' . $duty;
        $report_type = 'userwise';
        $csv_headers = ['UserID','Name','Email','Phone','Department','EmployeeID','Role','SlotID','Slot','SlotDate','SlotTime'];
        $filename = 'duty_' . $duty . '_userwise.csv';
    }

    // CSV export if requested
    if ($download) {
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        $out = fopen('php://output', 'w');
        fputcsv($out, $csv_headers);
        foreach ($results as $r) {
            if ($action === 'duty_slotwise') {
                fputcsv($out, [
                    $r['slot_id'],
                    $r['slottext'],
                    $r['slotdate'],
                    $r['slottime'],
                    $r['user_id'],
                    $r['name'],
                    $r['email'],
                    $r['phone'] ?? '',
                    $r['department'] ?? '',
                    $r['employeeid'],
                    $r['role']
                ]);
            } elseif ($action === 'duty_userwise') {
                fputcsv($out, [
                    $r['user_id'],
                    $r['name'],
                    $r['email'],
                    $r['phone'] ?? '',
                    $r['department'] ?? '',
                    $r['employeeid'],
                    $r['role'],
                    $r['slot_id'],
                    $r['slottext'],
                    $r['slotdate'],
                    $r['slottime']
                ]);
            } else {
                fputcsv($out, [$r['id'],$r['name'],$r['email'],$r['phone'] ?? '',$r['department'] ?? '',$r['employeeid'],$r['role']]);
            }
        }
        fclose($out);
        exit;
    }
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Admin - Reports</title>
    <link rel="stylesheet" href="../public/style/styles.css">
    <link rel="stylesheet" href="../public/style/admin.css">
    <style>
        .report-panels { max-width:1100px; margin:18px auto 6px; display:grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap:16px; align-items:start; }
        .panel { background: var(--glass-bg); border:1px solid var(--glass-border); border-radius:14px; padding:18px 18px 14px; box-shadow: var(--shadow); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
        .panel h3 { margin:0 0 10px 0; color: var(--muted); font-size:1.05rem; font-weight:700; }
        .stack { display:flex; flex-direction:column; gap:10px; }
        .inline { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
        .inline label { min-width:70px; color: var(--muted); font-weight:600; }
        .inline select { flex:1; min-width:180px; padding:10px; border-radius:10px; border:1px solid var(--glass-border); background: rgba(255,255,255,0.88); }
        .inline select:focus { outline:none; border-color: var(--accent); box-shadow: 0 0 0 2px rgba(0,123,255,0.2); }
        .btn-group { display:flex; gap:8px; flex-wrap:wrap; }
        .btn { padding:10px 14px; border-radius:10px; border:1px solid rgba(0,0,0,0.06); background: linear-gradient(135deg, var(--accent), #0056b3); color:#fff; cursor:pointer; box-shadow: 0 6px 16px rgba(0,123,255,0.25); transition: transform 0.15s ease, box-shadow 0.2s ease; }
        .btn.secondary { background: rgba(0,0,0,0.04); color: var(--muted); border:1px solid rgba(0,0,0,0.08); box-shadow:none; }
        .btn:disabled { opacity:0.45; cursor:not-allowed; box-shadow:none; transform:none; }
        .btn:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(0,123,255,0.3); }
        .report-results { max-width:1100px; margin:16px auto 12px; background: var(--glass-bg); border-radius:14px; padding:16px 18px; border:1px solid var(--glass-border); box-shadow: var(--shadow); }
        .report-results table { width:100%; border-collapse:collapse; }
        .report-results th, .report-results td { padding:10px 12px; border-bottom:1px solid rgba(0,0,0,0.06); }
        .report-results thead th { background: rgba(0,123,255,0.08); color: var(--accent); text-align:left; }
    </style>
</head>
<body class="admin-open">
<?php include 'sidebar.php'; ?>
<div class="main">
    <header class="topbar"><h1 class="page-title">Reports</h1></header>
    <section class="content">
        <div class="report-panels">
            <div class="panel">
                <h3>Duty reports</h3>
                <form method="get" class="stack">
                    <div class="inline">
                        <label for="duty">Duty</label>
                        <select id="duty" name="duty" onchange="this.form.submit()">
                            <option value="">-- Select Duty --</option>
                            <?php foreach ($duties as $d): ?>
                                <option value="<?= $d['id'] ?>" <?= $selected_duty == $d['id'] ? 'selected' : '' ?>><?= htmlspecialchars($d['title']) ?> (<?= htmlspecialchars($d['academicsession']) ?>)</option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </form>
                <form method="post" class="stack" style="margin-top:4px;">
                    <input type="hidden" name="duty" value="<?= $selected_duty ?>">
                    <div class="btn-group">
                        <button type="submit" name="action" value="duty_opted" class="btn" <?= $selected_duty ? '' : 'disabled' ?>>View Users Opted</button>
                        <button type="submit" name="action" value="duty_opted_csv" class="btn secondary" <?= $selected_duty ? '' : 'disabled' ?>>Download Opted CSV</button>
                        <button type="submit" name="action" value="duty_not_opted" class="btn" <?= $selected_duty ? '' : 'disabled' ?>>View Users NOT Opted</button>
                        <button type="submit" name="action" value="duty_not_opted_csv" class="btn secondary" <?= $selected_duty ? '' : 'disabled' ?>>Download NOT Opted CSV</button>
                        <button type="submit" name="action" value="duty_slotwise_csv" class="btn secondary" <?= $selected_duty ? '' : 'disabled' ?>>Download Slotwise List</button>
                        <button type="submit" name="action" value="duty_userwise_csv" class="btn secondary" <?= $selected_duty ? '' : 'disabled' ?>>Download Userwise List</button>
                    </div>
                </form>
            </div>

            <div class="panel">
                <h3>Slot reports</h3>
                <form method="post" class="stack">
                    <input type="hidden" name="duty" value="<?= $selected_duty ?>">
                    <div class="inline">
                        <label for="slot">Slot</label>
                        <select id="slot" name="slot">
                            <option value="">-- Select Slot --</option>
                            <?php foreach ($slots as $s): ?>
                                <option value="<?= $s['id'] ?>" <?= $selected_slot == $s['id'] ? 'selected' : '' ?>><?= htmlspecialchars($s['slottext']) ?> (<?= htmlspecialchars($s['slotdate']) ?> <?= htmlspecialchars($s['slottime']) ?>)</option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="btn-group">
                        <button type="submit" name="action" value="slot_attendees" class="btn slot-action" <?= $selected_slot ? '' : 'disabled' ?>>View Slot Attendees</button>
                        <button type="submit" name="action" value="slot_attendees_csv" class="btn secondary slot-action" <?= $selected_slot ? '' : 'disabled' ?>>Download Slot CSV</button>
                    </div>
                </form>
            </div>
        </div>

        <div class="report-results">
            <?php if ($report_title): ?>
                <h2><?= htmlspecialchars($report_title) ?></h2>
            <?php endif; ?>
            <?php if (empty($results) && $report_title): ?>
                <div class="message info">No records found for this report.</div>
            <?php elseif (!empty($results)): ?>
                <table>
                    <thead>
                        <?php if ($report_type === 'slotwise'): ?>
                            <tr><th>Slot ID</th><th>Slot</th><th>Slot Date</th><th>Slot Time</th><th>User ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Department</th><th>Employee ID</th><th>Role</th></tr>
                        <?php elseif ($report_type === 'userwise'): ?>
                            <tr><th>User ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Department</th><th>Employee ID</th><th>Role</th><th>Slot ID</th><th>Slot</th><th>Slot Date</th><th>Slot Time</th></tr>
                        <?php else: ?>
                            <tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Department</th><th>Employee ID</th><th>Role</th></tr>
                        <?php endif; ?>
                    </thead>
                    <tbody>
                        <?php foreach ($results as $r): ?>
                            <?php if ($report_type === 'slotwise'): ?>
                                <tr>
                                    <td><?= htmlspecialchars($r['slot_id']) ?></td>
                                    <td><?= htmlspecialchars($r['slottext']) ?></td>
                                    <td><?= htmlspecialchars($r['slotdate']) ?></td>
                                    <td><?= htmlspecialchars($r['slottime']) ?></td>
                                    <td><?= htmlspecialchars($r['user_id'] ?? '') ?></td>
                                    <td><?= htmlspecialchars($r['name'] ?? '') ?></td>
                                    <td><?= htmlspecialchars($r['email'] ?? '') ?></td>
                                    <td><?= htmlspecialchars($r['phone'] ?? '') ?></td>
                                    <td><?= htmlspecialchars($r['department'] ?? '') ?></td>
                                    <td><?= htmlspecialchars($r['employeeid'] ?? '') ?></td>
                                    <td><?= htmlspecialchars($r['role'] ?? '') ?></td>
                                </tr>
                            <?php elseif ($report_type === 'userwise'): ?>
                                <tr>
                                    <td><?= htmlspecialchars($r['user_id']) ?></td>
                                    <td><?= htmlspecialchars($r['name']) ?></td>
                                    <td><?= htmlspecialchars($r['email']) ?></td>
                                    <td><?= htmlspecialchars($r['phone'] ?? '') ?></td>
                                    <td><?= htmlspecialchars($r['department'] ?? '') ?></td>
                                    <td><?= htmlspecialchars($r['employeeid']) ?></td>
                                    <td><?= htmlspecialchars($r['role']) ?></td>
                                    <td><?= htmlspecialchars($r['slot_id']) ?></td>
                                    <td><?= htmlspecialchars($r['slottext']) ?></td>
                                    <td><?= htmlspecialchars($r['slotdate']) ?></td>
                                    <td><?= htmlspecialchars($r['slottime']) ?></td>
                                </tr>
                            <?php else: ?>
                                <tr>
                                    <td><?= htmlspecialchars($r['id']) ?></td>
                                    <td><?= htmlspecialchars($r['name']) ?></td>
                                    <td><?= htmlspecialchars($r['email']) ?></td>
                                    <td><?= htmlspecialchars($r['phone'] ?? '') ?></td>
                                    <td><?= htmlspecialchars($r['department'] ?? '') ?></td>
                                    <td><?= htmlspecialchars($r['employeeid']) ?></td>
                                    <td><?= htmlspecialchars($r['role']) ?></td>
                                </tr>
                            <?php endif; ?>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
    </section>
</div>
</body>
<script>
// Enable slot actions when a slot is chosen client-side
(function() {
    const slotSelect = document.getElementById('slot');
    const slotButtons = Array.from(document.querySelectorAll('.slot-action'));
    if (!slotSelect || !slotButtons.length) return;
    const toggle = () => {
        const hasSlot = slotSelect.value !== '';
        slotButtons.forEach(btn => btn.disabled = !hasSlot);
    };
    slotSelect.addEventListener('change', toggle);
    toggle();
})();
</script>
</html>
