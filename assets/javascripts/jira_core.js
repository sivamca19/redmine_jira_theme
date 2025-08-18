(function(){
  'use strict';

  const config = {
    sidebarStorageKey: 'jiralike-sidebar-collapsed',
    themeStorageKey: 'jiralike-theme',
    stickyHeader: true,
    autoCollapseSidebarWidth: 768
  };

  function addBodyClasses(){
    const b = document.body; if(!b) return;
    if(!b.classList.contains('jiralike')) b.classList.add('jiralike');
    if(config.stickyHeader) b.classList.add('jiralike-sticky-header');
    updateResponsiveClasses();
  }

  function updateResponsiveClasses(){
    const b = document.body, w = window.innerWidth;
    if(!b) return;
    b.classList.toggle('jl-mobile', w < 768);
    b.classList.toggle('jl-tablet', w >= 768 && w < 1024);
    b.classList.toggle('jl-desktop', w >= 1024);
  }

  // expose
  window.JiraTheme = window.JiraTheme || {};
  Object.assign(window.JiraTheme, {
    config,
    addBodyClasses,
    updateResponsiveClasses
  });
})();
