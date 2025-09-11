// Jira Theme Settings JavaScript

function toggleDarkThemeFields(autoGenerate) {
  const darkFields = document.getElementById('dark-theme-fields');
  if (darkFields) {
    darkFields.style.display = autoGenerate ? 'none' : 'block';
  }
}

function toggleDarkLogo(useSameLogo) {
  const darkLogoSection = document.getElementById('dark-logo-section');
  if (darkLogoSection) {
    darkLogoSection.style.display = useSameLogo ? 'none' : 'block';
  }
}

function toggleFieldset(legend) {
  const fieldset = legend.parentNode;
  // For logo settings, we need to handle multiple content sections
  const contents = fieldset.querySelectorAll('.tabular, .splitcontent, .jira-note-section, .box');
  const isCollapsed = fieldset.classList.contains('collapsed');

  if (isCollapsed) {
    // Expand
    fieldset.classList.remove('collapsed');
    legend.classList.remove('icon-collapsed');
    legend.classList.add('icon-expanded');
    contents.forEach(content => {
      if (content) {
        // Respect the dark logo visibility setting
        if (content.id === 'dark-logo-section') {
          const useSameLogo = document.querySelector('input[name="settings[use_same_logo_for_dark]"]').checked;
          content.style.display = useSameLogo ? 'none' : 'block';
        } else {
          content.style.display = 'block';
        }
      }
    });

    // Update SVG icon direction
    const svg = legend.querySelector('svg use');
    if (svg) svg.setAttribute('href', '/assets/icons-731dc012.svg#icon--angle-down');
  } else {
    // Collapse
    fieldset.classList.add('collapsed');
    legend.classList.remove('icon-expanded');
    legend.classList.add('icon-collapsed');
    contents.forEach(content => {
      if (content) content.style.display = 'none';
    });

    // Update SVG icon direction
    const svg = legend.querySelector('svg use');
    if (svg) svg.setAttribute('href', '/assets/icons-731dc012.svg#icon--angle-right');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Initialize collapsed fieldsets first
  const collapsedFieldsets = document.querySelectorAll('fieldset.collapsed');
  collapsedFieldsets.forEach(function(fieldset) {
    const contents = fieldset.querySelectorAll('.tabular, .splitcontent, .jira-note-section, .box');
    contents.forEach(function(content) {
      if (content) {
        content.style.display = 'none';
      }
    });
  });

  // Dark logo section starts hidden and will be shown only when accordion is expanded
  // and checkbox state allows it (handled in toggleFieldset function)

  const form = document.querySelector('form[action*="/settings/plugin/redmine_jira_theme"]');
  if (form) {
    form.addEventListener('submit', function() {
      form.setAttribute('enctype', 'multipart/form-data');
    });
  }
});