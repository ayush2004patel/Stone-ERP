//              ============== navbar breadcrub ==============

// =======================================================================
//  relocate breadcrub
// =======================================================================
function relocateBreadcrumbs() {
    const sticky = document.querySelector(".sticky-top");
    const header = sticky?.querySelector("header.navbar");
    const breadcrumbs = document.getElementById("navbar-breadcrumbs");

    if (sticky && header && breadcrumbs) {
        // If breadcrumbs are still inside header → move them after header
        if (header.contains(breadcrumbs)) {
            header.after(breadcrumbs);
            console.log("✅ Breadcrumbs moved outside <header> into sticky-top");
        }

        // Always ensure "Modules" is the first <li>
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
            console.log("✅ 'Modules' breadcrumb injected once");
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

            // Watch for re-renders
            const observer = new MutationObserver(relocateBreadcrumbs);
            observer.observe(document.body, { childList: true, subtree: true });
        }
        attempts++;
    }, 200);





});



// =======================================================================
//  hide breadcrub on app/modules page
// =======================================================================

(function () {
    function applyHide() {
        const route = frappe.get_route ? frappe.get_route() : null;
        const isModulesPage = Array.isArray(route) && route[0] === 'modules';
        const bc = document.getElementById('navbar-breadcrumbs');

        console.log("we are in hide navbreadcrub");

        if (!bc) {
            console.log("⏳ #navbar-breadcrumbs not found");
            return;
        }

        if (isModulesPage) {
            bc.classList.add('hide-breadcrumb-force');
            console.log("✅ HIDING breadcrumbs on /modules");
        } else {
            bc.classList.remove('hide-breadcrumb-force');
            console.log("✅ SHOWING breadcrumbs on other routes");
        }
    }

    // Wait until frappe is defined
    function initWhenReady() {
        if (typeof frappe !== "undefined" && frappe.get_route && frappe.router) {
            console.log("🚀 frappe is ready, initializing applyHide...");
            applyHide();

            // React to route changes
            frappe.router.on('change', () => {
                console.log("🔄 Route changed, re-applying hide/show...");
                setTimeout(applyHide, 100);
            });
        } else {
            // Retry after a bit if frappe not ready yet
            setTimeout(initWhenReady, 100);
        }
    }

    // Start waiting for frappe
    document.addEventListener("DOMContentLoaded", initWhenReady);
})();