// logo.js
(function() {
  document.addEventListener("DOMContentLoaded", function() {
    // Remove all h1 elements (page titles)
    document.querySelectorAll("h1").forEach(h1 => h1.remove());

    // Create a logo wrapper
    const logoWrapper = document.createElement("div");
    logoWrapper.id = "custom-logo-section";

    // Helper to create logos from server HTML
    function createLogo(html, className, id) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      const img = tempDiv.querySelector("img");
      if (!img) return null;

      const clone = img.cloneNode(true);
      clone.className = className;
      clone.id = id;
      clone.style.display = ""; // ensure visible
      return clone;
    }

    // Create 4 logo variants
    const webLight   = createLogo(window.PLUGIN_WHITE_LOGO_HTML, "logo-web logo-light",   "plugin-logo-web-light");
    const webDark    = createLogo(window.PLUGIN_BLACK_LOGO_HTML, "logo-web logo-dark",   "plugin-logo-web-dark");
    const mobileLight= createLogo(window.PLUGIN_WHITE_LOGO_HTML, "logo-mobile logo-light","plugin-logo-mobile-light");
    const mobileDark = createLogo(window.PLUGIN_BLACK_LOGO_HTML, "logo-mobile logo-dark","plugin-logo-mobile-dark");

    // Append if exists
    [webLight, webDark, mobileLight, mobileDark].forEach(logo => {
      if (logo) logoWrapper.appendChild(logo);
    });

    // Insert logo section after the header
    const header = document.getElementById("header");
    if (header) {
      header.insertBefore(logoWrapper, header.firstChild);
    }
  });

  document.addEventListener("DOMContentLoaded", function() {
    const logoSection = document.getElementById("custom-logo-section");

    if (logoSection) {
      // Click → Go Home
      logoSection.addEventListener("click", function(e) {
        e.preventDefault();
        window.location.href = window.location.origin;
      });

      // Loading fade-in
      logoSection.style.opacity = "0";
      setTimeout(() => {
        logoSection.style.opacity = "1";
      }, 100);

      // Accessibility
      logoSection.setAttribute("tabindex", "0");
      logoSection.setAttribute("role", "button");
      logoSection.setAttribute("aria-label", "Go to homepage");

      // Keyboard navigation
      logoSection.addEventListener("keydown", function(e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          window.location.href = window.location.origin;
        }
      });
    }

    // Responsive behavior
    function updateLogoLayout() {
      const isMobile = window.innerWidth < 768;
      if (logoSection) {
        if (isMobile) {
          logoSection.classList.add("mobile-layout");
        } else {
          logoSection.classList.remove("mobile-layout");
        }
      }
    }

    // Initial + resize
    updateLogoLayout();
    let resizeTimer;
    window.addEventListener("resize", function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateLogoLayout, 150);
    });
  });
})();