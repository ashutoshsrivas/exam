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
$username = htmlspecialchars($_SESSION['username']);
$active_page = 'users';

require_once '../lib/conn.php';

// Check if phone column exists, add if missing (for backwards compatibility)
$columns = $conn->query("SHOW COLUMNS FROM users LIKE 'phone'");
if ($columns && $columns->num_rows === 0) {
    @$conn->query("ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT NULL AFTER email");
}

$query = "SELECT id, name, email, phone, employeeid, role FROM users ORDER BY id";
$result = $conn->query($query);
$users = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
}

$message = '';
$message_type = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['edit_user'])) {
        $user_id = intval($_POST['user_id'] ?? 0);
        $employeeid = trim($_POST['employeeid'] ?? '');
        $name = trim($_POST['name'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $phone = trim($_POST['phone'] ?? '');
        $role = trim($_POST['role'] ?? '');
        $new_password = $_POST['new_password'] ?? '';
        $confirm_new_password = $_POST['confirm_new_password'] ?? '';

        if ($user_id <= 0 || empty($employeeid) || empty($name) || empty($phone) || empty($role)) {
            $message = 'Employee ID, Name, Phone, and Role are required.';
            $message_type = 'error';
        } elseif (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $message = 'Invalid email format.';
            $message_type = 'error';
        } elseif (!preg_match('/^[0-9+\-() ]{7,20}$/', $phone)) {
            $message = 'Invalid phone number format.';
            $message_type = 'error';
        } elseif (($new_password !== '' || $confirm_new_password !== '') && $new_password !== $confirm_new_password) {
            $message = 'New passwords do not match.';
            $message_type = 'error';
        } elseif ($new_password !== '' && strlen($new_password) < 6) {
            $message = 'New password must be at least 6 characters.';
            $message_type = 'error';
        } else {
            if ($new_password !== '') {
                $hashed_password = hash('sha256', $new_password);
                $stmt = $conn->prepare("UPDATE users SET employeeid = ?, name = ?, email = ?, phone = ?, role = ?, pass = ? WHERE id = ?");
                $stmt->bind_param("ssssssi", $employeeid, $name, $email, $phone, $role, $hashed_password, $user_id);
            } else {
                $stmt = $conn->prepare("UPDATE users SET employeeid = ?, name = ?, email = ?, phone = ?, role = ? WHERE id = ?");
                $stmt->bind_param("sssssi", $employeeid, $name, $email, $phone, $role, $user_id);
            }
            if ($stmt->execute()) {
                $message = 'User details updated successfully.';
                $message_type = 'success';
            } else {
                $message = 'Error updating user details.';
                $message_type = 'error';
            }
            $stmt->close();
        }
    } elseif (isset($_POST['delete_user'])) {
        $user_id = intval($_POST['user_id'] ?? 0);

        if ($user_id <= 0) {
            $message = 'Invalid user selected.';
            $message_type = 'error';
        } elseif ($user_id === intval($_SESSION['user_id'])) {
            $message = 'You cannot delete your own account.';
            $message_type = 'error';
        } else {
            $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
            $stmt->bind_param("i", $user_id);
            if ($stmt->execute() && $stmt->affected_rows > 0) {
                $message = 'User deleted successfully.';
                $message_type = 'success';
            } else {
                $message = 'Error deleting user.';
                $message_type = 'error';
            }
            $stmt->close();
        }
    } elseif (isset($_POST['add_user'])) {
        $employeeid = trim($_POST['employeeid']);
        $name = trim($_POST['name']);
        $email = trim($_POST['email']);
        $phone = trim($_POST['phone']);
        $password = $_POST['password'];
        $confirm_password = $_POST['confirm_password'];
        $role = $_POST['role'];

        if (empty($employeeid) || empty($name) || empty($phone) || empty($password) || empty($role)) {
            $message = 'Employee ID, Name, Phone, Password, and Role are required.';
            $message_type = 'error';
        } elseif ($password !== $confirm_password) {
            $message = 'Passwords do not match.';
            $message_type = 'error';
        } elseif (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $message = 'Invalid email format.';
            $message_type = 'error';
        } elseif (!preg_match('/^[0-9+\-() ]{7,20}$/', $phone)) {
            $message = 'Invalid phone number format.';
            $message_type = 'error';
        } else {
            $hashed_password = hash('sha256', $password);
            $stmt = $conn->prepare("INSERT INTO users (employeeid, name, email, phone, pass, role) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("ssssss", $employeeid, $name, $email, $phone, $hashed_password, $role);
            if ($stmt->execute()) {
                $message = 'User added successfully.';
                $message_type = 'success';
            } else {
                $message = 'Error adding user.';
                $message_type = 'error';
            }
            $stmt->close();
        }
    }

    // Refresh users list after any add/edit action
    $result = $conn->query($query);
    $users = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
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
            <div class="users-header">
                <div>
                    <h2>User Management</h2>
                    <p class="user-count" id="userCount"><?= count($users) ?> total <?= count($users) === 1 ? 'user' : 'users' ?></p>
                </div>
                <button type="button" class="btn add-user-btn" onclick="openAddModal()">+ Add New User</button>
            </div>
            
            <div class="search-bar-container">
                <input 
                    type="text" 
                    id="userSearchInput" 
                    class="search-input" 
                    placeholder="Search by name, email, or employee ID..."
                    oninput="filterUsers()"
                >
                <span class="search-icon">🔍</span>
            </div>
            
            <div class="users-grid" id="usersGrid">
                <?php foreach ($users as $user): ?>
                <div 
                    class="user-card"
                    data-name="<?= strtolower(htmlspecialchars($user['name'] ?? '')) ?>"
                    data-email="<?= strtolower(htmlspecialchars($user['email'] ?? '')) ?>"
                    data-employeeid="<?= strtolower(htmlspecialchars($user['employeeid'] ?? '')) ?>"
                >
                    <div class="card-header">
                        <div class="user-avatar">
                            <span class="avatar-initial"><?= strtoupper(substr($user['name'], 0, 1)) ?></span>
                        </div>
                        <div class="user-info-header">
                            <h3 class="user-name"><?= htmlspecialchars($user['name']) ?></h3>
                            <span class="role-badge role-<?= strtolower(str_replace(' ', '-', $user['role'])) ?>">
                                <?= htmlspecialchars($user['role']) ?>
                            </span>
                        </div>
                    </div>
                    
                    <div class="card-content">
                        <div class="user-detail">
                            <span class="label">Employee ID</span>
                            <span class="value"><?= htmlspecialchars($user['employeeid']) ?></span>
                        </div>
                        <div class="user-detail">
                            <span class="label">Email</span>
                            <span class="value email-value"><?= htmlspecialchars($user['email'] ?? '(None)') ?></span>
                        </div>
                        <div class="user-detail">
                            <span class="label">Phone</span>
                            <span class="value"><?= htmlspecialchars($user['phone'] ?? 'N/A') ?></span>
                        </div>
                        <div class="user-detail">
                            <span class="label">User ID</span>
                            <span class="value id-value">#<?= htmlspecialchars($user['id']) ?></span>
                        </div>
                    </div>
                    
                    <div class="card-actions">
                        <button
                            type="button"
                            class="btn small"
                            onclick="openEditModal(this)"
                            data-id="<?= htmlspecialchars($user['id']) ?>"
                            data-employeeid="<?= htmlspecialchars($user['employeeid'] ?? '', ENT_QUOTES) ?>"
                            data-name="<?= htmlspecialchars($user['name'] ?? '', ENT_QUOTES) ?>"
                            data-email="<?= htmlspecialchars($user['email'] ?? '', ENT_QUOTES) ?>"
                            data-phone="<?= htmlspecialchars($user['phone'] ?? '', ENT_QUOTES) ?>"
                            data-role="<?= htmlspecialchars($user['role'] ?? '', ENT_QUOTES) ?>"
                        >Edit User</button>
                        <form method="post" style="flex:1;" onsubmit="return confirm('Delete this user? This action cannot be undone.');">
                            <input type="hidden" name="delete_user" value="1">
                            <input type="hidden" name="user_id" value="<?= htmlspecialchars($user['id']) ?>">
                            <button type="submit" class="btn small btn-danger" style="width:100%;">Delete</button>
                        </form>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </section>
    </div>

    <!-- Edit User Modal -->
    <div id="editUserModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeEditModal()">&times;</span>
            <h2>Edit User</h2>
            <form method="post">
                <input type="hidden" name="edit_user" value="1">
                <input type="hidden" id="edit_user_id" name="user_id">
                <div class="form-group">
                    <label for="edit_employeeid">Employee ID:</label>
                    <input type="text" id="edit_employeeid" name="employeeid" required>
                </div>
                <div class="form-group">
                    <label for="edit_name">Name:</label>
                    <input type="text" id="edit_name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="edit_email">Email <span style="font-size: 0.85rem; color: var(--muted-soft);">(Optional)</span>:</label>
                    <input type="email" id="edit_email" name="email">
                </div>
                <div class="form-group">
                    <label for="edit_phone">Phone Number:</label>
                    <input type="tel" id="edit_phone" name="phone" required>
                </div>
                <div class="form-group">
                    <label for="edit_role">Role:</label>
                    <select id="edit_role" name="role" required>
                        <option value="">Select Role</option>
                        <option value="Admin">Admin</option>
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Professor">Professor</option>
                        <option value="Research Scholar">Research Scholar</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit_new_password">New Password (optional):</label>
                    <div class="password-container">
                        <input type="password" id="edit_new_password" name="new_password">
                        <button type="button" class="toggle-password" onclick="togglePassword('edit_new_password')">Show</button>
                    </div>
                </div>
                <div class="form-group">
                    <label for="edit_confirm_new_password">Confirm New Password (optional):</label>
                    <div class="password-container">
                        <input type="password" id="edit_confirm_new_password" name="confirm_new_password">
                        <button type="button" class="toggle-password" onclick="togglePassword('edit_confirm_new_password')">Show</button>
                    </div>
                </div>
                <button type="submit" class="btn">Save Changes</button>
            </form>
        </div>
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
                    <label for="email">Email <span style="font-size: 0.85rem; color: var(--muted-soft);">(Optional)</span>:</label>
                    <input type="email" id="email" name="email">
                </div>
                <div class="form-group">
                    <label for="phone">Phone Number:</label>
                    <input type="tel" id="phone" name="phone" required>
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
        function setRoleValue(selectId, roleValue) {
            var select = document.getElementById(selectId);
            if (!select) {
                return;
            }

            var normalizedRole = (roleValue || '').toLowerCase().trim();
            select.value = '';

            for (var index = 0; index < select.options.length; index++) {
                var option = select.options[index];
                if (option.value.toLowerCase() === normalizedRole) {
                    select.value = option.value;
                    break;
                }
            }
        }

        function openEditModal(button) {
            document.getElementById('edit_user_id').value = button.dataset.id;
            document.getElementById('edit_employeeid').value = button.dataset.employeeid || '';
            document.getElementById('edit_name').value = button.dataset.name || '';
            document.getElementById('edit_email').value = button.dataset.email || '';
            document.getElementById('edit_phone').value = button.dataset.phone || '';
            setRoleValue('edit_role', button.dataset.role || '');
            document.getElementById('edit_new_password').value = '';
            document.getElementById('edit_confirm_new_password').value = '';
            document.getElementById('editUserModal').style.display = 'block';
        }

        function closeEditModal() {
            document.getElementById('editUserModal').style.display = 'none';
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
            var editUserModal = document.getElementById('editUserModal');
            var addUserModal = document.getElementById('addUserModal');
            if (event.target == editUserModal) {
                editUserModal.style.display = 'none';
            }
            if (event.target == addUserModal) {
                addUserModal.style.display = 'none';
            }
        }

        // Search/Filter functionality
        function filterUsers() {
            var searchInput = document.getElementById('userSearchInput');
            var searchTerm = searchInput.value.toLowerCase().trim();
            var userCards = document.querySelectorAll('.user-card');
            var visibleCount = 0;
            var usersGrid = document.getElementById('usersGrid');

            userCards.forEach(function(card) {
                var name = card.getAttribute('data-name') || '';
                var email = card.getAttribute('data-email') || '';
                var employeeid = card.getAttribute('data-employeeid') || '';

                var matches = !searchTerm || 
                    name.includes(searchTerm) || 
                    email.includes(searchTerm) || 
                    employeeid.includes(searchTerm);

                if (matches) {
                    card.classList.remove('hidden');
                    visibleCount++;
                } else {
                    card.classList.add('hidden');
                }
            });

            // Remove existing no-results message if any
            var existingNoResults = usersGrid.querySelector('.no-results');
            if (existingNoResults) {
                existingNoResults.remove();
            }

            // Show no results message if no matches found
            if (visibleCount === 0 && searchTerm) {
                var noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.innerHTML = '<p>No users found matching "' + searchTerm + '"</p>';
                usersGrid.appendChild(noResults);
            }

            // Update user count
            var userCountEl = document.getElementById('userCount');
            if (searchTerm) {
                userCountEl.textContent = visibleCount + ' matching ' + (visibleCount === 1 ? 'user' : 'users');
            } else {
                userCountEl.textContent = userCards.length + ' total ' + (userCards.length === 1 ? 'user' : 'users');
            }
        }
    </script>
    </body>
    </html>