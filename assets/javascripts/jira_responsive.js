(function(){
  'use strict';
  const JT = window.JiraTheme || {};

  function updateResponsiveClasses() {
    const body = document.body;
    const width = window.innerWidth;

    body.classList.toggle('jl-mobile', width < 768);
    body.classList.toggle('jl-tablet', width >= 768 && width < 1024);
    body.classList.toggle('jl-desktop', width >= 1024);
  }

  function handleResponsive(){
    const w = window.innerWidth, sidebar = document.getElementById('sidebar'), html = document.documentElement;
    if (JT.hasSidebarContent() && w < JT.config.autoCollapseSidebarWidth && sidebar){
      if (!html.classList.contains('jl-sidebar-collapsed')){
        html.classList.add('jl-auto-collapsed','jl-sidebar-collapsed');
      }
    } else if (html.classList.contains('jl-auto-collapsed')){
      html.classList.remove('jl-auto-collapsed','jl-sidebar-collapsed');
    }
    updateResponsiveClasses();
    JT.syncDimmer && JT.syncDimmer();
  }

  window.addEventListener('resize', ()=>{
    clearTimeout(window.jiraResizeTimeout);
    window.jiraResizeTimeout = setTimeout(handleResponsive, 150);
  });

  Object.assign(JT, { handleResponsive });
  window.JiraTheme = JT;
})();
