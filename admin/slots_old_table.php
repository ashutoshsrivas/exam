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
$slots_query = "SELECT s.id, s.slottext, s.slottime, s.slotdate, s.requirement, (SELECT COUNT(*) FROM preferences p WHERE p.slotid = s.id) AS applicants FROM slot s WHERE s.duty = ? ORDER BY s.slotdate, s.slottime";

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
            padding: 0;
            line-height: 1;
        }
        .date-pill .pill-remove:hover {
            color: #dc3545;
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
                <form method="get" id="dutyForm" style="display: inline;">
                    <select id="duty_select" name="duty" class="duty-select">
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
                    <h2>Slot Management</h2>
                    <div style="display: flex; gap: 10px;">
                        <button type="button" class="btn add-user-btn" data-action="add">Add New Slot</button>
                        <button type="button" class="btn add-user-btn" data-action="auto-generate">Auto-generate Slots</button>
                    </div>
                </div>
                
                <?php if (empty($slots)): ?>
                <p style="padding: 20px; text-align: center; color: var(--muted);">No slots found for this duty. Create one to get started.</p>
                <?php else: ?>
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
                        <tr data-slot-id="<?= $slot['id'] ?>">
                            <td><?= htmlspecialchars($slot['id']) ?></td>
                            <td><?= htmlspecialchars($slot['slottext']) ?></td>
                            <td><?= htmlspecialchars($slot['slottime']) ?></td>
                            <td><?= htmlspecialchars($slot['slotdate']) ?></td>
                            <td><?= htmlspecialchars($slot['requirement']) ?></td>
                            <td><?= htmlspecialchars($slot['applicants']) ?></td>
                            <td>
                                <div class="actions">
                                    <a href="slot_applicants.php?slot=<?= urlencode($slot['id']) ?>&duty=<?= urlencode($selected_duty) ?>" 
                                       class="btn small view-btn" 
                                       title="View attendees">
                                        👁️ View
                                    </a>
                                    <button type="button" 
                                            class="btn small edit-btn" 
                                            data-action="edit"
                                            data-id="<?= htmlspecialchars($slot['id']) ?>"
                                            data-text="<?= htmlspecialchars($slot['slottext']) ?>"
                                            data-time="<?= htmlspecialchars($slot['slottime']) ?>"
                                            data-date="<?= htmlspecialchars($slot['slotdate']) ?>"
                                            data-requirement="<?= htmlspecialchars($slot['requirement']) ?>">
                                        ✏️ Edit
                                    </button>
                                    <button type="button" 
                                            class="btn small delete-btn" 
                                            data-action="delete"
                                            data-id="<?= htmlspecialchars($slot['id']) ?>">
                                        🗑️ Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                <?php endif; ?>
            </div>
        </section>
    </div>

    <!-- Add Slot Modal -->
    <div id="addSlotModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="addModalTitle">
        <div class="modal-content">
            <button type="button" class="close" data-close-modal aria-label="Close">&times;</button>
            <h2 id="addModalTitle">Add New Slot</h2>
            <form method="post" id="addSlotForm">
                <input type="hidden" name="add_slot" value="1">
                <input type="hidden" name="duty" value="<?= htmlspecialchars($selected_duty) ?>">
                <div class="form-group">
                    <label for="add_slottext">Slot Text:</label>
                    <input type="text" id="add_slottext" name="slottext" required autocomplete="off">
                </div>
                <div class="form-group">
                    <label for="add_slottime">Slot Time:</label>
                    <input type="time" id="add_slottime" name="slottime" required autocomplete="off">
                </div>
                <div class="form-group">
                    <label for="add_slotdate">Slot Date:</label>
                    <input type="date" id="add_slotdate" name="slotdate" required autocomplete="off">
                </div>
                <div class="form-group">
                    <label for="add_requirement">Requirement:</label>
                    <input type="number" id="add_requirement" name="requirement" min="0" required autocomplete="off">
                </div>
                <button type="submit" class="btn">Add Slot</button>
            </form>
        </div>
    </div>

    <!-- Edit Slot Modal -->
    <div id="editModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="editModalTitle">
        <div class="modal-content">
            <button type="button" class="close" data-close-modal aria-label="Close">&times;</button>
            <h2 id="editModalTitle">Edit Slot</h2>
            <form method="post" id="editSlotForm">
                <input type="hidden" name="update_slot" value="1">
                <input type="hidden" id="edit_slot_id" name="slot_id">
                <input type="hidden" name="duty" value="<?= htmlspecialchars($selected_duty) ?>">
                <div class="form-group">
                    <label for="edit_slottext">Slot Text:</label>
                    <input type="text" id="edit_slottext" name="slottext" required autocomplete="off">
                </div>
                <div class="form-group">
                    <label for="edit_slottime">Slot Time:</label>
                    <input type="time" id="edit_slottime" name="slottime" required autocomplete="off">
                </div>
                <div class="form-group">
                    <label for="edit_slotdate">Slot Date:</label>
                    <input type="date" id="edit_slotdate" name="slotdate" required autocomplete="off">
                </div>
                <div class="form-group">
                    <label for="edit_requirement">Requirement:</label>
                    <input type="number" id="edit_requirement" name="requirement" min="0" required autocomplete="off">
                </div>
                <button type="submit" class="btn">Update Slot</button>
            </form>
        </div>
    </div>

    <!-- Auto-generate Slots Modal -->
    <div id="autoGenerateModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="autoModalTitle">
        <div class="modal-content">
            <button type="button" class="close" data-close-modal aria-label="Close">&times;</button>
            <h2 id="autoModalTitle">Auto-generate Slots</h2>
            <form method="post" id="autoGenerateForm">
                <input type="hidden" name="auto_generate_slots" value="1">
                <input type="hidden" name="duty" value="<?= htmlspecialchars($selected_duty ?? '') ?>">
                <div class="form-group">
                    <label for="autoSlotDate">Choose Dates</label>
                    <div class="auto-slot-date-row">
                        <input type="date" id="autoSlotDate" autocomplete="off">
                        <button type="button" class="btn" data-action="add-date">Add Date</button>
                    </div>
                    <div class="date-pill-list" id="selected_dates_list" role="list"></div>
                </div>
                <div class="form-group">
                    <label for="autoSlotCount">Slots per Day</label>
                    <input type="number" id="autoSlotCount" name="slot_count" min="1" max="20" value="1" autocomplete="off">
                </div>
                <div id="slotDetailsContainer"></div>
                <button type="submit" class="btn">Generate Slots</button>
            </form>
        </div>
    </div>

    <!-- Delete Confirmation Form (hidden) -->
    <form method="post" id="deleteForm" style="display: none;">
        <input type="hidden" name="delete_slot" value="1">
        <input type="hidden" name="slot_id" id="delete_slot_id">
        <input type="hidden" name="duty" value="<?= htmlspecialchars($selected_duty) ?>">
    </form>

    <script src="../public/js/admin.js?v=2"></script>
    <script>
        // Slots Page Script v2.0 - Cache Bust
        (function() {
            'use strict';

            // State
            let autoSlotDates = [];
            let currentModal = null;

            // Modal Management
            const ModalManager = {
                open(modalId) {
                    const modal = document.getElementById(modalId);
                    if (!modal) return;
                    modal.style.display = 'block';
                    currentModal = modal;
                },

                close(modal) {
                    if (modal) {
                        modal.style.display = 'none';
                        if (currentModal === modal) {
                            currentModal = null;
                        }
                    }
                },

                closeAll() {
                    document.querySelectorAll('.modal').forEach(modal => {
                        modal.style.display = 'none';
                    });
                    currentModal = null;
                }
            };

            // Duty Selection Handler
            const dutySelect = document.getElementById('duty_select');
            if (dutySelect) {
                dutySelect.addEventListener('change', function(e) {
                    e.preventDefault();
                    this.form.submit();
                });
            }

            // Event Delegation for Action Buttons
            document.addEventListener('click', function(e) {
                const target = e.target.closest('[data-action]');
                if (!target) return;

                e.preventDefault();
                e.stopPropagation();

                const action = target.dataset.action;

                switch(action) {
                    case 'add':
                        const addForm = document.getElementById('addSlotForm');
                        if (addForm) addForm.reset();
                        ModalManager.open('addSlotModal');
                        break;

                    case 'edit':
                        const id = target.dataset.id;
                        const text = target.dataset.text;
                        const time = target.dataset.time;
                        const date = target.dataset.date;
                        const requirement = target.dataset.requirement;
                        
                        document.getElementById('edit_slot_id').value = id || '';
                        document.getElementById('edit_slottext').value = text || '';
                        document.getElementById('edit_slottime').value = time || '';
                        document.getElementById('edit_slotdate').value = date || '';
                        document.getElementById('edit_requirement').value = requirement || '';
                        
                        ModalManager.open('editModal');
                        break;

                    case 'delete':
                        const slotId = target.dataset.id;
                        if (slotId && confirm('Are you sure you want to delete this slot?')) {
                            document.getElementById('delete_slot_id').value = slotId;
                            document.getElementById('deleteForm').submit();
                        }
                        break;

                    case 'auto-generate':
                        autoSlotDates = [];
                        renderAutoDates();
                        const countInput = document.getElementById('autoSlotCount');
                        const dateInput = document.getElementById('autoSlotDate');
                        if (countInput) countInput.value = 1;
                        if (dateInput) dateInput.value = '';
                        renderSlotDetailGroups();
                        ModalManager.open('autoGenerateModal');
                        break;

                    case 'add-date':
                        addAutoDate();
                        break;
                }
            }, true); // Use capture phase

            // Close Modal Buttons
            document.querySelectorAll('[data-close-modal]').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const modal = this.closest('.modal');
                    ModalManager.close(modal);
                }, true);
            });

            // Click Outside to Close
            window.addEventListener('click', function(e) {
                if (e.target.classList.contains('modal')) {
                    e.preventDefault();
                    ModalManager.close(e.target);
                }
            });

            // Escape Key to Close
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && currentModal) {
                    e.preventDefault();
                    ModalManager.close(currentModal);
                }
            });

            // Auto-generate Slot Functions
            function addAutoDate() {
                const input = document.getElementById('autoSlotDate');
                if (!input || !input.value) return;
                
                const value = input.value;
                if (autoSlotDates.includes(value)) {
                    alert('This date has already been added.');
                    return;
                }
                
                autoSlotDates.push(value);
                input.value = '';
                renderAutoDates();
            }

            function removeAutoDate(date) {
                autoSlotDates = autoSlotDates.filter(d => d !== date);
                renderAutoDates();
            }

            function renderAutoDates() {
                const list = document.getElementById('selected_dates_list');
                if (!list) return;
                
                list.innerHTML = '';
                
                autoSlotDates.forEach(date => {
                    const pill = document.createElement('span');
                    pill.className = 'date-pill';
                    pill.textContent = date + ' ';
                    
                    const removeBtn = document.createElement('button');
                    removeBtn.type = 'button';
                    removeBtn.className = 'pill-remove';
                    removeBtn.setAttribute('aria-label', 'Remove ' + date);
                    removeBtn.textContent = '×';
                    removeBtn.onclick = function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        removeAutoDate(date);
                    };
                    
                    pill.appendChild(removeBtn);
                    list.appendChild(pill);

                    // Hidden input for form submission
                    const hiddenInput = document.createElement('input');
                    hiddenInput.type = 'hidden';
                    hiddenInput.name = 'slot_dates[]';
                    hiddenInput.value = date;
                    list.appendChild(hiddenInput);
                });
            }

            function renderSlotDetailGroups() {
                const container = document.getElementById('slotDetailsContainer');
                const countInput = document.getElementById('autoSlotCount');
                if (!container || !countInput) return;
                
                let count = parseInt(countInput.value, 10);
                if (isNaN(count) || count < 1) count = 1;
                if (count > 20) count = 20;
                countInput.value = count;
                
                container.innerHTML = '';
                
                for (let i = 0; i < count; i++) {
                    const group = document.createElement('div');
                    group.className = 'slot-detail-group';
                    group.innerHTML = `
                        <div class="form-group">
                            <label>Slot ${i + 1} Name:</label>
                            <input type="text" name="slot_texts[]" required autocomplete="off">
                        </div>
                        <div class="form-group">
                            <label>Slot ${i + 1} Time:</label>
                            <input type="time" name="slot_times[]" required autocomplete="off">
                        </div>
                        <div class="form-group">
                            <label>Slot ${i + 1} Requirement:</label>
                            <input type="number" min="0" name="slot_requirements[]" required autocomplete="off">
                        </div>
                    `;
                    container.appendChild(group);
                }
            }

            // Auto Slot Count Change
            const autoSlotCountInput = document.getElementById('autoSlotCount');
            if (autoSlotCountInput) {
                autoSlotCountInput.addEventListener('input', function(e) {
                    renderSlotDetailGroups();
                });
            }

            // Initialize
            renderSlotDetailGroups();
        })();
    </script>
</body>
</html>
