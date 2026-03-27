<?php
session_start();
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || strtolower($_SESSION['role']) !== 'admin') {
    header('Location: ../login.php');
    exit;
}
$username = htmlspecialchars($_SESSION['username']);
$active_page = 'classes';

require_once '../lib/conn.php';

$message = '';
$message_type = '';

$tablesToCheck = ['rooms', 'classes', 'class', 'classrooms', 'classroom'];
$classTable = '';
foreach ($tablesToCheck as $candidate) {
    $check = $conn->query("SHOW TABLES LIKE '" . $conn->real_escape_string($candidate) . "'");
    if ($check && $check->num_rows) {
        $classTable = $candidate;
        break;
    }
}

$columns = [];
$primaryKey = '';
if ($classTable) {
    $colResult = $conn->query("SHOW COLUMNS FROM `" . $conn->real_escape_string($classTable) . "`");
    if ($colResult) {
        while ($col = $colResult->fetch_assoc()) {
            $columns[] = $col;
            if (!$primaryKey && $col['Key'] === 'PRI') {
                $primaryKey = $col['Field'];
            }
        }
    }
}
if (empty($primaryKey) && !empty($columns)) {
    $primaryKey = $columns[0]['Field'];
}

$editableColumns = array_filter($columns, function ($col) use ($primaryKey) {
    return $col['Field'] !== $primaryKey;
});

if ($classTable && $primaryKey) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($editableColumns)) {
        if (isset($_POST['add_class'])) {
            $fields = array_column($editableColumns, 'Field');
            $placeholders = implode(', ', array_fill(0, count($fields), '?'));
            $fieldList = implode(', ', array_map(function ($field) {
                return '`' . $field . '`';
            }, $fields));
            $stmt = $conn->prepare("INSERT INTO `" . $conn->real_escape_string($classTable) . "` ($fieldList) VALUES ($placeholders)");
            if ($stmt) {
                $params = [];
                foreach ($fields as $field) {
                    $params[] = $_POST[$field] ?? '';
                }
                $types = str_repeat('s', count($params));
                $bindParams = [$types];
                foreach ($params as $key => $value) {
                    $bindParams[] = &$params[$key];
                }
                call_user_func_array([$stmt, 'bind_param'], $bindParams);
                if ($stmt->execute()) {
                    $message = 'Room added successfully.';
                    $message_type = 'success';
                } else {
                    $message = 'Error adding room.';
                    $message_type = 'error';
                }
                $stmt->close();
            } else {
                $message = 'Unable to prepare insert statement.';
                $message_type = 'error';
            }
        } elseif (isset($_POST['update_class'])) {
            $fields = array_column($editableColumns, 'Field');
            $setClauses = implode(', ', array_map(function ($field) {
                return '`' . $field . '` = ?';
            }, $fields));
            $stmt = $conn->prepare("UPDATE `" . $conn->real_escape_string($classTable) . "` SET $setClauses WHERE `$primaryKey` = ?");
            if ($stmt) {
                $params = [];
                foreach ($fields as $field) {
                    $params[] = $_POST[$field] ?? '';
                }
                $params[] = $_POST[$primaryKey] ?? '';
                $types = str_repeat('s', count($params));
                $bindParams = [$types];
                foreach ($params as $key => $value) {
                    $bindParams[] = &$params[$key];
                }
                call_user_func_array([$stmt, 'bind_param'], $bindParams);
                if ($stmt->execute()) {
                    $message = 'Room updated successfully.';
                    $message_type = 'success';
                } else {
                    $message = 'Error updating room.';
                    $message_type = 'error';
                }
                $stmt->close();
            } else {
                $message = 'Unable to prepare update statement.';
                $message_type = 'error';
            }
        } elseif (isset($_POST['delete_class'])) {
            $stmt = $conn->prepare("DELETE FROM `" . $conn->real_escape_string($classTable) . "` WHERE `$primaryKey` = ?");
            if ($stmt) {
                $value = $_POST[$primaryKey] ?? '';
                $stmt->bind_param('s', $value);
                if ($stmt->execute()) {
                    $message = 'Room deleted successfully.';
                    $message_type = 'success';
                } else {
                    $message = 'Error deleting room.';
                    $message_type = 'error';
                }
                $stmt->close();
            } else {
                $message = 'Unable to prepare delete statement.';
                $message_type = 'error';
            }
        }
    }
}

$classes = [];
if ($classTable && $primaryKey) {
    $result = $conn->query("SELECT * FROM `" . $conn->real_escape_string($classTable) . "` ORDER BY `$primaryKey` DESC");
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $classes[] = $row;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Admin - Classes</title>
    <link rel="stylesheet" href="../public/style/styles.css">
    <link rel="stylesheet" href="../public/style/admin.css">
</head>
<body class="admin-open">
<?php include 'sidebar.php'; ?>

<div class="main">
    <header class="topbar">
        <h1 class="page-title">Room Management</h1>
    </header>

    <?php if ($message): ?>
        <div class="message <?= $message_type ?>">
            <?= htmlspecialchars($message) ?>
        </div>
    <?php endif; ?>

    <section class="content">
            <div class="duties-table">
                <div class="table-header">
                    <h2>Rooms</h2>
                    <?php if ($classTable && !empty($editableColumns)): ?>
                        <button type="button" class="btn add-user-btn" onclick="openAddClassModal()">Add Room</button>
                    <?php endif; ?>
                </div>

            <?php if (!$classTable): ?>
                <div class="message info">No rooms table found in the database.</div>
            <?php elseif (empty($columns)): ?>
                <div class="message info">Rooms table exists but has no columns.</div>
            <?php else: ?>
                <table>
                    <thead>
                    <tr>
                        <?php foreach ($columns as $column): ?>
                            <th><?= htmlspecialchars(ucwords(str_replace('_', ' ', $column['Field']))) ?></th>
                        <?php endforeach; ?>
                            <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    <?php foreach ($classes as $class): ?>
                        <tr>
                            <?php foreach ($columns as $column): ?>
                                <td><?= htmlspecialchars($class[$column['Field']] ?? '') ?></td>
                            <?php endforeach; ?>
                            <td>
                                <div class="actions">
                                    <?php if ($primaryKey && !empty($editableColumns)): ?>
                                        <button type="button" class="btn small edit-btn" data-row='<?= htmlspecialchars(json_encode($class), ENT_QUOTES, 'UTF-8') ?>' onclick="openEditClassModal(this)">
                                            ✏️ Edit
                                        </button>
                                        <form method="post" style="display:inline;" onsubmit="return confirm('Delete this class permanently?');">
                                            <input type="hidden" name="delete_class" value="1">
                                            <input type="hidden" name="<?= htmlspecialchars($primaryKey) ?>" value="<?= htmlspecialchars($class[$primaryKey]) ?>">
                                            <button type="submit" class="btn small delete-btn">🗑️ Delete</button>
                                        </form>
                                    <?php endif; ?>
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

<?php if (!empty($editableColumns)): ?>
    <div id="addClassModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeAddClassModal()">&times;</span>
            <h2>Add Room</h2>
            <form method="post">
                <input type="hidden" name="add_class" value="1">
                <?php foreach ($editableColumns as $column): ?>
                    <div class="form-group">
                        <label for="add_<?= htmlspecialchars($column['Field']) ?>"><?= htmlspecialchars(ucwords(str_replace('_', ' ', $column['Field']))) ?>:</label>
                        <?php $inputType = stripos($column['Type'], 'int') !== false || stripos($column['Type'], 'decimal') !== false ? 'number' : 'text'; ?>
                        <input type="<?= $inputType ?>" id="add_<?= htmlspecialchars($column['Field']) ?>" name="<?= htmlspecialchars($column['Field']) ?>" <?= $column['Null'] === 'NO' ? 'required' : '' ?>>
                    </div>
                <?php endforeach; ?>
                <button type="submit" class="btn">Add Room</button>
            </form>
        </div>
    </div>

    <div id="editClassModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeEditClassModal()">&times;</span>
            <h2>Edit Room</h2>
            <form method="post">
                <input type="hidden" name="update_class" value="1">
                <input type="hidden" id="edit_<?= htmlspecialchars($primaryKey) ?>" name="<?= htmlspecialchars($primaryKey) ?>">
                <?php foreach ($editableColumns as $column): ?>
                    <div class="form-group">
                        <label for="edit_<?= htmlspecialchars($column['Field']) ?>"><?= htmlspecialchars(ucwords(str_replace('_', ' ', $column['Field']))) ?>:</label>
                        <?php $inputType = stripos($column['Type'], 'int') !== false || stripos($column['Type'], 'decimal') !== false ? 'number' : 'text'; ?>
                        <input type="<?= $inputType ?>" id="edit_<?= htmlspecialchars($column['Field']) ?>" name="<?= htmlspecialchars($column['Field']) ?>" <?= $column['Null'] === 'NO' ? 'required' : '' ?>>
                    </div>
                <?php endforeach; ?>
                <button type="submit" class="btn">Update Room</button>
            </form>
        </div>
    </div>
<?php endif; ?>

<script>
    function openAddClassModal() {
        const modal = document.getElementById('addClassModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    function closeAddClassModal() {
        const modal = document.getElementById('addClassModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    function openEditClassModal(button) {
        const modal = document.getElementById('editClassModal');
        if (!modal) {
            return;
        }
        const row = JSON.parse(button.getAttribute('data-row'));
        const primaryKey = '<?= htmlspecialchars($primaryKey) ?>';
        const pkInput = document.getElementById('edit_' + primaryKey);
        if (pkInput) {
            pkInput.value = row[primaryKey] ?? '';
        }
        const editableFields = <?= json_encode(array_values(array_map(function ($col) {
            return $col['Field'];
        }, $editableColumns))) ?>;
        editableFields.forEach(field => {
            const input = document.getElementById('edit_' + field);
            if (input) {
                input.value = row[field] ?? '';
            }
        });
        modal.style.display = 'block';
    }

    function closeEditClassModal() {
        const modal = document.getElementById('editClassModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    window.onclick = function (event) {
        const addModal = document.getElementById('addClassModal');
        const editModal = document.getElementById('editClassModal');
        if (addModal && event.target === addModal) {
            closeAddClassModal();
        }
        if (editModal && event.target === editModal) {
            closeEditClassModal();
        }
    }
</script>
</body>
</html>