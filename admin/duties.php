<?php
session_start();
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || strtolower($_SESSION['role']) !== 'admin') {
    header('Location: ../login.php');
    exit;
}
$username = htmlspecialchars($_SESSION['username']);
$active_page = 'duties';

require_once '../lib/conn.php';

$query = "SELECT id, title, academicsession, type, professor, assistantprofessor, associateprofessor, researchscholar, createdat FROM duties ORDER BY id";
$result = $conn->query($query);
$duties = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $duties[] = $row;
    }
}

$message = '';
$message_type = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_duty'])) {
    $title = trim($_POST['title']);
    $academicsession = trim($_POST['academicsession']);
    $type = trim($_POST['type']);
    $professor = intval($_POST['professor']);
    $assistant = intval($_POST['assistant']);
    $associate = intval($_POST['associate']);
    $research = intval($_POST['research']);

    if (empty($title) || empty($academicsession) || empty($type)) {
        $message = 'All fields are required.';
        $message_type = 'error';
    } else {
        $stmt = $conn->prepare("INSERT INTO duties (title, academicsession, type, professor, assistantprofessor, associateprofessor, researchscholar, createdat) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
        $stmt->bind_param("sssiiii", $title, $academicsession, $type, $professor, $assistant, $associate, $research);
        if ($stmt->execute()) {
            $message = 'Duty added successfully.';
            $message_type = 'success';
            // Refresh duties list
            $result = $conn->query($query);
            $duties = [];
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $duties[] = $row;
                }
            }
        } else {
            $message = 'Error adding duty.';
            $message_type = 'error';
        }
        $stmt->close();
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_duty'])) {
    $duty_id = intval($_POST['duty_id']);
    $stmt = $conn->prepare("DELETE FROM duties WHERE id = ?");
    $stmt->bind_param("i", $duty_id);
    if ($stmt->execute()) {
        $message = 'Duty deleted successfully.';
        $message_type = 'success';
        // Refresh duties list
        $result = $conn->query($query);
        $duties = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $duties[] = $row;
            }
        }
    } else {
        $message = 'Error deleting duty.';
        $message_type = 'error';
    }
    $stmt->close();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_duty'])) {
    $duty_id = intval($_POST['duty_id']);
    $title = trim($_POST['title']);
    $academicsession = trim($_POST['academicsession']);
    $type = trim($_POST['type']);
    $professor = intval($_POST['professor']);
    $assistant = intval($_POST['assistant']);
    $associate = intval($_POST['associate']);
    $research = intval($_POST['research']);

    if (empty($title) || empty($academicsession) || empty($type)) {
        $message = 'All fields are required.';
        $message_type = 'error';
    } else {
        $stmt = $conn->prepare("UPDATE duties SET title = ?, academicsession = ?, type = ?, professor = ?, assistantprofessor = ?, associateprofessor = ?, researchscholar = ? WHERE id = ?");
        $stmt->bind_param("sssiiiii", $title, $academicsession, $type, $professor, $assistant, $associate, $research, $duty_id);
        if ($stmt->execute()) {
            $message = 'Duty updated successfully.';
            $message_type = 'success';
            // Refresh duties list
            $result = $conn->query($query);
            $duties = [];
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $duties[] = $row;
                }
            }
        } else {
            $message = 'Error updating duty.';
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
    <title>Admin - Duties</title>
    <link rel="stylesheet" href="../public/style/styles.css">
    <link rel="stylesheet" href="../public/style/admin.css">
</head>
<body class="admin-open">
    <?php include 'sidebar.php'; ?>

    <div class="main">
        <header class="topbar">
            <h1 class="page-title">Duties</h1>
        </header>

        <?php if ($message): ?>
        <div class="message <?= $message_type ?>">
            <?= htmlspecialchars($message) ?>
        </div>
        <?php endif; ?>

        <section class="content">
            <?php if ($message): ?>
                <div class="message <?= $message_type ?>">
                    <?= $message ?>
                </div>
            <?php endif; ?>
            <div class="duties-table">
                <div class="table-header">
                    <h2>Duty Management</h2>
                    <button type="button" class="btn add-user-btn" onclick="openAddModal()">Add New Duty</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Academic Session</th>
                            <th>Type</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($duties as $duty): ?>
                        <tr>
                            <td><?= htmlspecialchars($duty['id']) ?></td>
                            <td><?= htmlspecialchars($duty['title']) ?></td>
                            <td><?= htmlspecialchars($duty['academicsession']) ?></td>
                            <td><?= htmlspecialchars($duty['type']) ?></td>
                            <td><?= date('M d, Y H:i', strtotime($duty['createdat'])) ?></td>
                            <td>
                                <div class="actions">
                                    <button class="btn small edit-btn" onclick="openEditModal(<?= $duty['id'] ?>, '<?= addslashes(htmlspecialchars($duty['title'])) ?>', '<?= addslashes(htmlspecialchars($duty['academicsession'])) ?>', '<?= addslashes(htmlspecialchars($duty['type'])) ?>', <?= intval($duty['professor'] ?? 0) ?>, <?= intval($duty['assistantprofessor'] ?? 0) ?>, <?= intval($duty['associateprofessor'] ?? 0) ?>, <?= intval($duty['researchscholar'] ?? 0) ?>)" title="Edit Duty">
                                        ✏️ Edit
                                    </button>
                                    <form method="post" style="display:inline;" onsubmit="return confirm('Are you sure you want to delete this duty?')">
                                        <input type="hidden" name="delete_duty" value="1">
                                        <input type="hidden" name="duty_id" value="<?= $duty['id'] ?>">
                                        <button type="submit" class="btn small delete-btn" title="Delete Duty">
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

    <!-- Add Duty Modal -->
    <div id="addDutyModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeAddModal()">&times;</span>
            <h2>Add New Duty</h2>
            <form method="post">
                <input type="hidden" name="add_duty" value="1">
                <div class="form-group">
                    <label for="title">Title:</label>
                    <input type="text" id="title" name="title" required>
                </div>
                <div class="form-group">
                    <label for="academicsession">Academic Session:</label>
                    <input type="text" id="academicsession" name="academicsession" required>
                </div>
                <div class="form-group">
                    <label for="type">Type:</label>
                    <input type="text" id="type" name="type" required>
                </div>
                <div class="form-group">
                    <label for="professor">Professor Limit:</label>
                    <input type="number" id="professor" name="professor" min="0" value="0" required>
                </div>
                <div class="form-group">
                    <label for="assistant">Assistant Professor Limit:</label>
                    <input type="number" id="assistant" name="assistant" min="0" value="0" required>
                </div>
                <div class="form-group">
                    <label for="associate">Associate Professor Limit:</label>
                    <input type="number" id="associate" name="associate" min="0" value="0" required>
                </div>
                <div class="form-group">
                    <label for="research">Research Scholar Limit:</label>
                    <input type="number" id="research" name="research" min="0" value="0" required>
                </div>
                <button type="submit" class="btn">Add Duty</button>
            </form>
        </div>
    </div>

    <!-- Edit Duty Modal -->
    <div id="editModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeEditModal()">&times;</span>
            <h2>Edit Duty</h2>
            <form method="post">
                <input type="hidden" name="update_duty" value="1">
                <input type="hidden" id="edit_duty_id" name="duty_id">
                <div class="form-group">
                    <label for="edit_title">Title:</label>
                    <input type="text" id="edit_title" name="title" required>
                </div>
                <div class="form-group">
                    <label for="edit_academicsession">Academic Session:</label>
                    <input type="text" id="edit_academicsession" name="academicsession" required>
                </div>
                <div class="form-group">
                    <label for="edit_type">Type:</label>
                    <input type="text" id="edit_type" name="type" required>
                </div>
                <div class="form-group">
                    <label for="edit_professor">Professor Limit:</label>
                    <input type="number" id="edit_professor" name="professor" min="0" value="0" required>
                </div>
                <div class="form-group">
                    <label for="edit_assistant">Assistant Professor Limit:</label>
                    <input type="number" id="edit_assistant" name="assistant" min="0" value="0" required>
                </div>
                <div class="form-group">
                    <label for="edit_associate">Associate Professor Limit:</label>
                    <input type="number" id="edit_associate" name="associate" min="0" value="0" required>
                </div>
                <div class="form-group">
                    <label for="edit_research">Research Scholar Limit:</label>
                    <input type="number" id="edit_research" name="research" min="0" value="0" required>
                </div>
                <button type="submit" class="btn">Update Duty</button>
            </form>
        </div>
    </div>

    <script src="../public/js/admin.js"></script>
    <script>
        function openAddModal() {
            document.getElementById('addDutyModal').style.display = 'block';
        }

        function closeAddModal() {
            document.getElementById('addDutyModal').style.display = 'none';
        }

        function openEditModal(id, title, session, type, professor, assistant, associate, research) {
            document.getElementById('edit_duty_id').value = id;
            document.getElementById('edit_title').value = title;
            document.getElementById('edit_academicsession').value = session;
            document.getElementById('edit_type').value = type;
            document.getElementById('edit_professor').value = professor;
            document.getElementById('edit_assistant').value = assistant;
            document.getElementById('edit_associate').value = associate;
            document.getElementById('edit_research').value = research;
            document.getElementById('editModal').style.display = 'block';
        }

        function closeEditModal() {
            document.getElementById('editModal').style.display = 'none';
        }

        // Close modal when clicking outside
        window.onclick = function(event) {
            var addDutyModal = document.getElementById('addDutyModal');
            var editModal = document.getElementById('editModal');
            if (event.target == addDutyModal) {
                addDutyModal.style.display = 'none';
            }
            if (event.target == editModal) {
                editModal.style.display = 'none';
            }
        }
    </script>
</body>
</html>