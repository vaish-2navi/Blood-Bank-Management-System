
const REPORTS_API_URL = "http://127.0.0.1:5000";

let currentReportData = null;

document.addEventListener("DOMContentLoaded", () => {
    loadAdminReports(false);

    const refreshButton = document.getElementById("refreshButton");
    const downloadButton = document.getElementById("downloadButton");

    if (refreshButton) {
        refreshButton.addEventListener("click", async () => {
            refreshButton.disabled = true;
            refreshButton.textContent = "Refreshing...";

            try {
                await loadAdminReports(true);
            } finally {
                refreshButton.disabled = false;
                refreshButton.textContent = "Refresh Report";
            }
        });
    }

    if (downloadButton) {
        downloadButton.addEventListener("click", downloadReportCSV);
    }

    const backButton = document.getElementById("backButton");

    if (backButton) {
        backButton.addEventListener("click", () => {
            window.location.href = "admin-dashboard.html";
        });
    }
});

async function loadAdminReports(showMessage = false) {
    const message = document.getElementById("reportMessage");
    if (message) {
    message.textContent = "";
}
    const tableBody = document.getElementById("inventoryReportBody");

    try {
        const response = await fetch(
            `${REPORTS_API_URL}/api/admin/reports`,
            { cache: "no-store", credentials: "include" }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Reports could not be loaded.");
        }

        currentReportData = data;

        document.getElementById("totalDonors").textContent =
            data.summary.totalDonors ?? 0;
        document.getElementById("totalUnits").textContent =
            data.summary.totalUnits ?? 0;
        document.getElementById("pendingRequests").textContent =
            data.summary.pendingRequests ?? 0;
        document.getElementById("totalDonations").textContent =
            data.summary.totalDonations ?? 0;

        tableBody.replaceChildren();

        if (!data.inventory || data.inventory.length === 0) {
            const row = tableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 6;
            cell.textContent = "No available blood stock found.";
        } else {
            data.inventory.forEach(item => {
                const row = tableBody.insertRow();

                [
                    item.blood_group,
                    item.component_type,
                    item.quantity,
                    item.expiry_date || "N/A",
                    item.storage_location || "Not specified",
                    item.status || "Available"
                ].forEach(value => {
                    const cell = row.insertCell();
                    cell.textContent = value ?? "N/A";
                });
            });
        }

      if (message && showMessage) {
    message.textContent = "Report loaded successfully.";
}
    } catch (error) {
        console.error("Admin reports error:", error);

        if (message) {
            message.textContent = "Could not load reports. Check backend and login.";
        }

        if (tableBody) {
            tableBody.replaceChildren();
            const row = tableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 6;
            cell.textContent = "Could not load reports.";
        }
    }
}

function downloadReportCSV() {
    if (!currentReportData) {
        alert("Please load the report before downloading.");
        return;
    }

    const summary = currentReportData.summary;
    const inventory = currentReportData.inventory || [];

    const rows = [
        ["Blood Bank Management System - Admin Report"],
        [],
        ["Report Summary"],
        ["Total Donors", summary.totalDonors ?? 0],
        ["Total Blood Units", summary.totalUnits ?? 0],
        ["Pending Requests", summary.pendingRequests ?? 0],
        ["Total Donations", summary.totalDonations ?? 0],
        [],
        [
            "Blood Group",
            "Component",
            "Available Units",
            "Nearest Expiry",
            "Storage Location",
            "Status"
        ],
        ...inventory.map(item => [
            item.blood_group,
            item.component_type,
            item.quantity,
            item.expiry_date || "N/A",
            item.storage_location || "Not specified",
            item.status || "Available"
        ])
    ];

    const escapeCSV = value => {
        const text = String(value ?? "");
        return `"${text.replace(/"/g, '""')}"`;
    };

    const csv = "\uFEFF" + rows
        .map(row => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "BBMS_Admin_Report.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}
