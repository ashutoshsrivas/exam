// Admin sidebar toggle
(function(){
  const toggle = document.getElementById('sidebarToggle');
  if(!toggle) return;
  toggle.addEventListener('click', ()=>{
    document.body.classList.toggle('sidebar-open');
  });
})();
