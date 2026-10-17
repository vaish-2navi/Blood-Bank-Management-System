// ================================
// BBMS - BLOOD STOCK
// LOAD REAL DATA FROM API
// ================================

const BLOOD_STOCK_API =
    "http://127.0.0.1:5000";


// ================================
// BLOOD GROUPS
// ================================

const bloodGroups = [
    "A+",
    "A-",
    "B+",
    "B-",
    "O+",
    "O-",
    "AB+",
    "AB-"
];


// ================================
// LOAD BLOOD STOCK
// ================================

async function loadBloodStock() {

    const stockGrid =
        document.getElementById("bloodStockGrid");

    try {

        // ================================
        // GET DATA FROM FLASK API
        // ================================

        const response = await fetch(
            `${BLOOD_STOCK_API}/api/blood-stock`
        );


        const data = await response.json();


        if (!response.ok) {

            stockGrid.innerHTML =
                "<p>Unable to load blood stock.</p>";

            return;
        }


        // ================================
        // STORE STOCK DATA
        // ================================

        const stock =
            data.blood_stock || [];


        // ================================
        // CLEAR LOADING MESSAGE
        // ================================

        stockGrid.innerHTML = "";


        // ================================
        // CREATE 8 BLOOD GROUP CARDS
        // ================================

        bloodGroups.forEach(function(group) {

            let totalUnits = 0;


            stock.forEach(function(item) {

                if (
                    item.blood_group === group &&
                    item.status === "available"
                ) {

                    totalUnits +=
                        Number(item.quantity);

                }

            });


            // Blood group full name

            let groupName = group;


            if (group === "A+") {

                groupName = "A Positive";

            } else if (group === "A-") {

                groupName = "A Negative";

            } else if (group === "B+") {

                groupName = "B Positive";

            } else if (group === "B-") {

                groupName = "B Negative";

            } else if (group === "O+") {

                groupName = "O Positive";

            } else if (group === "O-") {

                groupName = "O Negative";

            } else if (group === "AB+") {

                groupName = "AB Positive";

            } else if (group === "AB-") {

                groupName = "AB Negative";

            }


            // Create card

            const card =
                document.createElement("div");


            card.className =
                "blood-card";


            card.innerHTML = `

                <div class="blood-icon">
                    ${group}
                </div>

                <h3>
                    ${groupName}
                </h3>

                <p>
                    ${totalUnits} Units
                </p>

            `;


            stockGrid.appendChild(card);

        });


        // ================================
        // DISPLAY STOCK DETAILS
        // ================================

        displayStockDetails(stock);


        // ================================
        // SETUP SEARCH & FILTERS
        // ================================

        setupStockFilters(stock);

    }


    catch (error) {

        console.error(error);


        stockGrid.innerHTML =
            "<p>Cannot connect to blood stock server.</p>";

    }

}



// =====================================================
// DISPLAY STOCK DETAILS TABLE
// =====================================================

function displayStockDetails(stockData) {

    const container =
        document.getElementById(
            "stockDetailsContainer"
        );


    if (!container) {

        console.error(
            "stockDetailsContainer not found"
        );

        return;
    }


    // No matching records

    if (stockData.length === 0) {

        container.innerHTML = `

            <p class="no-stock">
                No matching blood stock found.
            </p>

        `;

        return;
    }


    // ================================
    // CREATE TABLE
    // ================================

    let tableHTML = `

        <div class="stock-table-wrapper">

            <table class="stock-table">

                <thead>

                    <tr>

                        <th>
                            Blood Group
                        </th>

                        <th>
                            Component
                        </th>

                        <th>
                            Quantity
                        </th>

                        <th>
                            Expiry Date
                        </th>

                        <th>
                            Storage Location
                        </th>

                        <th>
                            Status
                        </th>

                    </tr>

                </thead>

                <tbody>

    `;


    // ================================
    // ADD STOCK ROWS
    // ================================

    stockData.forEach(function(item) {

        tableHTML += `

            <tr>

                <td>

                    <strong>
                        ${item.blood_group}
                    </strong>

                </td>


                <td>
                    ${item.component_type}
                </td>


                <td>
                    ${item.quantity} Unit
                </td>


                <td>
                    ${item.expiry_date || "-"}
                </td>


                <td>
                    ${item.storage_location || "-"}
                </td>


                <td>

                    <span
                        class="status-badge ${item.status}"
                    >
                        ${item.status}
                    </span>

                </td>

            </tr>

        `;

    });


    // Close table

    tableHTML += `

                </tbody>

            </table>

        </div>

    `;


    container.innerHTML =
        tableHTML;

}



// =====================================================
// SEARCH & FILTER SETUP
// =====================================================

function setupStockFilters(stock) {

    const searchInput =
        document.getElementById(
            "stockSearch"
        );


    const bloodGroupFilter =
        document.getElementById(
            "bloodGroupFilter"
        );


    const componentFilter =
        document.getElementById(
            "componentFilter"
        );


    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    const clearFilters =
        document.getElementById(
            "clearFilters"
        );


    // ================================
    // CHECK FILTER ELEMENTS
    // ================================

    if (
        !searchInput ||
        !bloodGroupFilter ||
        !componentFilter ||
        !statusFilter ||
        !clearFilters
    ) {

        console.error(
            "Blood stock filter elements not found."
        );

        return;
    }


    // ================================
    // APPLY FILTERS
    // ================================

    function applyStockFilters() {

        const searchText =
            searchInput.value
                .toLowerCase()
                .trim();


        const selectedGroup =
            bloodGroupFilter.value;


        const selectedComponent =
            componentFilter.value;


        const selectedStatus =
            statusFilter.value;


        // ================================
        // FILTER STOCK
        // ================================

        const filteredStock =
            stock.filter(function(item) {


                // Search blood group OR location

                const matchesSearch =

                    item.blood_group
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    (item.storage_location || "")
                        .toLowerCase()
                        .includes(searchText);


                // Blood group filter

                const matchesGroup =

                    selectedGroup === "" ||

                    item.blood_group ===
                        selectedGroup;


                // Component filter

                const matchesComponent =

                    selectedComponent === "" ||

                    item.component_type ===
                        selectedComponent;


                // Status filter

                const matchesStatus =

                    selectedStatus === "" ||

                    item.status ===
                        selectedStatus;


                return (

                    matchesSearch &&

                    matchesGroup &&

                    matchesComponent &&

                    matchesStatus

                );

            });


        // ================================
        // DISPLAY FILTERED DATA
        // ================================

        displayStockDetails(
            filteredStock
        );

    }


    // ================================
    // SEARCH EVENT
    // ================================

    searchInput.addEventListener(
        "input",
        applyStockFilters
    );


    // ================================
    // BLOOD GROUP EVENT
    // ================================

    bloodGroupFilter.addEventListener(
        "change",
        applyStockFilters
    );


    // ================================
    // COMPONENT EVENT
    // ================================

    componentFilter.addEventListener(
        "change",
        applyStockFilters
    );


    // ================================
    // STATUS EVENT
    // ================================

    statusFilter.addEventListener(
        "change",
        applyStockFilters
    );


    // ================================
    // CLEAR FILTERS
    // ================================

    clearFilters.addEventListener(
        "click",
        function() {

            searchInput.value = "";

            bloodGroupFilter.value = "";

            componentFilter.value = "";

            statusFilter.value = "";


            displayStockDetails(
                stock
            );

        }
    );

}



// =====================================================
// LOAD PAGE
// =====================================================

loadBloodStock();