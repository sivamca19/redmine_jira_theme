(function($) {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    if (document.body.classList.contains('action-lost_password')) {
      const contentDiv = document.getElementById('content');

      if (contentDiv) {
        // Create wrapper div
        const wrapper = document.createElement('div');
        wrapper.id = 'lost-password-form';

        // Move all children of #content into wrapper
        while (contentDiv.firstChild) {
          wrapper.appendChild(contentDiv.firstChild);
        }

        // Put wrapper back inside #content
        contentDiv.appendChild(wrapper);

        const form = wrapper.querySelector('form');
        if (form) {
          const emailInput = form.querySelector('input[type="email"], input[name="mail"], input[name="email"]');
          const submitBtn = form.querySelector('input[type="submit"], button[type="submit"]');

          if (emailInput && submitBtn) {
            submitBtn.disabled = true; // disable initially

            emailInput.addEventListener('input', function() {
              const emailVal = emailInput.value.trim();
              const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);

              submitBtn.disabled = !valid; // enable only if valid email
            });
          }
        }

        // 🔍 Recursively traverse and clean .box.tabular
        function cleanBoxTabular(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList.contains('box') && node.classList.contains('tabular')) {
              node.classList.remove('box', 'tabular');
            }
            // Visit children
            node.childNodes.forEach(child => cleanBoxTabular(child));
          }
        }

        cleanBoxTabular(wrapper);
      }
    }
  });

})(jQuery);