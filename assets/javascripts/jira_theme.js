(function(){
  'use strict';
  const JT = window.JiraTheme || {};
  const STORAGE_KEY = 'jiralike-theme';

  /* -------------------------
     Tabs & Status Badges
  -------------------------- */
  function enhanceTabs(){
    document.querySelectorAll('.tabs, .tabular .tabs').forEach(tab=>{
      tab.classList.add('jl-tabs');
    });
  }

  function addStatusBadges() {
    // Only select <td> elements with class "status", "priority", or "tracker"
    const sels = ['td.status', 'td.priority', 'td.tracker'];

    document.querySelectorAll(sels.join(', ')).forEach(el => {
      // Avoid re-wrapping if already processed
      if (el.querySelector('.jl-badge')) return;

      const text = (el.innerText || el.textContent || '').trim();
      const lowerText = text.toLowerCase();

      // Create span wrapper
      const span = document.createElement('span');
      span.classList.add('jl-badge');
      span.textContent = text;

      // Status-based classes
      if (/new|open|todo|assigned/.test(lowerText)) {
        span.classList.add('jl-badge-blue');
      } else if (/pending|doing|started|support/.test(lowerText)) {
        span.classList.add('jl-badge-yellow');
      } else if (/resolved|done|closed|completed/.test(lowerText)) {
        span.classList.add('jl-badge-green');
      } else if (/blocked|rejected|cancelled|failed|bug/.test(lowerText)) {
        span.classList.add('jl-badge-red');
      }

      // Priority-based classes
      if (/low|minor/.test(lowerText)) {
        span.classList.add('jl-badge-blue');
      } else if (/normal|medium/.test(lowerText)) {
        span.classList.add('jl-badge-yellow');
      } else if (/high|major/.test(lowerText)) {
        span.classList.add('jl-badge-red');
      } else if (/urgent|critical|blocker/.test(lowerText)) {
        span.classList.add('jl-badge-red');
        span.style.background = '#de350b';
      }

      // Replace element content with span
      el.textContent = '';
      el.appendChild(span);
    });
  }



  /* -------------------------
     Theme handling
  -------------------------- */
  function setTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme);
    let effective = theme;
    if (theme === 'system') {
      effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', effective);
    document.body.classList.remove('jiralike-light','jiralike-dark');
    document.body.classList.add('jiralike', 'jiralike-' + effective);

    const btn = document.getElementById('jira-theme-switch');
    if (btn) {
      btn.textContent = theme === 'system' ? '🖥️' : (effective === 'dark' ? '☀️' : '🌙');
      btn.title = `Switch Theme (current: ${theme})`;
    }
  }

  function toggleTheme(){
    const current = localStorage.getItem(STORAGE_KEY) || 'system';
    let next;
    if (current === 'light') next = 'dark';
    else if (current === 'dark') next = 'system';
    else next = 'light';
    setTheme(next);
    console.log('Theme switched →', next);
  }

  function restoreTheme(){
    const saved = localStorage.getItem(STORAGE_KEY) || 'system';
    setTheme(saved);
  }

  /* -------------------------
     Theme toggle injection
  -------------------------- */
  function injectThemeToggle() {
    function tryInject() {
      const accountMenu = document.querySelector('#account');
      if (accountMenu && !document.getElementById('jira-theme-switch')) {
        const toggle = document.createElement('div');
        toggle.id = 'jira-theme-switch';
        toggle.className = 'jl-theme-toggle';
        toggle.style.cursor = 'pointer';
        toggle.addEventListener('click', toggleTheme);

        accountMenu.appendChild(toggle);
        restoreTheme();
        return true;
      }
      return false;
    }

    // Try now, otherwise retry for a short while
    if (!tryInject()) {
      let retries = 10;
      const interval = setInterval(() => {
        if (tryInject() || --retries <= 0) {
          clearInterval(interval);
        }
      }, 300);
    }
  }

  /* -------------------------
     Layout / Enhancements
  -------------------------- */
  function fixLayoutIssues(){
    const main = document.getElementById('main'), content = document.getElementById('content');
    if (main && content){ content.style.width='100%'; content.style.minHeight='auto'; }
    document.querySelectorAll('.contextual').forEach(c=> c.classList.add('jl-fixed'));
  }

  function observePageChanges(){
    const obs = new MutationObserver(muts=>{
      let reprocess=false, recheckSidebar=false;
      muts.forEach(m=>{
        if (m.addedNodes.length>0){
          reprocess=true;
          for (const n of m.addedNodes){
            if (n.id==='sidebar' || (n.querySelector && n.querySelector('#sidebar'))){ recheckSidebar=true; }
          }
        }
      });
      if (reprocess){
        setTimeout(()=>{
          if (recheckSidebar){
            JT.handleNoSidebarClass && JT.handleNoSidebarClass();
            JT.createSidebarToggle && JT.createSidebarToggle();
          }
          JT.enhanceButtons && JT.enhanceButtons();
          addStatusBadges();
          JT.enhanceTables && JT.enhanceTables();
          JT.enhanceFilters && JT.enhanceFilters();
        }, 100);
      }
    });
    obs.observe(document.body, {childList:true, subtree:true});
  }

  /* -------------------------
   Fix Header Layout
-------------------------- */
  function fixTopMenuLayout() {
    const topMenu = document.getElementById('top-menu');
    if (!topMenu) return;

    let left = document.getElementById('top-menu-left');
    let right = document.getElementById('top-menu-right');

    if (!left) {
      left = document.createElement('div');
      left.id = 'top-menu-left';
      topMenu.prepend(left);
    }
    if (!right) {
      right = document.createElement('div');
      right.id = 'top-menu-right';
      topMenu.appendChild(right);
    }

    // Move nav links to left
    const navLinks = topMenu.querySelectorAll('ul:not(#top-menu-right ul):not(#top-menu-left ul)');
    navLinks.forEach(nav => left.appendChild(nav));

    // Move theme + account + logged in to right
    const theme = document.getElementById('jira-theme-switch');
    const account = topMenu.querySelector('.my-account')?.closest('ul');
    const logout = topMenu.querySelector('.logout')?.closest('ul');
    const loggedas = document.getElementById('loggedas');

    if (theme && !right.contains(theme)) right.prepend(theme);
    if (loggedas) right.appendChild(loggedas);
    if (account && !right.contains(account)) right.appendChild(account);
    if (logout && !right.contains(logout)) right.appendChild(logout);
  }
  /* -------------------------
     Init
  -------------------------- */
  function init(){
    try{
      JT.addBodyClasses && JT.addBodyClasses();

      JT.handleNoSidebarClass && JT.handleNoSidebarClass();
      JT.createSidebarToggle && JT.createSidebarToggle();
      JT.restoreSidebarState && JT.restoreSidebarState();

      enhanceTabs();
      JT.enhanceButtons && JT.enhanceButtons();
      addStatusBadges();
      JT.enhanceFilters && JT.enhanceFilters();
      JT.enhanceTables && JT.enhanceTables();
      if(window.ALLOWUSERTOGGLETHEME && window.ALLOWUSERTOGGLETHEME === true)
      injectThemeToggle();
      fixTopMenuLayout()

      fixLayoutIssues();
      JT.handleResponsive && JT.handleResponsive();

      observePageChanges();
      JT.addKeyboardShortcuts && JT.addKeyboardShortcuts();
      $("table th.buttons").removeClass("buttons");

      console.log('JIRA theme initialized', {
        hasSidebar: !!document.getElementById('sidebar'),
        hasSidebarContent: JT.hasSidebarContent && JT.hasSidebarContent(),
        isNoSidebar: document.body.classList.contains('nosidebar')
      });
    }catch(e){ console.error('JIRA theme init failed', e); }
  }

  // boot
  if (document.readyState === 'complete' || document.readyState === 'interactive'){ setTimeout(init, 10); }
  else { document.addEventListener('DOMContentLoaded', init); }

  // expose public API
  Object.assign(JT, {
    init,
    setTheme,
    toggleTheme,
    restoreTheme,
    injectThemeToggle,
    fixTopMenuLayout
  });
  window.JiraTheme = JT;
})();