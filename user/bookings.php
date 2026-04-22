<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: ../login.php');
    exit;
}
require_once __DIR__ . '/../lib/conn.php';

$username = isset($_SESSION['username']) ? htmlspecialchars($_SESSION['username']) : 'User';
$user_role = isset($_SESSION['role']) ? trim($_SESSION['role']) : 'Research Scholar';
$active_page = 'bookings';
$user_id = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : 0;

// Fetch all duties where user has made selections
$my_bookings = [];
$query = "SELECT DISTINCT d.id, d.title, d.academicsession, d.type, d.accepting_bookings, d.createdat 
          FROM duties d 
          INNER JOIN slot s ON s.duty = d.id 
          INNER JOIN preferences p ON p.slotid = s.id 
          WHERE p.userid = ? 
          ORDER BY d.createdat DESC";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    // Get slots for this duty that user selected
    $slot_query = "SELECT s.id, s.slottext, s.slottime, s.slotdate 
                   FROM slot s 
                   INNER JOIN preferences p ON p.slotid = s.id 
                   WHERE s.duty = ? AND p.userid = ? 
                   ORDER BY s.slotdate, s.slottime";
    $slot_stmt = $conn->prepare($slot_query);
    $slot_stmt->bind_param("ii", $row['id'], $user_id);
    $slot_stmt->execute();
    $slot_result = $slot_stmt->get_result();
    $row['selected_slots'] = $slot_result->fetch_all(MYSQLI_ASSOC);
    $slot_stmt->close();
    
    $my_bookings[] = $row;
}
$stmt->close();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>My Slots</title>
    <link rel="stylesheet" href="../public/style/styles.css">
    <link rel="stylesheet" href="../public/style/admin.css">
    <style>
        .booking-card {
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-md);
            padding: 20px;
            margin-bottom: 16px;
            box-shadow: var(--shadow-soft);
        }
        
        .booking-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
            gap: 12px;
        }
        
        .booking-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-color);
            margin: 0 0 4px 0;
        }
        
        .booking-meta {
            font-size: 0.9rem;
            color: var(--muted-soft);
        }
        
        .booking-status {
            flex-shrink: 0;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-open {
            background: rgba(21, 115, 71, 0.12);
            color: var(--success);
            border: 1px solid rgba(21, 115, 71, 0.25);
        }
        
        .status-closed {
            background: rgba(176, 42, 55, 0.12);
            color: var(--danger);
            border: 1px solid rgba(176, 42, 55, 0.25);
        }
        
        .selected-slots {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid var(--glass-border);
        }
        
        .selected-slots h4 {
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--muted);
            margin: 0 0 12px 0;
        }
        
        .slots-list {
            display: grid;
            gap: 8px;
        }
        
        .slot-item {
            background: rgba(20, 108, 148, 0.08);
            border: 1px solid rgba(20, 108, 148, 0.15);
            border-radius: var(--radius-sm);
            padding: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .slot-name {
            font-weight: 600;
            color: var(--text-color);
        }
        
        .slot-time-date {
            font-size: 0.85rem;
            color: var(--muted-soft);
        }
        
        .booking-actions {
            margin-top: 12px;
            display: flex;
            gap: 8px;
        }
        
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--muted-soft);
        }
        
        .empty-state h3 {
            font-size: 1.25rem;
            margin-bottom: 8px;
            color: var(--muted);
        }
        
        .empty-state p {
            margin-bottom: 20px;
        }
    </style>
</head>
<body class="user-open">
<?php include __DIR__ . '/sidebar.php'; ?>
<div class="main">
    <header class="topbar">
        <h1 class="page-title">My Slots</h1>
    </header>
    <section class="content">
        <div class="duties-table">
            <div class="table-header">
                <h2>Your Selected Slots</h2>
                <div class="meta" style="margin-top: 4px; color: var(--muted-soft); font-size: 0.95rem;">
                    View all your slot selections across all duties
                </div>
            </div>
            
            <?php if (empty($my_bookings)): ?>
                <div class="empty-state">
                    <h3>No slots selected yet</h3>
                    <p>You haven't selected any duty slots yet.</p>
                    <a href="dashboard.php" class="btn primary">Browse Available Duties</a>
                </div>
            <?php else: ?>
                <?php foreach ($my_bookings as $booking): ?>
                    <?php
                        $is_accepting = intval($booking['accepting_bookings'] ?? 1) === 1;
                        $status_class = $is_accepting ? 'status-open' : 'status-closed';
                        $status_text = $is_accepting ? 'Open' : 'Closed';
                    ?>
                    <div class="booking-card">
                        <div class="booking-header">
                            <div>
                                <h3 class="booking-title"><?= htmlspecialchars($booking['title']) ?></h3>
                                <div class="booking-meta">
                                    <?= htmlspecialchars($booking['academicsession']) ?> &mdash; 
                                    <?= htmlspecialchars($booking['type']) ?>
                                </div>
                            </div>
                            <div class="booking-status">
                                <span class="status-badge <?= $status_class ?>"><?= $status_text ?></span>
                            </div>
                        </div>
                        
                        <div class="selected-slots">
                            <h4>✓ Your Selected Slots (<?= count($booking['selected_slots']) ?>)</h4>
                            <div class="slots-list">
                                <?php foreach ($booking['selected_slots'] as $slot): ?>
                                    <div class="slot-item">
                                        <div>
                                            <div class="slot-name"><?= htmlspecialchars($slot['slottext']) ?></div>
                                        </div>
                                        <div class="slot-time-date">
                                            <?= htmlspecialchars($slot['slotdate']) ?> at <?= htmlspecialchars($slot['slottime']) ?>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        </div>
                        
                        <div class="booking-actions">
                            <a href="slots.php?duty=<?= $booking['id'] ?>" class="btn small">
                                View Details
                            </a>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </section>
</div>
<script src="../public/js/admin.js"></script>
</body>
</html>
