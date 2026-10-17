
const REQUEST_API_URL = "http://127.0.0.1:5000";

let currentRequests = [];

function getLoggedInUser() {
    try {
        return JSON.parse(localStorage.getItem("bbmsUser"));
    } catch (error) {
        return null;
    }
}

function isStaffOrAdmin() {
    const user = getLoggedInUser();
    return !!user && (user.role === "staff" || user.role === "admin");
}

// SHOW / HIDE REQUEST FORM
const showRequestFormButton = document.getElementById("showRequestForm");
const requestFormSection = document.getElementById("requestFormSection");
const cancelRequestButton = document.getElementById("cancelRequest");

if (showRequestFormButton && requestFormSection) {
    showRequestFormButton.addEventListener("click", function () {
        requestFormSection.style.display = "block";
        showRequestFormButton.style.display = "none";
    });
}

if (cancelRequestButton && requestFormSection && showRequestFormButton) {
    cancelRequestButton.addEventListener("click", function () {
        requestFormSection.style.display = "none";
        showRequestFormButton.style.display = "block";
    });
}

// SUBMIT BLOOD REQUEST
const bloodRequestForm = document.getElementById("bloodRequestForm");

if (bloodRequestForm) {
    bloodRequestForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const user = getLoggedInUser();

        if (!user) {
            alert("Please login first.");
            return;
        }

        const requestData = {
            user_id: user.user_id,
            blood_group: document.getElementById("requestBloodGroup").value,
            component_type: document.getElementById("requestComponent").value,
            quantity: Number(document.getElementById("requestQuantity").value),
            urgency: document.getElementById("requestUrgency").value,
            required_date: document.getElementById("requiredDate").value || null,
            reason: document.getElementById("requestReason").value || null
        };

        try {
            const response = await fetch(`${REQUEST_API_URL}/api/blood-requests`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Unable to submit blood request.");
                return;
            }

            alert("Blood request submitted successfully!");

            bloodRequestForm.reset();

            if (requestFormSection) {
                requestFormSection.style.display = "none";
            }

            if (showRequestFormButton) {
                showRequestFormButton.style.display = "block";
            }

            loadBloodRequests();
        } catch (error) {
            console.error("Submit request error:", error);
            alert("Unable to connect to Blood Bank server.");
        }
    });
}

// LOAD BLOOD REQUESTS
async function loadBloodRequests() {
    const container = document.getElementById("requestsContainer");

    if (!container) {
        return;
    }

    try {
        const response = await fetch(`${REQUEST_API_URL}/api/blood-requests`, {
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            container.innerHTML = "<p>Unable to load blood requests.</p>";
            return;
        }

        currentRequests = data.blood_requests || [];
        displayBloodRequests(currentRequests);
    } catch (error) {
        console.error("Load requests error:", error);
        container.innerHTML = "<p>Unable to connect to server.</p>";
    }
}

// DISPLAY BLOOD REQUESTS
function displayBloodRequests(requests) {
    const container = document.getElementById("requestsContainer");

    if (!container) {
        return;
    }

    if (!requests.length) {
        container.innerHTML = `
            <div class="no-stock">
                <p>No blood requests found.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = "";

    requests.forEach(function (request) {
        const urgency = (request.urgency || "normal").toUpperCase();
        const status = (request.status || "pending").toUpperCase();
        const card = document.createElement("div");

        card.className = "request-card";

        let actionButtons = "";

        if (isStaffOrAdmin() && request.status === "pending") {
            actionButtons = `
                <div class="request-actions">
                    <button type="button"
                        class="approve-button"
                        onclick="approveRequest(${request.request_id})">
                        ✓ Approve
                    </button>

                    <button type="button"
                        class="reject-button"
                        onclick="rejectRequest(${request.request_id})">
                        ✕ Reject
                    </button>
                </div>
            `;
        } else if (isStaffOrAdmin() && request.status === "approved") {
            actionButtons = `
                <div class="request-actions">
                    <button type="button"
                        class="approve-button"
                        onclick="issueBlood(${request.request_id})">
                        🩸 Issue Blood
                    </button>
                </div>
            `;
        } else if (request.status === "fulfilled") {
            actionButtons = `
                <div class="request-actions">
                    <span class="request-status">✓ Blood Issued</span>
                </div>
            `;
        }

        card.innerHTML = `
            <div>
                <span class="urgent-badge">${urgency}</span>

                <h3>
                    ${request.blood_group}
                    ${request.component_type}
                    Required
                </h3>

                <p>Quantity: ${request.quantity} Unit(s)</p>

                <p>
                    Required Date:
                    ${request.required_date || "Not specified"}
                </p>

                <p>Status: <strong>${status}</strong></p>

                ${actionButtons}
            </div>

            <button type="button"
                onclick="viewRequestDetails(${request.request_id})">
                View
            </button>
        `;

        container.appendChild(card);
    });
}

// APPROVE REQUEST
async function approveRequest(requestId) {
    const user = getLoggedInUser();

    if (!user) {
        alert("Please login first.");
        return;
    }

    if (user.role !== "staff" && user.role !== "admin") {
        alert("Only Staff or Admin can approve requests.");
        return;
    }

    if (!confirm("Are you sure you want to approve this blood request?")) {
        return;
    }

    try {
        const response = await fetch(
            `${REQUEST_API_URL}/api/blood-requests/${requestId}/status`,
            {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: "approved",
                    approved_by: user.user_id
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to approve request.");
            return;
        }

        alert("Blood request approved successfully!");
        await loadBloodRequests();
    } catch (error) {
        console.error("Approve request error:", error);
        alert("Unable to connect to server.");
    }
}

// REJECT REQUEST
async function rejectRequest(requestId) {
    const user = getLoggedInUser();

    if (!user) {
        alert("Please login first.");
        return;
    }

    if (user.role !== "staff" && user.role !== "admin") {
        alert("Only Staff or Admin can reject requests.");
        return;
    }

    if (!confirm("Are you sure you want to reject this blood request?")) {
        return;
    }

    try {
        const response = await fetch(
            `${REQUEST_API_URL}/api/blood-requests/${requestId}/status`,
            {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: "rejected",
                    approved_by: user.user_id
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to reject request.");
            return;
        }

        alert("Blood request rejected.");
        await loadBloodRequests();
    } catch (error) {
        console.error("Reject request error:", error);
        alert("Unable to connect to server.");
    }
}

// ISSUE BLOOD
async function issueBlood(requestId) {
    const user = getLoggedInUser();

    if (!user) {
        alert("Please login first.");
        return;
    }

    if (user.role !== "staff" && user.role !== "admin") {
        alert("Only Staff or Admin can issue blood.");
        return;
    }

    if (!confirm("Are you sure you want to issue blood for this request?")) {
        return;
    }

    try {
        const response = await fetch(`${REQUEST_API_URL}/api/blood-issues`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                request_id: requestId,
                issued_by: user.user_id,
                remarks: "Blood issued successfully"
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to issue blood.");
            return;
        }

        alert(
            "Blood issued successfully!\n\n" +
            "Quantity: " +
            data.issued_quantity +
            " Unit(s)"
        );

        await loadBloodRequests();
    } catch (error) {
        console.error("Issue blood error:", error);
        alert("Unable to connect to Blood Bank server.");
    }
}

// VIEW REQUEST DETAILS
function viewRequestDetails(requestId) {
    const request = currentRequests.find(
        item => Number(item.request_id) === Number(requestId)
    );

    if (!request) {
        alert("Request details not found.");
        return;
    }

    const modal = document.getElementById("requestDetailsModal");
    const content = document.getElementById("requestDetailsContent");

    if (!modal || !content) {
        return;
    }

    content.innerHTML = `
        <div class="request-detail-row">
            <span class="request-detail-label">Request ID</span>
            <span class="request-detail-value">#${request.request_id}</span>
        </div>

        <div class="request-detail-row">
            <span class="request-detail-label">Blood Group</span>
            <span class="request-detail-value">${request.blood_group}</span>
        </div>

        <div class="request-detail-row">
            <span class="request-detail-label">Component</span>
            <span class="request-detail-value">${request.component_type}</span>
        </div>

        <div class="request-detail-row">
            <span class="request-detail-label">Quantity</span>
            <span class="request-detail-value">${request.quantity} Unit(s)</span>
        </div>

        <div class="request-detail-row">
            <span class="request-detail-label">Urgency</span>
            <span class="request-detail-value">
                ${(request.urgency || "normal").toUpperCase()}
            </span>
        </div>

        <div class="request-detail-row">
            <span class="request-detail-label">Required Date</span>
            <span class="request-detail-value">
                ${request.required_date || "Not specified"}
            </span>
        </div>

        <div class="request-detail-row">
            <span class="request-detail-label">Reason</span>
            <span class="request-detail-value">
                ${request.reason || "Not specified"}
            </span>
        </div>

        <div class="request-detail-row">
            <span class="request-detail-label">Status</span>
            <span class="request-detail-value">
                <span class="request-status">
                    ${request.status || "pending"}
                </span>
            </span>
        </div>
    `;

    modal.style.display = "flex";
}

// CLOSE REQUEST DETAILS MODAL
const requestDetailsModal = document.getElementById("requestDetailsModal");
const closeRequestModal = document.getElementById("closeRequestModal");

if (closeRequestModal && requestDetailsModal) {
    closeRequestModal.addEventListener("click", function () {
        requestDetailsModal.style.display = "none";
    });
}

if (requestDetailsModal) {
    requestDetailsModal.addEventListener("click", function (event) {
        if (event.target === requestDetailsModal) {
            requestDetailsModal.style.display = "none";
        }
    });
}

// LOAD REQUESTS WHEN PAGE OPENS
document.addEventListener("DOMContentLoaded", function () {
    loadBloodRequests();
});
