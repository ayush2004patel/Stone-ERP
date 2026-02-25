(() => {
  // ../baps/baps/public/js/theme_switcher.js
  frappe.provide("frappe.ui");
  frappe.ui.ThemeSwitcher = class CustomThemeSwitcher extends frappe.ui.ThemeSwitcher {
    fetch_themes() {
      return new Promise((resolve) => {
        this.themes = [
          {
            name: "light",
            label: "Frappe Light",
            info: "Light Theme"
          },
          {
            name: "dark",
            label: "Timeless Night",
            info: "Dark Theme"
          },
          {
            name: "automatic",
            label: "Automatic",
            info: "Uses system's theme to switch between light and dark mode"
          },
          {
            name: "baps",
            label: "baps",
            info: "baps Theme"
          }
        ];
        resolve(this.themes);
      });
    }
  };

  // ../baps/baps/public/js/login.bundle.js
  var eyeSVG = `
<svg class="icon-eye" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M15.0007 12C15.0007 13.6569 13.6576 15 12.0007 15C10.3439 15 9.00073 13.6569 9.00073 12C9.00073 10.3431 10.3439 9 12.0007 9C13.6576 9 15.0007 10.3431 15.0007 12Z" stroke="gray" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12.0012 5C7.52354 5 3.73326 7.94288 2.45898 12C3.73324 16.0571 7.52354 19 12.0012 19C16.4788 19 20.2691 16.0571 21.5434 12C20.2691 7.94291 16.4788 5 12.0012 5Z" stroke="gray" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;
  var eyeSlashSVG = `
<svg class="icon-eye-slash" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5" stroke="gray" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;
  function addCustomPasswordToggle(input) {
    console.log("in login file : in custom toggle funton");
    if (input.parentNode.querySelector(".custom-toggle-password"))
      return;
    const wrapper = input.parentNode;
    const button = document.createElement("span");
    button.classList.add("custom-toggle-password");
    button.style.cursor = "pointer";
    button.style.marginLeft = "8px";
    button.innerHTML = eyeSlashSVG;
    wrapper.appendChild(button);
    console.log("in login file : apped");
    button.addEventListener("click", () => {
      if (input.type === "password") {
        input.type = "text";
        button.innerHTML = eyeSVG;
      } else {
        input.type = "password";
        button.innerHTML = eyeSlashSVG;
      }
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
    const style = document.createElement("style");
    style.innerHTML = `
    .toggle-password { display: none !important; }
    .custom-toggle-password svg {
      vertical-align: middle;
    }
  `;
    document.head.appendChild(style);
    document.querySelectorAll('input[type="password"]').forEach(addCustomPasswordToggle);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          var _a;
          if (node.nodeType === 1) {
            if (node.matches('input[type="password"]')) {
              addCustomPasswordToggle(node);
            } else {
              const inputs = ((_a = node.querySelectorAll) == null ? void 0 : _a.call(node, 'input[type="password"]')) || [];
              inputs.forEach(addCustomPasswordToggle);
            }
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });

  // ../baps/baps/public/js/customJs.bundle.js
  document.addEventListener("DOMContentLoaded", function() {
    function initSlidingTabs(ul) {
      if (!ul || ul.dataset.slidingTabsInitialized)
        return;
      ul.dataset.slidingTabsInitialized = "1";
      ul.style.position = ul.style.position || "relative";
      const bar = document.createElement("div");
      bar.className = "sliding-tab-bar";
      Object.assign(bar.style, {
        position: "absolute",
        bottom: "0",
        height: "4px",
        background: "orange",
        borderRadius: "1em 1em 0em 0em",
        transition: "transform 200ms ease, width 200ms ease",
        left: "0",
        width: "0",
        zIndex: "1",
        pointerEvents: "none"
      });
      ul.appendChild(bar);
      console.log("tab active slideer insterd");
      const update = () => {
        const active = ul.querySelector(".nav-link.active") || ul.querySelector(".nav-link");
        if (!active)
          return;
        const linkRect = active.getBoundingClientRect();
        const ulRect = ul.getBoundingClientRect();
        const left = linkRect.left - ulRect.left + ul.scrollLeft;
        bar.style.width = linkRect.width + "px";
        bar.style.transform = `translateX(${left}px)`;
      };
      ul.addEventListener("click", (e) => {
        const link = e.target.closest(".nav-link");
        if (link && ul.contains(link)) {
          setTimeout(update, 150);
        }
      });
      window.addEventListener("resize", update);
      const mo = new MutationObserver(() => update());
      mo.observe(ul, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
      setTimeout(update, 0);
    }
    function scanAndInit() {
      document.querySelectorAll("ul.form-tabs, ul.nav-tabs, #form-tabs").forEach(initSlidingTabs);
    }
    scanAndInit();
    const bodyObserver = new MutationObserver(() => scanAndInit());
    bodyObserver.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", (e) => {
      if (e.target.closest('a[data-toggle="tab"], a[data-bs-toggle="tab"]')) {
        setTimeout(scanAndInit, 200);
      }
    });
  });
  document.addEventListener("DOMContentLoaded", function() {
    console.log("Awesomplete shift start");
    const observer = new MutationObserver(() => {
      const activeInput = document.querySelector(
        ".form-grid .awesomplete input:focus[aria-owns]"
      );
      if (activeInput) {
        const listId = activeInput.getAttribute("aria-owns");
        const list = document.getElementById(listId);
        if (list) {
          console.log("Focused input:", activeInput.dataset.fieldname, activeInput);
          console.log("Dropdown list:", listId, list);
          if (!list.dataset.shifted) {
            list.dataset.shifted = "1";
            document.body.appendChild(list);
            list.style.position = "absolute";
            list.style.background = "white";
            list.style.width = "350px";
            list.style.border = "1.4px solid whitesmoke";
            list.style.zIndex = "9999";
            list.hidden = false;
          }
          const rect = activeInput.getBoundingClientRect();
          list.style.top = rect.bottom + window.scrollY + "px";
          list.style.left = rect.left + window.scrollX + "px";
          list.style.width = rect.width + "px";
        }
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });

  // ../baps/baps/public/js/breadcrubOverride.js
  function relocateBreadcrumbs() {
    const sticky = document.querySelector(".sticky-top");
    const header = sticky == null ? void 0 : sticky.querySelector("header.navbar");
    const breadcrumbs = document.getElementById("navbar-breadcrumbs");
    if (sticky && header && breadcrumbs) {
      if (header.contains(breadcrumbs)) {
        header.after(breadcrumbs);
        console.log("\u2705 Breadcrumbs moved outside <header> into sticky-top");
      }
      const firstLi = breadcrumbs.querySelector("li:first-child a");
      if (!firstLi || firstLi.getAttribute("href") !== "/app/modules") {
        const modulesLink = document.createElement("a");
        modulesLink.href = "/app/modules";
        modulesLink.textContent = "Modules";
        modulesLink.classList.add("navbar-breadcrumb-link");
        modulesLink.style.cursor = "pointer";
        modulesLink.style.fontWeight = "600";
        modulesLink.style.textDecoration = "none";
        const li = document.createElement("li");
        li.appendChild(modulesLink);
        breadcrumbs.insertBefore(li, breadcrumbs.firstChild || null);
        console.log("\u2705 'Modules' breadcrumb injected once");
      }
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    let attempts = 0;
    const timer = setInterval(() => {
      const bc = document.getElementById("navbar-breadcrumbs");
      if (bc || attempts > 20) {
        clearInterval(timer);
        relocateBreadcrumbs();
        const observer = new MutationObserver(relocateBreadcrumbs);
        observer.observe(document.body, { childList: true, subtree: true });
      }
      attempts++;
    }, 200);
  });
  (function() {
    function applyHide() {
      const route = frappe.get_route ? frappe.get_route() : null;
      const isModulesPage = Array.isArray(route) && route[0] === "modules";
      const bc = document.getElementById("navbar-breadcrumbs");
      console.log("we are in hide navbreadcrub");
      if (!bc) {
        console.log("\u23F3 #navbar-breadcrumbs not found");
        return;
      }
      if (isModulesPage) {
        bc.classList.add("hide-breadcrumb-force");
        console.log("\u2705 HIDING breadcrumbs on /modules");
      } else {
        bc.classList.remove("hide-breadcrumb-force");
        console.log("\u2705 SHOWING breadcrumbs on other routes");
      }
    }
    function initWhenReady() {
      if (typeof frappe !== "undefined" && frappe.get_route && frappe.router) {
        console.log("\u{1F680} frappe is ready, initializing applyHide...");
        applyHide();
        frappe.router.on("change", () => {
          console.log("\u{1F504} Route changed, re-applying hide/show...");
          setTimeout(applyHide, 100);
        });
      } else {
        setTimeout(initWhenReady, 100);
      }
    }
    document.addEventListener("DOMContentLoaded", initWhenReady);
  })();

  // ../baps/baps/public/js/awsomeDropDownTable.js
  $(document).on("awesomplete-open", function() {
    const input = document.activeElement;
    if (!input || !input.className.includes("awesomplete"))
      return;
    const dropdown = document.querySelector(".awesomplete ul");
    if (!dropdown)
      return;
    const rect = input.getBoundingClientRect();
    const gridBody = input.closest(".grid-body") || input.closest(".form-grid-container");
    const scrollTop = gridBody ? gridBody.scrollTop : window.pageYOffset;
    Object.assign(dropdown.style, {
      position: "absolute",
      top: `${rect.bottom + scrollTop}px`,
      left: `${rect.left + window.scrollX}px`,
      width: `${rect.width}px`,
      zIndex: "9999",
      maxHeight: "280px",
      overflowY: "auto",
      background: "#fff",
      border: "1px solid var(--border-color, #e5e7eb)",
      borderRadius: "0.5rem",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      boxSizing: "border-box",
      padding: "4px 0"
    });
    if (dropdown.parentNode !== document.body) {
      document.body.appendChild(dropdown);
    }
    dropdown.querySelectorAll("p").forEach((li) => {
      Object.assign(li.style, {
        padding: "6px 10px",
        fontSize: "13px",
        cursor: "pointer",
        borderRadius: "4px",
        transition: "background 0.2s ease"
      });
      li.addEventListener("mouseenter", () => {
        li.style.background = "var(--gray-100, #f3f4f6)";
      });
      li.addEventListener("mouseleave", () => {
        li.style.background = "transparent";
      });
    });
  });
})();
//# sourceMappingURL=theme.bundle.I57YN77W.js.map
