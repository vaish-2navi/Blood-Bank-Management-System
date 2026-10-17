const API_URL = "http://127.0.0.1:5000";

document.addEventListener("DOMContentLoaded", function () {
    loadHomeBloodStock();
    loadUrgentRequests();
    setupQuickActions();
});


// ========================================
// LOAD BLOOD STOCK
// ========================================

async function loadHomeBloodStock() {

    try {

        const response = await fetch(
            `${API_URL}/api/blood-stock`
        );

        const data = await response.json();

        if (!response.ok || data.status !== "success") {
            console.error("Unable to load blood stock");
            return;
        }

        const stock = data.blood_stock || [];

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

        bloodGroups.forEach(function (group) {

            const totalUnits = stock
                .filter(item => item.blood_group === group)
                .filter(item => item.status === "available")
                .reduce(function (total, item) {
                    return total + Number(item.quantity || 0);
                }, 0);

            updateBloodCard(group, totalUnits);
        });

    } catch (error) {

        console.error(
            "Home blood stock error:",
            error
        );
    }
}


// ========================================
// UPDATE BLOOD CARD
// ========================================

function updateBloodCard(group, units) {

    const cards = document.querySelectorAll(".blood-card");

    cards.forEach(function (card) {

        const icon = card.querySelector(".blood-icon");

        if (!icon) {
            return;
        }

        if (icon.textContent.trim() === group) {

            const quantity = card.querySelector("p");

            if (quantity) {

                quantity.textContent =
                    `${units} ${units === 1 ? "Unit" : "Units"}`;
            }
        }
    });
}


// ========================================
// LOAD URGENT REQUESTS
// ========================================

async function loadUrgentRequests() {

    try {

        const response = await fetch(
            `${API_URL}/api/blood-requests`
        );

        const data = await response.json();

        if (!response.ok || data.status !== "success") {
            console.error("Unable to load blood requests");
            return;
        }

        const requests = data.requests || [];

        const urgentRequests = requests.filter(function (request) {

            return (
                (request.urgency === "urgent" ||
                 request.urgency === "critical") &&
                request.status === "pending"
            );

        });

        displayUrgentRequest(urgentRequests);

    } catch (error) {

        console.error(
            "Urgent request error:",
            error
        );
    }
}


// ========================================
// DISPLAY URGENT REQUEST
// ========================================

function displayUrgentRequest(requests) {

    const section = document.querySelector(
        ".urgent-section"
    );

    if (!section) {
        return;
    }

    const requestCard =
        section.querySelector(".request-card");

    if (!requestCard) {
        return;
    }


    // No urgent request
    if (requests.length === 0) {

        requestCard.innerHTML = `
            <div>
                <h3>No urgent blood requests</h3>
                <p>Currently there are no pending urgent requests.</p>
            </div>
        `;

        return;
    }


    // Show latest urgent request
    const request = requests[0];

    const hospitalName =
        request.hospital_name ||
        "Hospital";

    const urgency =
        (request.urgency || "urgent").toUpperCase();

    requestCard.innerHTML = `

        <div>

            <span class="urgent-badge">
                ${urgency}
            </span>

            <h3>
                ${request.blood_group}
                Blood Required
            </h3>

            <p>
                ${hospitalName}
            </p>

            <p>
                ${request.component_type}
                • ${request.quantity} Unit(s)
            </p>

        </div>

        <button
            onclick="window.location.href='requests.html'"
        >
            View Requests
        </button>

    `;
}


// ========================================
// QUICK ACTIONS
// ========================================

function setupQuickActions() {

    const actionCards =
        document.querySelectorAll(".action-card");

    if (actionCards.length < 4) {
        return;
    }


    // Request Blood
    actionCards[0].onclick = function () {

        window.location.href =
            "requests.html";
    };


    // Donate Blood
    actionCards[1].onclick = function () {

        window.location.href =
            "donate.html";
    };


    // Find Donors
    actionCards[2].onclick = function () {

        alert(
            "Donor search module is not available yet."
        );
    };


    // Check Availability
    actionCards[3].onclick = function () {

        window.location.href =
            "blood-stock.html";
    };
}
function showMessage(action) {
    alert(action + " feature is available.");
}