(function(){
  'use strict';

  const JT = window.JiraTheme || {};
  JT.config = JT.config || {
    sidebarStorageKey: 'jl-sidebar-collapsed'
  };

  function hasSidebarContent(){
    const sidebar = document.getElementById('sidebar');
    if(!sidebar) return false;

    const adminMenu = sidebar.querySelector('#admin-menu');
    if (adminMenu && adminMenu.innerHTML.trim()) return true;

    const sidebarWrapper = sidebar.querySelector('#sidebar-wrapper');
     if (sidebarWrapper) {
      // 1. remove HTML comments from innerHTML
      const cleaned = sidebarWrapper.innerHTML
        .replace(/<!--[\s\S]*?-->/g, '') // remove comments
        .trim();
      if (cleaned) return true;
    }

    return false;
  }

  function handleNoSidebarClass() {
    const main = document.getElementById('main');
    const sidebar = document.getElementById('sidebar');
    const body = document.body;
    if (!main) return;

    const hasNoSidebarContent = !hasSidebarContent();
    const isLoginPage = body.classList.contains('action-login');

    if (hasNoSidebarContent || isLoginPage) {
      body.classList.add('jl-no-sidebar');
      if (sidebar) sidebar.style.display = 'none';
    } else {
      body.classList.remove('jl-no-sidebar');
      if (sidebar) sidebar.style.display = '';
    }
  }

  function updateToggleIcon(btn) {
    const isCollapsed = document.documentElement.classList.contains('jl-sidebar-collapsed');
    btn.innerHTML = isCollapsed ? '&raquo;' : '&laquo;'; // >> when collapsed, << when expanded
  }

  function createSidebarToggle(){
    // Always remove existing custom toggles first
    document.querySelectorAll('.jl-sidebar-toggle').forEach(t => t.remove());

    const body = document.body;
    if (!hasSidebarContent() || body.classList.contains('action-login')) {
      console.log('JiraTheme: No toggle needed - no sidebar content or login page');
      return;
    }

    const btn = document.createElement('div');
    btn.className = 'jl-sidebar-toggle';
    btn.innerHTML = '&laquo;'; // default << (collapse)
    btn.setAttribute('aria-label','Toggle Sidebar');
    btn.setAttribute('title','Toggle Sidebar');

    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleSidebar();
      updateToggleIcon(btn);
    });

    // Insert inside #main so it sticks to content
    const main = document.getElementById('main');
    if (main) main.appendChild(btn);

    console.log('JiraTheme: Side toggle created');

    // Hide native Redmine toggle if it exists
    const nativeToggle = document.getElementById('sidebar-switch-button');
    if (nativeToggle) nativeToggle.style.display = 'none';
  }


  function toggleSidebar(){
    if(!hasSidebarContent()) return;
    const html = document.documentElement;
    const main = document.getElementById('main');
    const sidebar = document.getElementById('sidebar');
    const isCollapsed = html.classList.contains('jl-sidebar-collapsed') || main.classList.contains('nosidebar');
    const rememberSidebar = window.REMEMBERSIDEBAR !== false; // default to true if not set

    if (isCollapsed) {
      html.classList.remove('jl-sidebar-collapsed');
      main.classList.remove('nosidebar');
      if (sidebar) sidebar.style.display = '';
      if (rememberSidebar) {
        localStorage.setItem(JT.config.sidebarStorageKey, 'false');
      }
      console.log('JiraTheme: Sidebar expanded');
    } else {
      html.classList.add('jl-sidebar-collapsed');
      main.classList.add('nosidebar');
      if (rememberSidebar) {
        localStorage.setItem(JT.config.sidebarStorageKey, 'true');
      }
      console.log('JiraTheme: Sidebar collapsed');
    }

    // Removed jumping animation - let CSS transitions handle the smooth animation
  }

  function restoreSidebarState(){
    try{
      if(!hasSidebarContent()) return;
      const rememberSidebar = window.REMEMBERSIDEBAR !== false; // default to true if not set
      const html = document.documentElement;
      const main = document.getElementById('main');

      if (rememberSidebar) {
        const isCollapsed = localStorage.getItem(JT.config.sidebarStorageKey) === 'true';
        if (isCollapsed){
          html.classList.add('jl-sidebar-collapsed');
          if (main) main.classList.add('nosidebar');
          console.log('JiraTheme: Restored collapsed state from localStorage');
        } else {
          html.classList.remove('jl-sidebar-collapsed');
          if (main) main.classList.remove('nosidebar');
          console.log('JiraTheme: Restored expanded state from localStorage');
        }
      } else {
        // If remember sidebar is disabled, always start expanded
        html.classList.remove('jl-sidebar-collapsed');
        if (main) main.classList.remove('nosidebar');
        console.log('JiraTheme: Remember sidebar disabled, starting expanded');
      }
    }catch(e){
      console.warn('JiraTheme: restoreSidebarState failed', e);
    }
  }

  // Mobile overlay dimmer
  function ensureMobileDimmer(){
    let dim = document.querySelector('.jl-mobile-dim');
    if(!dim){
      dim = document.createElement('div');
      dim.className = 'jl-mobile-dim';
      dim.addEventListener('click', ()=> {
        if (document.body.classList.contains('jl-mobile')) toggleSidebar();
      });
      document.body.appendChild(dim);
    }
    return dim;
  }

  function syncDimmer(){
    const isMobile = window.innerWidth < 768;
    const body = document.body;

    if (isMobile) {
      body.classList.add('jl-mobile');
      const dim = ensureMobileDimmer();
      const isCollapsed = document.documentElement.classList.contains('jl-sidebar-collapsed');
      dim.style.opacity = isCollapsed ? '0' : '1';
      dim.style.visibility = isCollapsed ? 'hidden' : 'visible';
    } else {
      body.classList.remove('jl-mobile');
      const dim = document.querySelector('.jl-mobile-dim');
      if (dim) dim.remove();
    }
  }

  function initializeSidebar() {
    console.log('JiraTheme: Initializing sidebar...');
    const main = document.getElementById('main');
    if (main && typeof $.fn.collapsibleSidebar !== 'undefined') {
      try {
        $(main).off('click.collapsibleSidebar');
        console.log('JiraTheme: Disabled native collapsible sidebar');
      } catch(e) {
        console.warn('JiraTheme: Could not disable native sidebar:', e);
      }
    }
    handleNoSidebarClass();
    restoreSidebarState();
    createSidebarToggle();
    syncDimmer();
    console.log('JiraTheme: Sidebar initialization complete');
  }

  Object.assign(JT, {
    hasSidebarContent, handleNoSidebarClass,
    createSidebarToggle, toggleSidebar,
    restoreSidebarState, initializeSidebar
  });
  window.JiraTheme = JT;

  function forceInit() {
    setTimeout(() => {
      console.log('JiraTheme: Force initializing...');
      initializeSidebar();
      setTimeout(() => {
        const toggle = document.querySelector('.jl-sidebar-toggle');
        if (!toggle && hasSidebarContent()) {
          console.log('JiraTheme: Toggle missing, creating again...');
          createSidebarToggle();
        }
      }, 500);
    }, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', forceInit);
  } else {
    forceInit();
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      const toggle = document.querySelector('.jl-sidebar-toggle');
      if (!toggle && hasSidebarContent()) {
        console.log('JiraTheme: Creating toggle on window load...');
        createSidebarToggle();
      }
    }, 100);
  });

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(syncDimmer, 250);
  });

})();