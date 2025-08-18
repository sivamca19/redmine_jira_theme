(function(){
  'use strict';
  const JT = window.JiraTheme || {};
  function wrapTables(){
    document.querySelectorAll('table').forEach(tbl=>{
      if (tbl.closest('.table-wrapper')) return;
      const wrap = document.createElement('div');
      wrap.className = 'table-wrapper';
      tbl.parentNode.insertBefore(wrap, tbl);
      wrap.appendChild(tbl);
    });
  }

  function enhanceTables(){
    wrapTables();
    document.querySelectorAll('table').forEach(table=>{
      if (table.classList.contains('jl-enhanced')) return;
      table.classList.add('jl-enhanced');
      table.querySelectorAll('tbody tr').forEach(row=>{
        row.addEventListener('mouseenter', ()=> row.style.backgroundColor='var(--jira-hover)');
        row.addEventListener('mouseleave', ()=> row.style.backgroundColor='');
      });
    });
  }

  Object.assign(JT, { enhanceTables });
  window.JiraTheme = JT;
})();