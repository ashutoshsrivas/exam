<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: ../login.php');
    exit;
}
require_once __DIR__ . '/../lib/conn.php';

$username = isset($_SESSION['username']) ? htmlspecialchars($_SESSION['username']) : 'User';
$user_role = isset($_SESSION['role']) ? trim($_SESSION['role']) : 'Research Scholar';
$active_page = 'slots';
$user_id = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : 0;

if ($user_id > 0) {
    if ($roleStmt = $conn->prepare('SELECT role FROM users WHERE id = ? LIMIT 1')) {
        $roleStmt->bind_param('i', $user_id);
        $roleStmt->execute();
        $roleResult = $roleStmt->get_result();
        $roleRow = $roleResult->fetch_assoc();
        if (!empty($roleRow['role'])) {
            $user_role = trim($roleRow['role']);
            $_SESSION['role'] = $user_role;
        }
        $roleStmt->close();
    }
}

$duty_id = isset($_GET['duty']) ? intval($_GET['duty']) : 0;
if (!$duty_id) {
    header('Location: dashboard.php');
    exit;
}

// Fetch duty info (include limit columns)
$stmt = $conn->prepare("SELECT title, academicsession, type, professor, assistantprofessor, associateprofessor, researchscholar FROM duties WHERE id = ?");
$stmt->bind_param("i", $duty_id);
$stmt->execute();
$duty = $stmt->get_result()->fetch_assoc();
if (!$duty) {
    header('Location: dashboard.php');
    exit;
}

$roleLimitColumn = [
    'Professor' => 'professor',
    'Assistant Professor' => 'assistantprofessor',
    'Associate Professor' => 'associateprofessor',
    'Research Scholar' => 'researchscholar',
];
$normalizedRole = ucwords(strtolower($user_role));
$limitColumn = $roleLimitColumn[$user_role] ?? $roleLimitColumn[$normalizedRole] ?? 'researchscholar';
$roleLimit = intval($duty[$limitColumn] ?? 0);

// Fetch slots for this duty
$stmt = $conn->prepare("SELECT id, slottext, slottime, slotdate, requirement FROM slot WHERE duty = ? ORDER BY slotdate, slottime");
$stmt->bind_param("i", $duty_id);
$stmt->execute();
$slots = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$slotMap = [];
foreach ($slots as $slot) {
    $slotMap[intval($slot['id'])] = $slot;
}

$slots_by_date = [];
foreach ($slots as $slot) {
    $slots_by_date[$slot['slotdate']][] = $slot;
}

$slotIdsForDuty = array_column($slots, 'id');
$slotAvailability = array_fill_keys($slotIdsForDuty, 0);
if (!empty($slotIdsForDuty)) {
    $quotedIds = implode(',', array_map('intval', $slotIdsForDuty));
    $availStmt = $conn->prepare("SELECT slotid, COUNT(*) AS taken FROM preferences WHERE slotid IN ({$quotedIds}) GROUP BY slotid");
    if ($availStmt) {
        $availStmt->execute();
        $availResult = $availStmt->get_result();
        while ($row = $availResult->fetch_assoc()) {
            $slotId = intval($row['slotid']);
            $slotAvailability[$slotId] = intval($row['taken']);
        }
        $availStmt->close();
    }
}

// Determine user info and role-based limit before handling form submissions
$statusMessage = '';
$errorMessage = '';
$existingPreferences = [];
$prefStmt = $conn->prepare("SELECT p.slotid FROM preferences p JOIN slot s ON p.slotid = s.id WHERE p.userid = ? AND s.duty = ?");
if ($prefStmt) {
    $prefStmt->bind_param('ii', $user_id, $duty_id);
    $prefStmt->execute();
    $prefResult = $prefStmt->get_result();
    while ($row = $prefResult->fetch_assoc()) {
        $existingPreferences[] = intval($row['slotid']);
    }
    $prefStmt->close();
}

$preferencesLocked = count($existingPreferences) > 0;
$savedSlotIds = $existingPreferences;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($preferencesLocked) {
        $errorMessage = 'Preferences cannot be changed once saved.';
    } else {
        $incoming = isset($_POST['slot_ids']) && is_array($_POST['slot_ids']) ? $_POST['slot_ids'] : [];
        $normalized = array_values(array_unique(array_map('intval', $incoming)));
        $validSelections = array_values(array_intersect($normalized, $slotIdsForDuty));
        $selectionCount = count($validSelections);
        if ($roleLimit > 0 && $selectionCount !== $roleLimit) {
            $errorMessage = 'Please select exactly ' . $roleLimit . ' slot(s) before saving.';
        } elseif ($roleLimit === 0 && $selectionCount > 0) {
            $errorMessage = 'You are not allowed to select slots for this duty.';
        }
        if ($errorMessage === '') {
            $deleteStmt = $conn->prepare("DELETE p FROM preferences p JOIN slot s ON p.slotid = s.id WHERE p.userid = ? AND s.duty = ?");
            $deleteStmt->bind_param('ii', $user_id, $duty_id);
            $deleteStmt->execute();
            $deleteStmt->close();

            if ($selectionCount > 0) {
                $insertStmt = $conn->prepare("INSERT INTO preferences (slotid, userid) VALUES (?, ?)");
                foreach ($validSelections as $slotId) {
                    $insertStmt->bind_param('ii', $slotId, $user_id);
                    $insertStmt->execute();
                }
                $insertStmt->close();
            }

            header("Location: slots.php?duty={$duty_id}&status=saved");
            exit;
        }
        $savedSlotIds = $validSelections;
    }
} elseif (isset($_GET['status']) && $_GET['status'] === 'saved') {
    $statusMessage = 'Preferences saved for this duty.';
    $preferencesLocked = true;
}

$checkedSlotIds = $_SERVER['REQUEST_METHOD'] === 'POST' ? $savedSlotIds : $existingPreferences;
$highlightedSlots = [];
foreach ($checkedSlotIds as $slotId) {
    if (isset($slotMap[$slotId])) {
        $highlightedSlots[] = $slotMap[$slotId];
    }
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Slots for <?= htmlspecialchars($duty['title']) ?></title>
    <link rel="stylesheet" href="../public/style/styles.css">
    <link rel="stylesheet" href="../public/style/user.css">
    <link rel="stylesheet" href="../public/style/admin.css">
    <style>
        .date-group { margin-bottom: 28px; }
        .date-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; font-size: 1rem; font-weight: 600; color: rgba(0,0,0,0.75); margin-bottom: 12px; }
        .date-heading .date-label { color: #0d6efd; font-size: 1.05rem; }
        .date-heading .date-subtitle { font-size: 0.85rem; color: rgba(0,0,0,0.45); }
        .date-slots-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; }
        .date-slots-grid .card {
            padding: 10px;
            cursor: pointer;
            border: 1px solid rgba(0, 0, 0, 0.05);
            transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
            position: relative;
        }
        .date-slots-grid .card.selected {
            border-color: #0d6efd;
            background: linear-gradient(180deg, rgba(13, 110, 253, 0.12), rgba(13, 110, 253, 0.02));
            box-shadow: 0 20px 35px rgba(13, 110, 253, 0.15);
        }
        .date-slots-grid .card:hover {
            transform: translateY(-2px);
        }
        .date-slots-grid .card h3 {
            margin-bottom: 4px;
            font-size: 1.05rem;
        }
        .slot-availability {
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 0.75rem;
            color: rgba(0, 0, 0, 0.55);
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }
        .slot-checkbox {
            position: absolute;
            opacity: 0;
            pointer-events: none;
        }
    </style>

</head>
<body class="user-open">
<?php include __DIR__ . '/sidebar.php'; ?>
<div class="main">
    <header class="topbar">
        <h1 class="page-title">Slots for: <?= htmlspecialchars($duty['title']) ?></h1>
        <div class="top-actions">
            <a href="dashboard.php" class="btn small">Back to Dashboard</a>
        </div>
    </header>
    <section class="content">
        <div class="duties-table">
            <form method="post" class="slots-form">
                <div class="table-header">
                    <h2>Available Slots</h2>
                    <div class="meta" style="margin-top:2px; color:rgba(0,0,0,0.6); font-size:0.98em;">
                        <?= htmlspecialchars($duty['academicsession']) ?> &mdash; <?= htmlspecialchars($duty['type']) ?>
                    </div>
                </div>
                <div class="progress-panel" data-limit="<?= $roleLimit ?>" data-locked="<?= $preferencesLocked ? '1' : '0' ?>">
                    <div class="progress-labels">
                        <span>Your limit</span>
                        <span><strong id="progressValue">0</strong>/<?= $roleLimit ?></span>
                    </div>
                    <div class="progress-bar"><span class="progress-fill" id="progressFill" style="width:0%"></span></div>
                    <div class="button-wrapper">
                        <button type="submit" id="savePreferences" class="btn small primary" disabled>Save Preference</button>
                        <span class="button-overlay" id="buttonOverlay" aria-hidden="true"></span>
                    </div>
                </div>
                <?php if ($highlightedSlots): ?>
                    <div class="status info saved-slots-summary">
                        <strong>You selected this duty:</strong>
                        <ul class="saved-slots-list">
                            <?php foreach ($highlightedSlots as $savedSlot): ?>
                                <li>
                                    <span><?= htmlspecialchars($savedSlot['slottext']) ?></span>
                                    <small><?= htmlspecialchars($savedSlot['slotdate']) ?> at <?= htmlspecialchars($savedSlot['slottime']) ?></small>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endif; ?>
                <?php if ($statusMessage): ?>
                    <div class="status success"><?= htmlspecialchars($statusMessage) ?></div>
                <?php endif; ?>
                <?php if ($errorMessage): ?>
                    <div class="status error"><?= htmlspecialchars($errorMessage) ?></div>
                <?php endif; ?>
                <div id="selectionHint" class="status info" hidden></div>
                <div class="duties-cards">
                    <?php if (count($slots) === 0): ?>
                        <div class="card empty">No slots available for this duty.</div>
                    <?php else: foreach ($slots_by_date as $slot_date => $dateSlots): ?>
                        <div class="date-group">
                            <?php $formattedDate = $slot_date ? date('F j, Y', strtotime($slot_date)) : ''; ?>
                            <div class="date-heading">
                                <span class="date-label"><?= htmlspecialchars($formattedDate ?: $slot_date) ?></span>
                                <span class="date-subtitle"><?= htmlspecialchars($slot_date) ?></span>
                            </div>
                            <div class="date-slots-grid">
                                <?php foreach ($dateSlots as $slot):
                                    $totalRequired = intval($slot['requirement']);
                                    $taken = $slotAvailability[$slot['id']] ?? 0;
                                    $available = max(0, $totalRequired - $taken);
                                    $slotSelected = in_array($slot['id'], $checkedSlotIds, true);
                                    $slotDisabled = $preferencesLocked || ($available === 0 && !$slotSelected);
                                    $availableText = $available === 0 ? 'Full' : $available . ' left';
                                ?>
                                    <div class="card" data-requirement="<?= intval($slot['requirement']) ?>">
                                        <span class="slot-availability"><?= htmlspecialchars($availableText) ?></span>
                                        <h3><?= htmlspecialchars($slot['slottext']) ?></h3>
                                        <p class="meta">Time: <?= htmlspecialchars($slot['slottime']) ?></p>
                                        <input type="checkbox" name="slot_ids[]" value="<?= $slot['id'] ?>" class="slot-checkbox" data-requirement="<?= intval($slot['requirement']) ?>" <?= $slotSelected ? 'checked' : '' ?> <?= $slotDisabled ? 'disabled' : '' ?>>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    <?php endforeach; endif; ?>
                </div>
            </form>
        </div>
    </section>
</div>
<script>
document.addEventListener('DOMContentLoaded', function() {
    var panel = document.querySelector('.progress-panel');
    if (!panel) return;
    var limit = Number(panel.dataset.limit) || 0;
    var locked = panel.dataset.locked === '1';
    var checkboxes = document.querySelectorAll('.slot-checkbox');
    var fill = document.getElementById('progressFill');
    var valueNode = document.getElementById('progressValue');
    var button = document.getElementById('savePreferences');
    var overlay = document.getElementById('buttonOverlay');
    var selectionHint = document.getElementById('selectionHint');
    var hintTimeout;

    var showSelectionHint = function(isLocked) {
        if (!selectionHint) return;
        var message = isLocked ? 'Preferences have been saved and cannot be changed.' : (limit > 0 ? 'Select at least ' + limit + ' slot(s) before saving.' : 'Choose the required slots to enable saving.');
        selectionHint.textContent = message;
        selectionHint.hidden = false;
        if (hintTimeout) {
            clearTimeout(hintTimeout);
        }
        hintTimeout = setTimeout(function() {
            selectionHint.hidden = true;
        }, 3600);
    };

    if (overlay) {
        overlay.addEventListener('click', function(e) {
            e.preventDefault();
            showSelectionHint(locked);
        });
    }

    var syncCardSelected = function() {
        checkboxes.forEach(function(cb) {
            var card = cb.closest('.card');
            if (!card) return;
            card.classList.toggle('selected', cb.checked && !cb.disabled);
        });
    };

    var updateProgress = function() {
        var total = 0;
        checkboxes.forEach(function(cb) {
            if (cb.checked) {
                total += 1;
            }
        });
        var percent = limit ? Math.min(100, (total / limit) * 100) : 100;
        if (fill) {
            fill.style.width = percent + '%';
        }
        if (valueNode) {
            valueNode.textContent = total;
        }
        if (button) {
            var shouldDisable = locked || (limit > 0 ? total < limit : false);
            button.disabled = shouldDisable;
            if (overlay) {
                overlay.classList.toggle('visible', shouldDisable);
            }
            if (!shouldDisable && selectionHint) {
                selectionHint.hidden = true;
                if (hintTimeout) {
                    clearTimeout(hintTimeout);
                }
            }
        }
        syncCardSelected();
    };

    checkboxes.forEach(function(cb) {
        cb.addEventListener('change', updateProgress);
        var card = cb.closest('.card');
        if (!card) {
            return;
        }
        card.addEventListener('click', function(e) {
            if (cb.disabled || e.target === cb || e.target.closest('label')) {
                return;
            }
            cb.checked = !cb.checked;
            cb.dispatchEvent(new Event('change', { bubbles: true }));
        });
    });
    updateProgress();
});
</script>
</body>
</html>
