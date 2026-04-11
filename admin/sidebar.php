<button type="button" class="sidebar-toggle" id="sidebarToggle" aria-label="Open navigation">☰</button>
<div class="sidebar-backdrop" id="sidebarBackdrop"></div>
<aside class="sidebar" id="sidebar">
    <div class="sidebar-header">
        <div class="brand">
            <h2>ExamPanel</h2>
            <p>Administration</p>
        </div>
        <button type="button" class="sidebar-close" id="sidebarClose" aria-label="Close navigation">×</button>
    </div>
    <div class="profile">
        <div class="avatar"></div>
        <div class="meta">
            <div class="name"><?= $username ?></div>
            <div class="role">Administrator</div>
        </div>
    </div>
    <nav class="nav">
        <a href="dashboard.php" class="nav-item <?= $active_page == 'dashboard' ? 'active' : '' ?>">Dashboard</a>
        <a href="users.php" class="nav-item <?= $active_page == 'users' ? 'active' : '' ?>">Users</a>
        <a href="duties.php" class="nav-item <?= $active_page == 'duties' ? 'active' : '' ?>">Duties</a>
        <a href="classes.php" class="nav-item <?= $active_page == 'classes' ? 'active' : '' ?>">Classes</a>
        <a href="slots.php" class="nav-item <?= $active_page == 'slots' ? 'active' : '' ?>">Slots</a>
        <a href="report.php" class="nav-item <?= $active_page == 'reports' ? 'active' : '' ?>">Reports</a>
    </nav>
    <div class="sidebar-footer">
        <a href="../logout.php" class="nav-item">Logout</a>
    </div>
</aside>