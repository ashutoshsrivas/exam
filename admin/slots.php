<?php
session_start();
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || strtolower($_SESSION['role']) !== 'admin') {
    header('Location: ../login.php');
    exit;
}

require_once '../lib/conn.php';

// Fetch duties for dropdown
$duties_query = "SELECT id, title, academicsession, type FROM duties ORDER BY createdat DESC";
$duties_result = $conn->query($duties_query);
$duties = [];
if ($duties_result) {
    while ($row = $duties_result->fetch_assoc()) {
        $duties[] = $row;
    }
}

// Get selected duty
$selected_duty = null;
if (isset($_REQUEST['duty']) && $_REQUEST['duty'] !== '') {
    $selected_duty = intval($_REQUEST['duty']);
} elseif (isset($duties[0]['id'])) {
    $selected_duty = $duties[0]['id'];
}

// Fetch slots for selected duty with applicant counts
$slots_query = "SELECT s.id, s.slottext, s.slottime, s.slotdate, s.requirement, 
                (SELECT COUNT(*) FROM preferences p WHERE p.slotid = s.id) AS applicants 
                FROM slot s WHERE s.duty = ? ORDER BY s.slotdate, s.slottime";

function fetchSlotsForDuty($conn, $query, $dutyId) {
    $slots = [];
    if (!$dutyId) return $slots;
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $dutyId);
    $stmt->execute();
    $slots_result = $stmt->get_result();
    while ($row = $slots_result->fetch_assoc()) {
        $slots[] = $row;
    }
    $stmt->close();
    return $slots;
}

$slots = fetchSlotsForDuty($conn, $slots_query, $selected_duty);

// Group slots by date
$slots_by_date = [];
foreach ($slots as $slot) {
    $slots_by_date[$slot['slotdate']][] = $slot;
}

$message = '';
$message_type = '';

// Handle add slot
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_slot'])) {
    $slottext = trim($_POST['slottext']);
    $slottime = trim($_POST['slottime']);
    $slotdate = trim($_POST['slotdate']);
    $requirement = intval($_POST['requirement']);

    if (empty($slottext) || empty($slottime) || empty($slotdate) || $requirement < 0) {
        $message = 'All fields are required and requirement must be non-negative.';
        $message_type = 'error';
    } else {
        $stmt = $conn->prepare("INSERT INTO slot (duty, slottext, slottime, slotdate, requirement) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("isssi", $selected_duty, $slottext, $slottime, $slotdate, $requirement);
        if ($stmt->execute()) {
            $message = 'Slot added successfully.';
            $message_type = 'success';
            $slots = fetchSlotsForDuty($conn, $slots_query, $selected_duty);
            $slots_by_date = [];
            foreach ($slots as $slot) {
                $slots_by_date[$slot['slotdate']][] = $slot;
            }
        } else {
            $message = 'Error adding slot.';
            $message_type = 'error';
        }
        $stmt->close();
    }
}

// Handle delete slot
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_slot'])) {
    $slot_id = intval($_POST['slot_id']);
    $stmt = $conn->prepare("DELETE FROM slot WHERE id = ?");
    $stmt->bind_param("i", $slot_id);
    if ($stmt->execute()) {
        $message = 'Slot deleted successfully.';
        $message_type = 'success';
        $slots = fetchSlotsForDuty($conn, $slots_query, $selected_duty);
        $slots_by_date = [];
        foreach ($slots as $slot) {
            $slots_by_date[$slot['slotdate']][] = $slot;
        }
    } else {
        $message = 'Error deleting slot.';
        $message_type = 'error';
    }
    $stmt->close();
}

// Handle update slot
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_slot'])) {
    $slot_id = intval($_POST['slot_id']);
    $slottext = trim($_POST['slottext']);
    $slottime = trim($_POST['slottime']);
    $slotdate = trim($_POST['slotdate']);
    $requirement = intval($_POST['requirement']);

    if (empty($slottext) || empty($slottime) || empty($slotdate) || $requirement < 0) {
        $message = 'All fields are required and requirement must be non-negative.';
        $message_type = 'error';
    } else {
        $stmt = $conn->prepare("UPDATE slot SET slottext = ?, slottime = ?, slotdate = ?, requirement = ? WHERE id = ?");
        $stmt->bind_param("sssii", $slottext, $slottime, $slotdate, $requirement, $slot_id);
        if ($stmt->execute()) {
            $message = 'Slot updated successfully.';
            $message_type = 'success';
            $slots = fetchSlotsForDuty($conn, $slots_query, $selected_duty);
            $slots_by_date = [];
            foreach ($slots as $slot) {
                $slots_by_date[$slot['slotdate']][] = $slot;
            }
        } else {
            $message = 'Error updating slot.';
            $message_type = 'error';
        }
        $stmt->close();
    }
}

// Handle auto-generate slots
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['auto_generate_slots'])) {
    $raw_dates = $_POST['slot_dates'] ?? [];
    $dates = [];
    foreach ($raw_dates as $raw_date) {
        $candidate = trim($raw_date);
        $dateObject = DateTime::createFromFormat('Y-m-d', $candidate);
        if ($candidate && $dateObject && $dateObject->format('Y-m-d') === $candidate) {
            $dates[] = $candidate;
        }
    }
    $dates = array_values(array_unique($dates));

    $slot_texts = $_POST['slot_texts'] ?? [];
    $slot_times = $_POST['slot_times'] ?? [];
    $slot_requirements = $_POST['slot_requirements'] ?? [];
    $slot_count = count($slot_texts);
    $slot_templates = [];

    if (empty($dates)) {
        $message = 'Please add at least one date.';
        $message_type = 'error';
    } elseif ($slot_count === 0 || count($slot_times) !== $slot_count || count($slot_requirements) !== $slot_count) {
        $message = 'Please provide slot details for all slots.';
        $message_type = 'error';
    } else {
        for ($i = 0; $i < $slot_count; $i++) {
            $text = trim($slot_texts[$i]);
            $time = trim($slot_times[$i]);
            $reqInput = trim($slot_requirements[$i]);
            if ($text === '' || $time === '' || $reqInput === '') {
                $message = 'All slot fields are required.';
                $message_type = 'error';
                break;
            }
            if (!is_numeric($reqInput)) {
                $message = 'Requirement must be a number.';
                $message_type = 'error';
                break;
            }
            $requirement = intval($reqInput);
            if ($requirement < 0) {
                $message = 'Requirement must be non-negative.';
                $message_type = 'error';
                break;
            }
            $slot_templates[] = [$text, $time, $requirement];
        }
    }

    if ($message_type !== 'error') {
        if (!$selected_duty) {
            $message = 'Please select a duty first.';
            $message_type = 'error';
        } else {
            $insert_stmt = $conn->prepare("INSERT INTO slot (duty, slottext, slottime, slotdate, requirement) VALUES (?, ?, ?, ?, ?)");
            $generated = 0;
            $failed = false;
            if ($insert_stmt) {
                foreach ($dates as $slot_date) {
                    foreach ($slot_templates as $template) {
                        [$slottext, $slottime, $requirement] = $template;
                        $insert_stmt->bind_param("isssi", $selected_duty, $slottext, $slottime, $slot_date, $requirement);
                        if (!$insert_stmt->execute()) {
                            $failed = true;
                            break 2;
                        }
                        $generated++;
                    }
                }
                $insert_stmt->close();
            } else {
                $failed = true;
            }

            if ($failed) {
                $message = 'Error generating slots.';
                $message_type = 'error';
            } else {
                $message = sprintf('Generated %d slots across %d dates.', $generated, count($dates));
                $message_type = 'success';
                $slots = fetchSlotsForDuty($conn, $slots_query, $selected_duty);
                $slots_by_date = [];
                foreach ($slots as $slot) {
                    $slots_by_date[$slot['slotdate']][] = $slot;
                }
            }
        }
    }
}

$username = htmlspecialchars($_SESSION['username']);
$active_page = 'slots';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Admin - Slots</title>
    <link rel="stylesheet" href="../public/style/styles.css">
    <link rel="stylesheet" href="../public/style/admin.css">
    <style>
        /* Card-based Slot Layout */
        .date-group {
            margin-bottom: 32px;
        }
        
        .date-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 2px solid rgba(20, 108, 148, 0.1);
        }
        
        .date-heading .date-label {
            color: var(--accent-strong);
            font-size: 1.15rem;
            font-weight: 700;
        }
        
        .date-heading .date-subtitle {
            font-size: 0.85rem;
            color: var(--muted-soft);
            margin-left: auto;
        }
        
        .date-slots-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 16px;
        }
        
        .slot-card {
            padding: 18px;
            border: 2px solid rgba(20, 108, 148, 0.08);
            border-radius: 16px;
            background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,251,252,0.88));
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .slot-card:hover {
            border-color: rgba(20, 108, 148, 0.2);
            box-shadow: 0 12px 28px rgba(20, 108, 148, 0.12);
            transform: translateY(-3px);
        }
        
        .slot-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 10px;
        }
        
        .slot-card h3 {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--text-color);
            line-height: 1.3;
            word-break: break-word;
            flex: 1;
        }
        
        .slot-card .badge {
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            white-space: nowrap;
            flex-shrink: 0;
        }
        
        .badge.available {
            background: rgba(21, 115, 71, 0.12);
            color: var(--success);
        }
        
        .badge.full {
            background: rgba(176, 42, 55, 0.12);
            color: var(--danger);
        }
        
        .badge.partial {
            background: rgba(184, 107, 0, 0.12);
            color: var(--warning);
        }
        
        .slot-card .meta {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.92rem;
            color: var(--muted);
            margin: 0;
        }
        
        .slot-card .meta::before {
            content: '🕐';
            font-size: 0.9rem;
        }
        
        .slot-card .stats {
            display: flex;
            gap: 16px;
            padding-top: 8px;
            border-top: 1px solid rgba(20, 108, 148, 0.08);
            font-size: 0.85rem;
        }
        
        .slot-card .stat-item {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        
        .slot-card .stat-label {
            color: var(--muted-soft);
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .slot-card .stat-value {
            color: var(--text-color);
            font-weight: 700;
            font-size: 1rem;
        }
        
        .slot-card-actions {
            display: flex;
            gap: 8px;
            margin-top: 8px;
        }
        
        .slot-card-actions .btn {
            flex: 1;
            padding: 8px 12px;
            font-size: 0.85rem;
            text-align: center;
            text-decoration: none;
            display: inline-block;
        }
        
        .duty-select-wrapper {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .duty-select {
            padding: 8px 12px;
            border: 1px solid rgba(0,0,0,0.1);
            border-radius: 8px;
            background: rgba(255,255,255,0.8);
            color: #333;
            font-size: 14px;
            min-width: 250px;
        }
        
        .duty-select:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 2px rgba(20, 108, 148, 0.1);
        }
        
        .auto-slot-date-row {
            display: flex;
            gap: 8px;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .date-pill-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
            min-height: 20px;
        }
        
        .date-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            border-radius: 999px;
            border: 1px solid rgba(0, 123, 255, 0.3);
            background: rgba(0, 123, 255, 0.08);
            font-size: 13px;
            color: #0d6efd;
        }
        
        .date-pill button {
            background: transparent;
            border: none;
            color: inherit;
            font-weight: bold;
            cursor: pointer;
            padding: 0;
            line-height: 1;
            font-size: 16px;
        }
        
        .date-pill button:hover {
            color: #dc3545;
        }
        
        .slot-detail-group {
            padding: 14px;
            border-radius: 12px;
            border: 1px solid rgba(0, 0, 0, 0.08);
            background: rgba(255, 255, 255, 0.6);
            margin-bottom: 12px;
        }
        
        .slot-detail-group h4 {
            margin: 0 0 12px 0;
            font-size: 0.9rem;
            font-weight: 700;
            color: var(--accent-strong);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--muted-soft);
        }
        
        .empty-state-icon {
            font-size: 3rem;
            margin-bottom: 16px;
            opacity: 0.5;
        }
        
        @media (max-width: 768px) {
            .date-slots-grid {
                grid-template-columns: 1fr;
            }
            
            .date-heading {
                flex-direction: column;
                align-items: flex-start;
                gap: 6px;
            }
            
            .date-heading .date-subtitle {
                margin-left: 0;
            }
            
            .slot-card-actions {
                flex-direction: column;
            }
            
            .slot-card-actions .btn {
                width: 100%;
            }
        }
    </style>
</head>
<body class="admin-open">
    <?php include 'sidebar.php'; ?>

    <div class="main">
        <header class="topbar">
            <div class="title-block">
                <h1 class="page-title">Slots Management</h1>
            </div>
            <div class="duty-select-wrapper">
                <label for="duty_select">Duty:</label>
                <form method="get" style="display: inline-block;">
                    <select id="duty_select" name="duty" class="duty-select" onchange="this.form.submit()">
                        <?php foreach ($duties as $duty): ?>
                        <option value="<?= $duty['id'] ?>" <?= $selected_duty == $duty['id'] ? 'selected' : '' ?>>
                            <?= htmlspecialchars($duty['title']) ?> (<?= htmlspecialchars($duty['academicsession']) ?>)
                        </option>
                        <?php endforeach; ?>
                    </select>
                </form>
            </div>
        </header>

        <?php if ($message): ?>
        <div class="message <?= $message_type ?>">
            <?= htmlspecialchars($message) ?>
        </div>
        <?php endif; ?>

        <section class="content">
            <div class="duties-table">
                <div class="table-header">
                    <h2>All Slots</h2>
                    <div style="display: flex; gap: 10px;">
                        <button type="button" class="btn add-user-btn" onclick="openModal('addModal')">Add Slot</button>
                        <button type="button" class="btn add-user-btn" onclick="openModal('autoModal')">Auto-Generate</button>
                    </div>
                </div>
                
                <?php if (empty($slots)): ?>
                <div class="empty-state">
                    <div class="empty-state-icon">📅</div>
                    <p><strong>No slots yet</strong></p>
                    <p>Create your first slot to get started</p>
                </div>
                <?php else: ?>
                    <?php foreach ($slots_by_date as $date => $dateSlots): ?>
                    <div class="date-group">
                        <?php $formattedDate = date('F j, Y', strtotime($date)); ?>
                        <div class="date-heading">
                            <span class="date-label"><?= htmlspecialchars($formattedDate) ?></span>
                            <span class="date-subtitle"><?= htmlspecialchars($date) ?></span>
                        </div>
                        <div class="date-slots-grid">
                            <?php foreach ($dateSlots as $slot): 
                                $requirement = intval($slot['requirement']);
                                $applicants = intval($slot['applicants']);
                                $available = max(0, $requirement - $applicants);
                                $status = $available === 0 ? 'full' : ($available < $requirement / 2 ? 'partial' : 'available');
                                $statusText = $available === 0 ? 'Full' : ($available === 1 ? '1 left' : $available . ' left');
                            ?>
                            <div class="slot-card">
                                <div class="slot-card-header">
                                    <h3><?= htmlspecialchars($slot['slottext']) ?></h3>
                                    <span class="badge <?= $status ?>"><?= $statusText ?></span>
                                </div>
                                <p class="meta"><?= htmlspecialchars($slot['slottime']) ?></p>
                                <div class="stats">
                                    <div class="stat-item">
                                        <span class="stat-label">Applicants</span>
                                        <span class="stat-value"><?= $applicants ?></span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Requirement</span>
                                        <span class="stat-value"><?= $requirement ?></span>
                                    </div>
                                </div>
                                <div class="slot-card-actions">
                                    <a href="slot_applicants.php?slot=<?= $slot['id'] ?>&duty=<?= $selected_duty ?>" class="btn small view-btn">👁️ View</a>
                                    <button type="button" class="btn small edit-btn" onclick='editSlot(<?= json_encode([
                                        "id" => $slot["id"],
                                        "text" => $slot["slottext"],
                                        "time" => $slot["slottime"],
                                        "date" => $slot["slotdate"],
                                        "requirement" => $slot["requirement"]
                                    ]) ?>)'>✏️ Edit</button>
                                    <button type="button" class="btn small delete-btn" onclick="deleteSlot(<?= $slot['id'] ?>)">🗑️ Delete</button>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </section>
    </div>

    <!-- Add Modal -->
    <div id="addModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeModal('addModal')">&times;</span>
            <h2>Add New Slot</h2>
            <form method="post">
                <input type="hidden" name="add_slot" value="1">
                <input type="hidden" name="duty" value="<?= $selected_duty ?>">
                <div class="form-group">
                    <label>Slot Name:</label>
                    <input type="text" name="slottext" required>
                </div>
                <div class="form-group">
                    <label>Time:</label>
                    <input type="time" name="slottime" required>
                </div>
                <div class="form-group">
                    <label>Date:</label>
                    <input type="date" name="slotdate" required>
                </div>
                <div class="form-group">
                    <label>Requirement:</label>
                    <input type="number" name="requirement" min="0" required>
                </div>
                <button type="submit" class="btn">Add Slot</button>
            </form>
        </div>
    </div>

    <!-- Edit Modal -->
    <div id="editModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeModal('editModal')">&times;</span>
            <h2>Edit Slot</h2>
            <form method="post">
                <input type="hidden" name="update_slot" value="1">
                <input type="hidden" name="slot_id" id="edit_id">
                <input type="hidden" name="duty" value="<?= $selected_duty ?>">
                <div class="form-group">
                    <label>Slot Name:</label>
                    <input type="text" name="slottext" id="edit_text" required>
                </div>
                <div class="form-group">
                    <label>Time:</label>
                    <input type="time" name="slottime" id="edit_time" required>
                </div>
                <div class="form-group">
                    <label>Date:</label>
                    <input type="date" name="slotdate" id="edit_date" required>
                </div>
                <div class="form-group">
                    <label>Requirement:</label>
                    <input type="number" name="requirement" id="edit_requirement" min="0" required>
                </div>
                <button type="submit" class="btn">Update Slot</button>
            </form>
        </div>
    </div>

    <!-- Auto-Generate Modal -->
    <div id="autoModal" class="modal">
        <div class="modal-content" style="max-width: 600px;">
            <span class="close" onclick="closeModal('autoModal')">&times;</span>
            <h2>Auto-Generate Slots</h2>
            <form method="post">
                <input type="hidden" name="auto_generate_slots" value="1">
                <input type="hidden" name="duty" value="<?= $selected_duty ?>">
                <div class="form-group">
                    <label>Choose Dates</label>
                    <div class="auto-slot-date-row">
                        <input type="date" id="dateInput" style="flex: 1;">
                        <button type="button" class="btn" onclick="addDate()">Add Date</button>
                    </div>
                    <div class="date-pill-list" id="dateList"></div>
                </div>
                <div class="form-group">
                    <label>Slots per Day</label>
                    <input type="number" id="slotCount" min="1" max="10" value="1" onchange="updateSlotInputs()">
                </div>
                <div id="slotInputs"></div>
                <button type="submit" class="btn">Generate Slots</button>
            </form>
        </div>
    </div>

    <!-- Delete Form (hidden) -->
    <form method="post" id="deleteForm" style="display: none;">
        <input type="hidden" name="delete_slot" value="1">
        <input type="hidden" name="slot_id" id="delete_id">
        <input type="hidden" name="duty" value="<?= $selected_duty ?>">
    </form>

    <script src="../public/js/admin.js"></script>
    <script>
        let selectedDates = [];

        function openModal(id) {
            document.getElementById(id).style.display = 'block';
            if (id === 'autoModal') {
                selectedDates = [];
                updateDateList();
                updateSlotInputs();
            }
        }

        function closeModal(id) {
            document.getElementById(id).style.display = 'none';
        }

        function editSlot(data) {
            document.getElementById('edit_id').value = data.id;
            document.getElementById('edit_text').value = data.text;
            document.getElementById('edit_time').value = data.time;
            document.getElementById('edit_date').value = data.date;
            document.getElementById('edit_requirement').value = data.requirement;
            openModal('editModal');
        }

        function deleteSlot(id) {
            if (confirm('Are you sure you want to delete this slot?')) {
                document.getElementById('delete_id').value = id;
                document.getElementById('deleteForm').submit();
            }
        }

        function addDate() {
            const input = document.getElementById('dateInput');
            const date = input.value;
            if (date && !selectedDates.includes(date)) {
                selectedDates.push(date);
                input.value = '';
                updateDateList();
            }
        }

        function removeDate(date) {
            selectedDates = selectedDates.filter(d => d !== date);
            updateDateList();
        }

        function updateDateList() {
            const list = document.getElementById('dateList');
            list.innerHTML = selectedDates.map(date => `
                <div class="date-pill">
                    ${date}
                    <button type="button" onclick="removeDate('${date}')">×</button>
                    <input type="hidden" name="slot_dates[]" value="${date}">
                </div>
            `).join('');
        }

        function updateSlotInputs() {
            const count = parseInt(document.getElementById('slotCount').value) || 1;
            const container = document.getElementById('slotInputs');
            container.innerHTML = '';
            for (let i = 0; i < count; i++) {
                container.innerHTML += `
                    <div class="slot-detail-group">
                        <h4>Slot ${i + 1}</h4>
                        <div class="form-group">
                            <label>Name:</label>
                            <input type="text" name="slot_texts[]" required>
                        </div>
                        <div class="form-group">
                            <label>Time:</label>
                            <input type="time" name="slot_times[]" required>
                        </div>
                        <div class="form-group">
                            <label>Requirement:</label>
                            <input type="number" name="slot_requirements[]" min="0" required>
                        </div>
                    </div>
                `;
            }
        }

        // Close modal on outside click
        window.onclick = function(e) {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        }

        // Initialize
        updateSlotInputs();
    </script>
</body>
</html>
