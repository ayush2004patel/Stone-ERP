frappe.pages['modules'].on_page_load = function (wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        // title: 'API',
        single_column: true
    });

$('<style>.page-modules #navbar-breadcrumbs { display: none !important; }</style>').appendTo('head');

    const module_API_ROUTE = `/api/method/baps.api.login_api.login_with_permissions`;

    // Container for modules grid
    let container = $(`
        <div class="container mt-4">
            <div class="d-flex align-content-start flex-wrap" style="gap:20px" id="modules-container"></div>
        </div>
    `).appendTo(page.body);

    console.log("Fetching modules from API...");

    fetch(module_API_ROUTE, {
        method: "GET",
        credentials: "include"
    })
        .then(r => r.json())
        .then(data => {
            console.log("Modules API Response:", data);

            let modules = data.message ? data.message.modules : data.modules;

            if (modules && modules.length) {
                let moduleContainer = $("#modules-container");

                modules.forEach(mod => {
                    let modName = mod.label || mod.name;
                    let modIcon = mod.icon ;  // matches #icon-cube in Frappe
                    let modRoute = mod.route || `/${mod.name}`;
					// add this new cmt

                    // Create module card (like app selector)
                    let card = $(`
                        <div class="w-100px">
                            <div class=" rounded card app-card text-center h-100 w-100 border-0" style="cursor:pointer;">
                                <div class="card-body  d-flex flex-column align-items-center justify-content-center p-3">
                                    <span class=" sidebar-item-icon module-icon mb-2" item-icon="${modIcon}">
                                        <svg class="icon icon-xl" aria-hidden="true">
                                            <use href="#icon-${modIcon}"></use>
                                        </svg>
                                    </span>
                                    <div class="app-title fw-medium text-wrap-custom">${modName}</div>
                                </div>
                            </div>
                        </div>
                    `);

                    // click → navigate
                    card.on("click", function () {
                        if (modRoute) {
                            frappe.set_route(modRoute);
                        }
                    });

                    moduleContainer.append(card);
                });
            } else {
                $("#modules-container").html("<p class='text-muted'>No modules available</p>");
            }

            
        })
        .catch(err => {
            console.error("Error fetching modules:", err);
            $("#modules-container").html("<p class='text-danger'>Failed to load modules</p>");
        });
};