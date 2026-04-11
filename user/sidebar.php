<?php $roleLabel = isset($user_role) ? ucwords(strtolower($user_role)) : 'User'; ?>
<button type="button" class="sidebar-toggle" id="sidebarToggle" aria-label="Open navigation">☰</button>
<div class="sidebar-backdrop" id="sidebarBackdrop"></div>
<aside class="sidebar" id="sidebar">
    <div class="sidebar-header">
        <div class="brand">
            <h2>ExamPanel</h2>
            <p>User workspace</p>
        </div>
        <button type="button" class="sidebar-close" id="sidebarClose" aria-label="Close navigation">×</button>
    </div>
    <div class="profile">
        <div class="avatar"></div>
            <div class="meta">
                <div class="name"><?= $username ?></div>
                <div class="role"><?= htmlspecialchars($roleLabel) ?></div>
            </div>
    </div>
    <nav class="nav">
        <a href="dashboard.php" class="nav-item <?= $active_page == 'dashboard' ? 'active' : '' ?>">Dashboard</a>
        <!-- <a href="dashboard.php#duties" class="nav-item <?= $active_page == 'duties' ? 'active' : '' ?>">Duties</a> -->
        <!-- <a href="../admin/slots.php" class="nav-item">View Slots</a> -->
        <a href="profile.php" class="nav-item <?= $active_page == 'profile' ? 'active' : '' ?>">Profile</a> 
    </nav>
    <div class="sidebar-footer">
        <a href="../logout.php" class="nav-item">Logout</a>
    </div>
</aside>