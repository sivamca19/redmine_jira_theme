(function(){
  'use strict';
  const JT = window.JiraTheme || {};

  function hasNoSidebar(){
    const main = document.getElementById('main');
    return main && main.classList.contains('nosidebar');
  }

  function addKeyboardShortcuts(){
    document.addEventListener('keydown', (e)=>{
      // Toggle sidebar with Ctrl/Cmd + B
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b'){
        e.preventDefault();
        if (JT.hasSidebarContent && JT.hasSidebarContent() && !hasNoSidebar()){
          JT.toggleSidebar && JT.toggleSidebar();
        }
      }

      // Toggle theme with Ctrl/Cmd + Shift + T
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (JT.hasSidebarContent && JT.hasSidebarContent() && !hasNoSidebar()) {
          JT.toggleSidebar && JT.toggleSidebar();
        }
      }
    });
  }

  Object.assign(JT, { addKeyboardShortcuts });
  window.JiraTheme = JT;
})();