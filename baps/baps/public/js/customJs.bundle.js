// // function removePageTItles(){
// //   const  pageTitle = document.querySelector(".page-title");
// //     // Start observing changes in the body subtree
// //   observer.observe(document.body, {
// //     childList: true,
// //     subtree: true,
// //   });

// // }
// // document.addEventListener("DOMContentLoaded", movePageHeadContent);

// // sliding active bar for ERPNext form tabs (no frappe.ready)



// // from-tab sliding effect

// document.addEventListener('DOMContentLoaded', function () {
//   function initSlidingTabs(ul) {
//     if (!ul || ul.dataset.slidingTabsInitialized) return;
//     ul.dataset.slidingTabsInitialized = '1';
//     ul.style.position = ul.style.position || 'relative';

//     // create the highlight bar
//     const bar = document.createElement('div');
//     bar.className = 'sliding-tab-bar';
//     Object.assign(bar.style, {
//       position: 'absolute',
//       bottom: '0',
//       height: '4px',
//       background: 'var(--_primary-bg-color)',
//       borderRadius: '1em 1em 0em 0em',
//       transition: 'transform 200ms ease, width 200ms ease',
//       left: '0',
//       width: '0',
//       zIndex: '1',
//       pointerEvents: 'none'
//     });
//     ul.appendChild(bar);

//     const update = () => {
//       const active =
//         ul.querySelector('.nav-link.active') ||
//         ul.querySelector('.nav-link');
//       if (!active) return;
//       const linkRect = active.getBoundingClientRect();
//       const ulRect = ul.getBoundingClientRect();
//       const left = linkRect.left - ulRect.left + ul.scrollLeft;
//       bar.style.width = linkRect.width + 'px';
//       bar.style.transform = `translateX(${left}px)`;
//     };

//     // update on clicks (wait for bootstrap to toggle .active)
//     ul.addEventListener('click', (e) => {
//       const link = e.target.closest('.nav-link');
//       if (link && ul.contains(link)) {
//         setTimeout(update, 150);
//       }
//     });

//     // update on resize
//     window.addEventListener('resize', update);

//     // observe active class changes & DOM changes inside the tabs
//     const mo = new MutationObserver(() => update());
//     mo.observe(ul, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });

//     // initial position
//     setTimeout(update, 0);
//   }

//   function scanAndInit() {
//     document.querySelectorAll('ul.form-tabs, ul.nav-tabs, #form-tabs').forEach(initSlidingTabs);
//   }

//   // initial scan
//   scanAndInit();

//   // ERPNext desk is SPA-like; watch for new forms/tabs injected later
//   const bodyObserver = new MutationObserver(() => scanAndInit());
//   bodyObserver.observe(document.body, { childList: true, subtree: true });

//   // also rescan after Bootstrap tab show (BS4/BS5 attribute variants)
//   document.addEventListener('click', (e) => {
//     if (e.target.closest('a[data-toggle="tab"], a[data-bs-toggle="tab"]')) {
//       setTimeout(scanAndInit, 200);
//     }
//   });
// });







// // from-tab sliding effect

// document.addEventListener('DOMContentLoaded', function () {
//   function initSlidingTabs(ul) {
//     if (!ul || ul.dataset.slidingTabsInitialized) return;
//     ul.dataset.slidingTabsInitialized = '1';
//     ul.style.position = ul.style.position || 'relative';

//     // create the highlight bar
//     const bar = document.createElement('div');
//     bar.className = 'sliding-tab-bar';
//     Object.assign(bar.style, {
//       position: 'absolute',
//       bottom: '0',
//       height: '4px',
//       background: 'var(--_primary-bg-color)',
//       borderRadius: '1em 1em 0em 0em',
//       transition: 'transform 200ms ease, width 200ms ease',
//       left: '0',
//       width: '0',
//       zIndex: '1',
//       pointerEvents: 'none'
//     });
//     ul.appendChild(bar);

//     const update = () => {
//       const active =
//         ul.querySelector('.nav-link.active') ||
//         ul.querySelector('.nav-link');
//       if (!active) return;
//       const linkRect = active.getBoundingClientRect();
//       const ulRect = ul.getBoundingClientRect();
//       const left = linkRect.left - ulRect.left + ul.scrollLeft;
//       bar.style.width = linkRect.width + 'px';
//       bar.style.transform = `translateX(${left}px)`;
//     };

//     // update on clicks (wait for bootstrap to toggle .active)
//     ul.addEventListener('click', (e) => {
//       const link = e.target.closest('.nav-link');
//       if (link && ul.contains(link)) {
//         setTimeout(update, 150);
//       }
//     });

//     // update on resize
//     window.addEventListener('resize', update);

//     // observe active class changes & DOM changes inside the tabs
//     const mo = new MutationObserver(() => update());
//     mo.observe(ul, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });

//     // initial position
//     setTimeout(update, 0);
//   }

//   function scanAndInit() {
//     document.querySelectorAll('ul.form-tabs, ul.nav-tabs, #form-tabs').forEach(initSlidingTabs);
//   }

//   // initial scan
//   scanAndInit();

//   // ERPNext desk is SPA-like; watch for new forms/tabs injected later
//   const bodyObserver = new MutationObserver(() => scanAndInit());
//   bodyObserver.observe(document.body, { childList: true, subtree: true });

//   // also rescan after Bootstrap tab show (BS4/BS5 attribute variants)
//   document.addEventListener('click', (e) => {
//     if (e.target.closest('a[data-toggle="tab"], a[data-bs-toggle="tab"]')) {
//       setTimeout(scanAndInit, 200);
//     }
//   });
// });


// // 

// // sidebar false
// document.addEventListener("DOMContentLoaded", function () {
//   const sidebar = document.querySelector(".sidebar"); // your sidebar element
//   const toggleBtn = document.querySelector(".sidebar-toggle-btn");
//   const toggleIcon = toggleBtn.querySelector(".sidebar-toggle-icon use");

//   // ✅ Collapse by default
//   sidebar.classList.add("collapsed");
//   toggleIcon.setAttribute("href", "#es-line-sidebar-expand");

//   // ✅ Toggle on click
//   toggleBtn.addEventListener("click", function () {
//     if (sidebar.classList.contains("collapsed")) {
//       // Expand
//       sidebar.classList.remove("collapsed");
//       toggleIcon.setAttribute("href", "#es-line-sidebar-collapse");
//       console.log("collapsed sidebar")
//     } else {
//       // Collapse
//       sidebar.classList.add("collapsed");
//       toggleIcon.setAttribute("href", "#es-line-sidebar-expand");
//       console.log("expand  sidebar")

//     }
//   });
// });



// function removePageTItles(){
//   const  pageTitle = document.querySelector(".page-title");
//     // Start observing changes in the body subtree
//   observer.observe(document.body, {
//     childList: true,
//     subtree: true,
//   });

// }
// document.addEventListener("DOMContentLoaded", movePageHeadContent);

// sliding active bar for ERPNext form tabs (no frappe.ready)



// from-tab sliding effect

document.addEventListener('DOMContentLoaded', function () {
  function initSlidingTabs(ul) {
    if (!ul || ul.dataset.slidingTabsInitialized) return;
    ul.dataset.slidingTabsInitialized = '1';
    ul.style.position = ul.style.position || 'relative';

    // create the highlight bar
    const bar = document.createElement('div');
    bar.className = 'sliding-tab-bar';
    Object.assign(bar.style, {
      position: 'absolute',
      bottom: '0',
      height: '4px',
      background: 'orange',
      borderRadius: '1em 1em 0em 0em',
      transition: 'transform 200ms ease, width 200ms ease',
      left: '0',
      width: '0',
      zIndex: '1',
      pointerEvents: 'none'
    });
    ul.appendChild(bar);
    console.log("tab active slideer insterd")

    const update = () => {
      const active =
        ul.querySelector('.nav-link.active') ||
        ul.querySelector('.nav-link');
      if (!active) return;
      const linkRect = active.getBoundingClientRect();
      const ulRect = ul.getBoundingClientRect();
      const left = linkRect.left - ulRect.left + ul.scrollLeft;
      bar.style.width = linkRect.width + 'px';
      bar.style.transform = `translateX(${left}px)`;
    };

    // update on clicks (wait for bootstrap to toggle .active)
    ul.addEventListener('click', (e) => {
      const link = e.target.closest('.nav-link');
      if (link && ul.contains(link)) {
        setTimeout(update, 150);
      }
    });

    // update on resize
    window.addEventListener('resize', update);

    // observe active class changes & DOM changes inside the tabs
    const mo = new MutationObserver(() => update());
    mo.observe(ul, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });

    // initial position
    setTimeout(update, 0);
  }

  function scanAndInit() {
    document.querySelectorAll('ul.form-tabs, ul.nav-tabs, #form-tabs').forEach(initSlidingTabs);
  }

  // initial scan
  scanAndInit();

  // ERPNext desk is SPA-like; watch for new forms/tabs injected later
  const bodyObserver = new MutationObserver(() => scanAndInit());
  bodyObserver.observe(document.body, { childList: true, subtree: true });

  // also rescan after Bootstrap tab show (BS4/BS5 attribute variants)
  document.addEventListener('click', (e) => {
    if (e.target.closest('a[data-toggle="tab"], a[data-bs-toggle="tab"]')) {
      setTimeout(scanAndInit, 200);
    }
  });
});



//  login password

// document.addEventListener("DOMContentLoaded", () => {
//     const injectToggle = (input) => {
//         // avoid duplicate injection
//         if (input.parentNode.querySelector(".toggle-password")) return;

//         let toggle = document.createElement("div");
//         toggle.classList.add("toggle-password");
//         toggle.innerHTML = `
//             <svg class="icon icon-sm" aria-hidden="true">
//                 <use href="#icon-unhide"></use>
//             </svg>
//         `;

//         // style position relative so we can absolutely position the icon
//         input.parentNode.style.position = "relative";
//         toggle.style.position = "absolute";
//         toggle.style.right = "10px";
//         toggle.style.top = "50%";
//         toggle.style.transform = "translateY(-50%)";
//         toggle.style.cursor = "pointer";

//         input.parentNode.appendChild(toggle);

//         // toggle logic
//         toggle.addEventListener("click", () => {
//             if (input.type === "password") {
//                 input.type = "text";
//                 toggle.querySelector("use").setAttribute("href", "#icon-hide");
//             } else {
//                 input.type = "password";
//                 toggle.querySelector("use").setAttribute("href", "#icon-unhide");
//             }
//         });
//     };

//     // Initial injection
//     document.querySelectorAll('input[type="password"]').forEach(injectToggle);

//     // Observe for dynamically added inputs
//     const observer = new MutationObserver((mutations) => {
//         mutations.forEach((mutation) => {
//             mutation.addedNodes.forEach((node) => {
//                 if (node.nodeType === 1) {
//                     // direct input
//                     if (node.matches?.('input[type="password"]')) {
//                         injectToggle(node);
//                     }
//                     // nested inputs inside added container
//                     node.querySelectorAll?.('input[type="password"]').forEach(injectToggle);
//                 }
//             });
//         });
//     });

//     observer.observe(document.body, { childList: true, subtree: true });
// });


//     // Initial injection

//     // Observe for dynamically added inputs
//     const observer = new MutationObserver((mutations) => {
//         mutations.forEach((mutation) => {
//             mutation.addedNodes.forEach((node) => {
//                 if (node.nodeType === 1) {
//                     // direct input
//                     if (node.matches?.('input[type="password"]')) {
//                         injectToggle(node);
//                     }
//                     // nested inputs inside added container
//                     node.querySelectorAll?.('input[type="password"]').forEach(injectToggle);
//                 }
//             });
//         });
//     });

//     observer.observe(document.body, { childList: true, subtree: true });



    

// 
document.addEventListener("DOMContentLoaded", function () {
  console.log("Awesomplete shift start");

  const observer = new MutationObserver(() => {
    // find focused input inside form-grid that has awesomplete
    const activeInput = document.querySelector(
      '.form-grid .awesomplete input:focus[aria-owns]'
    );

    if (activeInput) {
      const listId = activeInput.getAttribute("aria-owns");
      const list = document.getElementById(listId);

      if (list) {
        console.log("Focused input:", activeInput.dataset.fieldname, activeInput);
        console.log("Dropdown list:", listId, list);

        // move list to <body> so it's not clipped by table/grid
        if (!list.dataset.shifted) {
          list.dataset.shifted = "1"; 
          document.body.appendChild(list);

          // reset base styles
          list.style.position = "absolute";
          list.style.background= "white";
          list.style.width="350px"
          list.style.border="1.4px solid whitesmoke"
          list.style.zIndex = "9999"; // ensure it's above form
          list.hidden = false;
        }

        // always recalc position relative to input
        const rect = activeInput.getBoundingClientRect();
        list.style.top = rect.bottom + window.scrollY + "px";
        list.style.left = rect.left + window.scrollX + "px";
        list.style.width = rect.width + "px";
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
});


// document.addEventListener("DOMContentLoaded", function () {
//   console.log("Awesomplete shift start");

//   const observer = new MutationObserver(() => {
//     // only pick lists inside form-grid
//     const list = document.querySelector(
//       '.form-grid .scrollable-xx-xxxx ul[id^="awesomplete_list_"]:not([data-shifted])'
//     );
//     const target = document.querySelector('.form-grid .scrollable-xx-xxxx');

//     if (list && target) {
//       list.dataset.shifted = "1"; // mark so we don't move twice
//       target.appendChild(list);

//       // reset styles
//       list.style.position = "absolute";
//       list.style.top = "100%";  // default below input
//       list.style.left = "0";
//       list.style.width = "250px"; // force width if needed
//       list.hidden = false;

//       console.log("Awesomplete shifted (form-grid only)");

//       // Reposition near the active input inside form-grid
//       const activeInput = target.querySelector(".awesomplete input:focus");
//       if (activeInput) {
//         const rect = activeInput.getBoundingClientRect();
//         const gridRect = target.getBoundingClientRect();
//         list.style.top = rect.bottom - gridRect.top + "px";
//         list.style.left = rect.left - gridRect.left + "px";
//         list.style.width = rect.width + "px";
//       }
//     }
//   });

//   observer.observe(document.body, {
//     childList: true,
//     subtree: true,
//   });
// });


// const module_API_ROUTE1 = `/api/method/baps.api.login_api_userwise.login_with_permissions1?usr=Administrator&pwd=12345`;

// fetch(module_API_ROUTE1, {
//     method: "GET",
//     credentials: "include"
// })
//     .then(r => r.json())
//     .then(data => {
//         console.log("Modules API Response:", data);
//     })
//     .catch(err => {
//         console.error("Modules API Error:", err);
//     });