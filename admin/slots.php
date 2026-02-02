<?php
session_start();
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || strtolower($_SESSION['role']) !== 'admin') {
    header('Location: ../login.php');
    exit;
}

require_once '../lib/conn.php';

// Fetch duties for dropdown, sorted by newest first
$duties_query = "SELECT id, title, academicsession, type, createdat FROM duties ORDER BY createdat DESC";
$duties_result = $conn->query($duties_query);
$duties = [];
if ($duties_result) {
    while ($row = $duties_result->fetch_assoc()) {
        $duties[] = $row;
    }
}

// Get selected duty from GET or POST
$selected_duty = null;
if (isset($_REQUEST['duty']) && $_REQUEST['duty'] !== '') {
    $selected_duty = intval($_REQUEST['duty']);
} elseif (isset($duties[0]['id'])) {
    $selected_duty = $duties[0]['id'];
}

// Fetch slots for selected duty
// Build slots query with applicant counts so refreshes can reuse it
$slots_query = "SELECT s.id, s.slottext, s.slottime, s.slotdate, s.requirement, (SELECT COUNT(*) FROM preferences p WHERE p.slotid = s.id) AS applicants FROM slot s WHERE s.duty = ? ORDER BY s.id";

function fetchSlotsForDuty($conn, $query, $dutyId)
{
    $slots = [];
    if (!$dutyId) {
        return $slots;
    }
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

$message = '';
$message_type = '';

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
        $message = 'Start by adding at least one date for the generation.';
        $message_type = 'error';
    } elseif ($slot_count === 0 || count($slot_times) !== $slot_count || count($slot_requirements) !== $slot_count) {
        $message = 'Provide slot text, time, and requirement for every slot per day.';
        $message_type = 'error';
    } else {
        for ($i = 0; $i < $slot_count; $i++) {
            $text = trim($slot_texts[$i]);
            $time = trim($slot_times[$i]);
            $reqInput = trim($slot_requirements[$i]);
            if ($text === '' || $time === '' || $reqInput === '') {
                $message = 'Slot name, time, and requirement are required for each entry.';
                $message_type = 'error';
                break;
            }
            if (!is_numeric($reqInput)) {
                $message = 'Requirement must be a valid number.';
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

    if (empty($slot_templates) && $message_type === '') {
        $message = 'No slot definitions were provided.';
        $message_type = 'error';
    }

    if ($message_type !== 'error') {
        if (!$selected_duty) {
            $message = 'Select a duty before generating slots.';
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
                $message = 'Error generating slots. Please try again.';
                $message_type = 'error';
            } else {
                $message = sprintf('Generated %d slots across %d dates.', $generated, count($dates));
                $message_type = 'success';
                $slots = fetchSlotsForDuty($conn, $slots_query, $selected_duty);
            }
        }
    }
}
$username = htmlspecialchars($_SESSION['username']);
$active_page = 'slots';

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
        } else {
            $message = 'Error updating slot.';
            $message_type = 'error';
        }
        $stmt->close();
    }
}
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
        .duty-select {
            padding: 8px 12px;
            border: 1px solid rgba(0,0,0,0.1);
            border-radius: 8px;
            background: rgba(255,255,255,0.8);
            color: #333;
            font-size: 14px;
            min-width: 200px;
        }
        .duty-select:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 2px rgba(0,123,255,0.2);
        }
        .topbar-controls {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .topbar-controls label {
            font-weight: 500;
            color: #333;
        }
        .auto-slot-date-row {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        .date-pill-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
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
        .date-pill .pill-remove {
            background: transparent;
            border: none;
            color: inherit;
            font-weight: bold;
            cursor: pointer;
        }
        #selected_dates_inputs {
            display: none;
        }
        .slot-detail-group {
            padding: 12px;
            border-radius: 12px;
            border: 1px solid rgba(0, 0, 0, 0.08);
            background: rgba(255, 255, 255, 0.6);
            margin-bottom: 16px;
        }
    </style>
</head>
<body class="admin-open">
    <?php include 'sidebar.php'; ?>

    <div class="main">
        <header class="topbar">
            <h1 class="page-title">Slots</h1>
            <div class="topbar-controls">
                <label for="duty_select">Select Duty:</label>
                <select id="duty_select" onchange="changeDuty()" class="duty-select">
                    <?php foreach ($duties as $duty): ?>
                    <option value="<?= $duty['id'] ?>" <?= $selected_duty == $duty['id'] ? 'selected' : '' ?>>
                        <?= htmlspecialchars($duty['title']) ?> (<?= htmlspecialchars($duty['academicsession']) ?>)
                    </option>
                    <?php endforeach; ?>
                </select>
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
                    <h2>Slot Management</h2>
                    <button type="button" class="btn add-user-btn" onclick="openAddModal()">Add New Slot</button>
                    <button type="button" class="btn add-user-btn" onclick="openAutoGenerateModal()">Auto-generate Slots</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Slot Text</th>
                            <th>Slot Time</th>
                            <th>Slot Date</th>
                            <th>Requirement</th>
                            <th>Applicants</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($slots as $slot): ?>
                        <tr>
                            <td><?= htmlspecialchars($slot['id']) ?></td>
                            <td><?= htmlspecialchars($slot['slottext']) ?></td>
                            <td><?= htmlspecialchars($slot['slottime']) ?></td>
                            <td><?= htmlspecialchars($slot['slotdate']) ?></td>
                            <td><?= htmlspecialchars($slot['requirement']) ?></td>
                            <td><?= htmlspecialchars($slot['applicants']) ?></td>
                            <td>
                                <div class="actions">
                                    <form method="get" action="slot_applicants.php" class="view-form" style="display:inline;">
                                        <input type="hidden" name="slot" value="<?= $slot['id'] ?>">
                                        <input type="hidden" name="duty" value="<?= $selected_duty ?>">
                                        <button type="submit" class="btn small view-btn" title="View attendees">
                                            
                                            View Applicants
                                        </button>
                                    </form>
                                    <button class="btn small edit-btn" onclick="openEditModal(<?= $slot['id'] ?>, '<?= addslashes(htmlspecialchars($slot['slottext'])) ?>', '<?= addslashes(htmlspecialchars($slot['slottime'])) ?>', '<?= addslashes(htmlspecialchars($slot['slotdate'])) ?>', <?= $slot['requirement'] ?>)" title="Edit Slot">
                                        ✏️ Edit
                                    </button>
                                    <form method="post" style="display:inline;" onsubmit="return confirm('Are you sure you want to delete this slot?')">
                                        <input type="hidden" name="delete_slot" value="1">
                                        <input type="hidden" name="slot_id" value="<?= $slot['id'] ?>">
                                        <button type="submit" class="btn small delete-btn" title="Delete Slot">
                                            🗑️ Delete
                                        </button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </section>
    </div>

    <!-- Add Slot Modal -->
    <div id="addSlotModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeAddModal()">&times;</span>
            <h2>Add New Slot</h2>
            <form method="post">
                <input type="hidden" name="add_slot" value="1">
                <div class="form-group">
                    <label for="slottext">Slot Text:</label>
                    <input type="text" id="slottext" name="slottext" required>
                </div>
                <div class="form-group">
                    <label for="slottime">Slot Time:</label>
                    <input type="time" id="slottime" name="slottime" required>
                </div>
                <div class="form-group">
                    <label for="slotdate">Slot Date:</label>
                    <input type="date" id="slotdate" name="slotdate" required>
                </div>
                <div class="form-group">
                    <label for="requirement">Requirement:</label>
                    <input type="number" id="requirement" name="requirement" min="0" required>
                </div>
                <button type="submit" class="btn">Add Slot</button>
            </form>
        </div>
    </div>

    <!-- Edit Slot Modal -->
    <div id="editModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeEditModal()">&times;</span>
            <h2>Edit Slot</h2>
            <form method="post">
                <input type="hidden" name="update_slot" value="1">
                <input type="hidden" id="edit_slot_id" name="slot_id">
                <div class="form-group">
                    <label for="edit_slottext">Slot Text:</label>
                    <input type="text" id="edit_slottext" name="slottext" required>
                </div>
                <div class="form-group">
                    <label for="edit_slottime">Slot Time:</label>
                    <input type="time" id="edit_slottime" name="slottime" required>
                </div>
                <div class="form-group">
                    <label for="edit_slotdate">Slot Date:</label>
                    <input type="date" id="edit_slotdate" name="slotdate" required>
                </div>
                <div class="form-group">
                    <label for="edit_requirement">Requirement:</label>
                    <input type="number" id="edit_requirement" name="requirement" min="0" required>
                </div>
                <button type="submit" class="btn">Update Slot</button>
            </form>
        </div>
    </div>

    <!-- Auto-generate Slots Modal -->
    <div id="autoGenerateModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeAutoGenerateModal()">&times;</span>
            <h2>Auto-generate Slots</h2>
            <form method="post">
                <input type="hidden" name="auto_generate_slots" value="1">
                <input type="hidden" name="duty" value="<?= htmlspecialchars($selected_duty ?? '') ?>">
                <div class="form-group">
                    <label for="autoSlotDate">Choose Dates</label>
                    <div class="auto-slot-date-row">
                        <input type="date" id="autoSlotDate">
                        <button type="button" class="btn" onclick="addAutoDate()">Add Date</button>
                    </div>
                    <div class="date-pill-list" id="selected_dates_list"></div>
                    <div id="selected_dates_inputs"></div>
                </div>
                <div class="form-group">
                    <label for="autoSlotCount">Slots per Day</label>
                    <input type="number" id="autoSlotCount" name="slot_count" min="1" value="1">
                </div>
                <div id="slotDetailsContainer"></div>
                <button type="submit" class="btn">Generate Slots</button>
            </form>
        </div>
    </div>

    <script src="../public/js/admin.js"></script>
    <script>
        function changeDuty() {
            const dutyId = document.getElementById('duty_select').value;
            window.location.href = '?duty=' + dutyId;
        }

        function openAddModal() {
            document.getElementById('addSlotModal').style.display = 'block';
        }

        function closeAddModal() {
            document.getElementById('addSlotModal').style.display = 'none';
        }

        function openEditModal(id, slottext, slottime, slotdate, requirement) {
            document.getElementById('edit_slot_id').value = id;
            document.getElementById('edit_slottext').value = slottext;
            document.getElementById('edit_slottime').value = slottime;
            document.getElementById('edit_slotdate').value = slotdate;
            document.getElementById('edit_requirement').value = requirement;
            document.getElementById('editModal').style.display = 'block';
        }

        function closeEditModal() {
            document.getElementById('editModal').style.display = 'none';
        }

        let autoSlotDates = [];

        function openAutoGenerateModal() {
            resetAutoGenerateForm();
            document.getElementById('autoGenerateModal').style.display = 'block';
        }

        function closeAutoGenerateModal() {
            document.getElementById('autoGenerateModal').style.display = 'none';
        }

        function addAutoDate() {
            const input = document.getElementById('autoSlotDate');
            if (!input) {
                return;
            }
            const value = input.value;
            if (!value || autoSlotDates.includes(value)) {
                input.value = '';
                return;
            }
            autoSlotDates.push(value);
            input.value = '';
            renderAutoDates();
        }

        function removeAutoDate(date) {
            autoSlotDates = autoSlotDates.filter((item) => item !== date);
            renderAutoDates();
        }

        function renderAutoDates() {
            const list = document.getElementById('selected_dates_list');
            const hiddenInputs = document.getElementById('selected_dates_inputs');
            if (!list || !hiddenInputs) {
                return;
            }
            list.innerHTML = '';
            hiddenInputs.innerHTML = '';
            autoSlotDates.forEach((date) => {
                const pill = document.createElement('span');
                pill.className = 'date-pill';
                const textNode = document.createTextNode(date);
                pill.appendChild(textNode);
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'pill-remove';
                removeBtn.setAttribute('aria-label', 'Remove date');
                removeBtn.textContent = '×';
                removeBtn.addEventListener('click', () => removeAutoDate(date));
                pill.appendChild(removeBtn);
                list.appendChild(pill);

                const hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.name = 'slot_dates[]';
                hiddenInput.value = date;
                hiddenInputs.appendChild(hiddenInput);
            });
        }

        function renderSlotDetailGroups() {
            const container = document.getElementById('slotDetailsContainer');
            const countInput = document.getElementById('autoSlotCount');
            if (!container || !countInput) {
                return;
            }
            let requestedCount = parseInt(countInput.value, 10);
            if (Number.isNaN(requestedCount) || requestedCount < 1) {
                requestedCount = 1;
            }
            countInput.value = requestedCount;
            while (container.children.length > requestedCount) {
                container.removeChild(container.lastElementChild);
            }
            while (container.children.length < requestedCount) {
                const group = document.createElement('div');
                group.className = 'slot-detail-group';
                group.innerHTML = `
                    <div class="form-group">
                        <label>Slot Name:</label>
                        <input type="text" name="slot_texts[]" required>
                    </div>
                    <div class="form-group">
                        <label>Slot Time:</label>
                        <input type="time" name="slot_times[]" required>
                    </div>
                    <div class="form-group">
                        <label>Requirement:</label>
                        <input type="number" min="0" name="slot_requirements[]" required>
                    </div>
                `;
                container.appendChild(group);
            }
        }

        function resetAutoGenerateForm() {
            autoSlotDates = [];
            renderAutoDates();
            const countInput = document.getElementById('autoSlotCount');
            if (countInput) {
                countInput.value = 1;
            }
            const dateInput = document.getElementById('autoSlotDate');
            if (dateInput) {
                dateInput.value = '';
            }
            const detailContainer = document.getElementById('slotDetailsContainer');
            if (detailContainer) {
                detailContainer.innerHTML = '';
            }
            renderSlotDetailGroups();
        }

        const autoSlotCountField = document.getElementById('autoSlotCount');
        if (autoSlotCountField) {
            autoSlotCountField.addEventListener('input', renderSlotDetailGroups);
        }
        renderSlotDetailGroups();

        // Close modal when clicking outside
        window.onclick = function(event) {
            var addSlotModal = document.getElementById('addSlotModal');
            var editModal = document.getElementById('editModal');
            var autoModal = document.getElementById('autoGenerateModal');
            if (event.target == addSlotModal) {
                addSlotModal.style.display = 'none';
            }
            if (event.target == editModal) {
                editModal.style.display = 'none';
            }
            if (event.target == autoModal) {
                autoModal.style.display = 'none';
            }
        }
    </script>
</body>
</html>