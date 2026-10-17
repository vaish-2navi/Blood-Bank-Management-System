
const DONATION_API_URL = "http://127.0.0.1:5000";

let allDonations = [];

document.addEventListener("DOMContentLoaded", async () => {
    const userData = localStorage.getItem("bbmsUser");

    if (!userData) {
        window.location.href = "login.html";
        return;
    }

    let user;

    try {
        user = JSON.parse(userData);
    } catch {
        localStorage.removeItem("bbmsUser");
        window.location.href = "login.html";
        return;
    }

    if (user.role !== "donor") {
        alert("Access denied. This page is only for donors.");
        window.location.href = "role-dashboard.html";
        return;
    }

    document.getElementById("historySearch")
        .addEventListener("input", renderDonationHistory);

    document.getElementById("historyBloodGroup")
        .addEventListener("change", renderDonationHistory);

    document.getElementById("historyComponent")
        .addEventListener("change", renderDonationHistory);

    document.getElementById("historyStatus")
        .addEventListener("change", renderDonationHistory);

    await loadDonationHistory(user.user_id);
});

async function loadDonationHistory(userId) {
    const container = document.getElementById("donationHistory");

    try {
        const response = await fetch(
            `${DONATION_API_URL}/api/donations/${userId}`,
            { credentials: "include" }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to load donation history."
            );
        }

        allDonations = Array.isArray(result.donations)
            ? result.donations
            : [];

        updateSummary();
        renderDonationHistory();
    } catch (error) {
        console.error("Donation history error:", error);
        container.replaceChildren();

        const message = document.createElement("div");
        message.className = "history-message";
        message.textContent = error.message || "Unable to connect to the server.";
        container.appendChild(message);
    }
}

function updateSummary() {
    const totalUnits = allDonations.reduce(
        (sum, donation) => sum + (Number(donation.quantity) || 0),
        0
    );

    const passedCount = allDonations.filter(
        donation =>
            String(donation.health_check_status || "").toLowerCase() === "passed"
    ).length;

    document.getElementById("historyTotalDonations").textContent =
        allDonations.length;

    document.getElementById("historyTotalUnits").textContent = totalUnits;

    document.getElementById("historyPassed").textContent = passedCount;
}

function renderDonationHistory() {
    const container = document.getElementById("donationHistory");
    const search = document.getElementById("historySearch")
        .value.trim().toLowerCase();
    const bloodGroup = document.getElementById("historyBloodGroup").value;
    const component = document.getElementById("historyComponent").value;
    const status = document.getElementById("historyStatus").value.toLowerCase();

    const filtered = allDonations.filter(donation => {
        const group = String(donation.blood_group || "");
        const type = String(donation.component_type || "");
        const healthStatus = String(
            donation.health_check_status || ""
        ).toLowerCase();
        const remarks = String(donation.remarks || "");

        const matchesSearch =
            `${group} ${type} ${remarks}`.toLowerCase().includes(search);

        return (
            matchesSearch &&
            (!bloodGroup || group === bloodGroup) &&
            (!component || type === component) &&
            (!status || healthStatus === status)
        );
    });

    container.replaceChildren();

    if (filtered.length === 0) {
        const empty = document.createElement("div");
        empty.className = "history-message";
        empty.textContent = allDonations.length
            ? "No donations match your search or filters."
            : "No donation history found.";
        container.appendChild(empty);
        return;
    }

    filtered.forEach(donation => {
        const card = document.createElement("article");
        card.className = "donation-card";

        const heading = document.createElement("h3");
        heading.textContent =
            `${donation.blood_group || "N/A"} - ${donation.component_type || "N/A"}`;

        const date = document.createElement("div");
        date.className = "donation-date";
        date.textContent = `Donation Date: ${formatDate(donation.donation_date)}`;

        const details = document.createElement("div");
        details.className = "donation-details";

        addDetail(details, "Quantity", `${donation.quantity ?? 0} unit(s)`);

        const statusLabel = document.createElement("div");
        statusLabel.className = "donation-detail";

        const label = document.createElement("span");
        label.textContent = "Health Check";

        const badge = document.createElement("span");
        const healthStatus = String(
            donation.health_check_status || "pending"
        ).toLowerCase();

        badge.className = `status-badge status-${healthStatus}`;
        badge.textContent = healthStatus;

        statusLabel.append(label, badge);
        details.appendChild(statusLabel);

        const remarks = document.createElement("div");
        remarks.className = "donation-remarks";
        remarks.textContent = `Remarks: ${donation.remarks || "None"}`;

        card.append(heading, date, details, remarks);
        container.appendChild(card);
    });
}

function addDetail(container, labelText, valueText) {
    const row = document.createElement("div");
    row.className = "donation-detail";

    const label = document.createElement("span");
    label.textContent = labelText;

    const value = document.createElement("span");
    value.textContent = valueText;

    row.append(label, value);
    container.appendChild(row);
}

function formatDate(value) {
    if (!value) return "N/A";

    const datePart = String(value).slice(0, 10);
    const parts = datePart.split("-");

    if (parts.length !== 3) return datePart;

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}
