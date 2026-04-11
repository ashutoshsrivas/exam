// Admin sidebar toggle
(function(){
  const toggle = document.getElementById('sidebarToggle');
  const close = document.getElementById('sidebarClose');
  const backdrop = document.getElementById('sidebarBackdrop');
  if(!toggle) return;

  const openSidebar = () => {
    document.body.classList.add('sidebar-open');
    document.documentElement.style.overflow = 'hidden';
  };
  const closeSidebar = () => {
    document.body.classList.remove('sidebar-open');
    document.documentElement.style.overflow = '';
  };

  toggle.addEventListener('click', openSidebar);

  if (close) {
    close.addEventListener('click', closeSidebar);
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeSidebar);
  }

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeSidebar();
    }
  });
})();
