(function(){
  'use strict';
  const JT = window.JiraTheme || {};

  function handleResponsive(){
    const w = window.innerWidth, sidebar = document.getElementById('sidebar'), html = document.documentElement;
    if (JT.hasSidebarContent() && w < JT.config.autoCollapseSidebarWidth && sidebar){
      if (!html.classList.contains('jl-sidebar-collapsed')){
        html.classList.add('jl-auto-collapsed','jl-sidebar-collapsed');
      }
    } else if (html.classList.contains('jl-auto-collapsed')){
      html.classList.remove('jl-auto-collapsed','jl-sidebar-collapsed');
    }
    JT.updateResponsiveClasses();
    JT.syncDimmer && JT.syncDimmer();
  }

  window.addEventListener('resize', ()=>{
    clearTimeout(window.jiraResizeTimeout);
    window.jiraResizeTimeout = setTimeout(handleResponsive, 150);
  });

  Object.assign(JT, { handleResponsive });
  window.JiraTheme = JT;
})();
