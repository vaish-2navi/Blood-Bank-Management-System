
const ISSUE_API_URL = "http://127.0.0.1:5000/api/blood-issues";

async function loadIssueHistory() {
    const message = document.getElementById("issueMessage");
    const table = document.getElementById("issueTable");
    const tableBody = document.getElementById("issueTableBody");

    message.hidden = false;
    message.textContent = "Loading issue history...";
    table.hidden = true;
    tableBody.replaceChildren();

    try {
        const response = await fetch(ISSUE_API_URL, {
    method: "GET",
    credentials: "include"
});
        const data = await response.json();

        if (!response.ok || data.status !== "success") {
            throw new Error(data.message || "Unable to load issue history.");
        }

        const records = data.issue_records || [];
        let totalQuantity = 0;

        records.forEach(record => {
            totalQuantity += Number(record.quantity) || 0;

            const row = document.createElement("tr");

            const values = [
                record.issue_id,
                record.request_id,
                record.blood_group,
                record.component_type,
                record.quantity,
                record.blood_unit_id,
                record.issued_by,
                record.issue_date
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "—";
                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });

        document.getElementById("totalIssues").textContent = records.length;
        document.getElementById("totalQuantity").textContent = totalQuantity;

        if (records.length === 0) {
            message.textContent = "No blood issue records found.";
            return;
        }

        message.hidden = true;
        table.hidden = false;

    } catch (error) {
        console.error("Issue history error:", error);
        message.textContent =
            "Unable to load issue history. Check that the Flask backend is running.";
    }
}

document.getElementById("refreshIssues")
    .addEventListener("click", loadIssueHistory);

document.addEventListener("DOMContentLoaded", loadIssueHistory);
