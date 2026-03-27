<?php
session_start();
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || strtolower($_SESSION['role']) !== 'admin') {
    header('Location: ../login.php');
    exit;
}
$username = htmlspecialchars($_SESSION['username']);
$active_page = 'users';

require_once '../lib/conn.php';

$query = "SELECT id, name, email, employeeid, role FROM users ORDER BY id";
$result = $conn->query($query);
$users = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
}

$message = '';
$message_type = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_user'])) {
    $employeeid = trim($_POST['employeeid']);
    $name = trim($_POST['name']);
    $email = trim($_POST['email']);
    $password = $_POST['password'];
    $confirm_password = $_POST['confirm_password'];
    $role = $_POST['role'];

    if (empty($employeeid) || empty($name) || empty($email) || empty($password) || empty($role)) {
        $message = 'All fields are required.';
        $message_type = 'error';
    } elseif ($password !== $confirm_password) {
        $message = 'Passwords do not match.';
        $message_type = 'error';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $message = 'Invalid email format.';
        $message_type = 'error';
    } else {
        $hashed_password = hash('sha256', $password);
        $stmt = $conn->prepare("INSERT INTO users (employeeid, name, email, pass, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", $employeeid, $name, $email, $hashed_password, $role);
        if ($stmt->execute()) {
            $message = 'User added successfully.';
            $message_type = 'success';
            // Refresh users list
            $result = $conn->query($query);
            $users = [];
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $users[] = $row;
                }
            }
        } else {
            $message = 'Error adding user.';
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
    <title>Admin - Users</title>
    <link rel="stylesheet" href="../public/style/styles.css">
    <link rel="stylesheet" href="../public/style/admin.css">
</head>
<body class="admin-open">
    <?php include 'sidebar.php'; ?>

    <div class="main">
        <header class="topbar">
            <h1 class="page-title">Users</h1>
        </header>

        <section class="content">
            <?php if ($message): ?>
                <div class="message <?= $message_type ?>">
                    <?= $message ?>
                </div>
            <?php endif; ?>
            <div class="users-table">
                <div class="table-header">
                    <h2>User Management</h2>
                    <button type="button" class="btn add-user-btn" onclick="openAddModal()">Add New User</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Employee ID</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($users as $user): ?>
                        <tr>
                            <td><?= htmlspecialchars($user['id']) ?></td>
                            <td><?= htmlspecialchars($user['name']) ?></td>
                            <td><?= htmlspecialchars($user['email']) ?></td>
                            <td><?= htmlspecialchars($user['employeeid']) ?></td>
                            <td><?= htmlspecialchars($user['role']) ?></td>
                            <td><a href="#" onclick="openModal(<?= $user['id'] ?>, '<?= addslashes(htmlspecialchars($user['name'])) ?>')" class="btn small">Update Password</a></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </section>
    </div>

    <!-- Add User Modal -->
    <div id="addUserModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeAddModal()">&times;</span>
            <h2>Add New User</h2>
            <form method="post">
                <input type="hidden" name="add_user" value="1">
                <div class="form-group">
                    <label for="employeeid">Employee ID:</label>
                    <input type="text" id="employeeid" name="employeeid" required>
                </div>
                <div class="form-group">
                    <label for="name">Name:</label>
                    <input type="text" id="name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="email">Email:</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="password">Password:</label>
                    <div class="password-container">
                        <input type="password" id="add_password" name="password" required>
                        <button type="button" class="toggle-password" onclick="togglePassword('add_password')">Show</button>
                    </div>
                </div>
                <div class="form-group">
                    <label for="confirm_password_add">Confirm Password:</label>
                    <div class="password-container">
                        <input type="password" id="confirm_password_add" name="confirm_password" required>
                        <button type="button" class="toggle-password" onclick="togglePassword('confirm_password_add')">Show</button>
                    </div>
                </div>
                <div class="form-group">
                    <label for="role">Role:</label>
                    <select id="role" name="role" required>
                        <option value="">Select Role</option>
                        <option value="Admin">Admin</option>
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Professor">Professor</option>
                        <option value="Research Scholar">Research Scholar</option>
                    </select>
                </div>
                <button type="submit" class="btn">Add User</button>
            </form>
        </div>
    </div>

    <script src="../public/js/admin.js"></script>
    <script>
        function openModal(userId, userName) {
            document.getElementById('modalTitle').textContent = 'Update Password for ' + userName;
            document.getElementById('modalUserId').value = userId;
            document.getElementById('passwordModal').style.display = 'block';
        }

        function closeModal() {
            document.getElementById('passwordModal').style.display = 'none';
        }

        function openAddModal() {
            document.getElementById('addUserModal').style.display = 'block';
        }

        function closeAddModal() {
            document.getElementById('addUserModal').style.display = 'none';
        }

        function togglePassword(inputId) {
            var input = document.getElementById(inputId);
            var button = input.nextElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                button.textContent = 'Hide';
            } else {
                input.type = 'password';
                button.textContent = 'Show';
            }
        }

        // Close modals when clicking outside
        window.onclick = function(event) {
            var passwordModal = document.getElementById('passwordModal');
            var addUserModal = document.getElementById('addUserModal');
            if (event.target == passwordModal) {
                passwordModal.style.display = 'none';
            }
            if (event.target == addUserModal) {
                addUserModal.style.display = 'none';
            }
        }
    </script>