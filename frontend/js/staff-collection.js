const API_URL = "http://127.0.0.1:5000";

let donors = [];

document.addEventListener("DOMContentLoaded", function () {

    // Check login
    const userData = localStorage.getItem("bbmsUser");

    if (!userData) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(userData);

    // Only staff can access this page
    if (user.role !== "staff") {
        alert("Access denied. Staff only.");
        window.location.href = "role-dashboard.html";
        return;
    }

    // Set today's date
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("collectionDate").value = today;

    // Load donors
    loadDonors();

    // Donor selection
    document
        .getElementById("donorSelect")
        .addEventListener("change", showDonorDetails);

    // Form submit
    document
        .getElementById("staffCollectionForm")
        .addEventListener("submit", submitCollection);
});


// ==========================================
// LOAD ALL DONORS
// ==========================================

async function loadDonors() {

    const donorSelect = document.getElementById("donorSelect");

    try {

        const response = await fetch(
            `${API_URL}/api/staff/donors`
        );

        const data = await response.json();

        if (data.status !== "success") {

            donorSelect.innerHTML = `
                <option value="">
                    Unable to load donors
                </option>
            `;

            return;
        }

        donors = data.donors || [];

        donorSelect.innerHTML = `
            <option value="">
                Select a donor
            </option>
        `;

        donors.forEach(function (donor) {

            const option = document.createElement("option");

            option.value = donor.user_id;

            option.textContent =
                `${donor.full_name} - ${donor.blood_group}`;

            donorSelect.appendChild(option);
        });

    } catch (error) {

        console.error("Error loading donors:", error);

        donorSelect.innerHTML = `
            <option value="">
                Unable to connect to server
            </option>
        `;
    }
}


// ==========================================
// SHOW SELECTED DONOR DETAILS
// ==========================================

function showDonorDetails() {

    const selectedUserId =
        document.getElementById("donorSelect").value;

    const donorInfo =
        document.getElementById("donorInfo");

    if (!selectedUserId) {

        donorInfo.style.display = "none";

        return;
    }

    const donor = donors.find(function (item) {

        return String(item.user_id) === String(selectedUserId);

    });

    if (!donor) {
        donorInfo.style.display = "none";
        return;
    }

    // Show donor information

    document.getElementById("selectedDonorName").textContent =
        donor.full_name || "-";

    document.getElementById("selectedDonorBloodGroup").textContent =
        donor.blood_group || "-";

    document.getElementById("selectedDonorPhone").textContent =
        donor.phone || "-";

    document.getElementById("selectedDonorEmail").textContent =
        donor.email || "-";

    donorInfo.style.display = "block";


    // Automatically select donor blood group

    const bloodGroupSelect =
        document.getElementById("collectionBloodGroup");

    bloodGroupSelect.value =
        donor.blood_group || "";

}


// ==========================================
// SUBMIT BLOOD COLLECTION
// ==========================================

async function submitCollection(event) {

    event.preventDefault();

    const donorId =
        document.getElementById("donorSelect").value;

    const donationDate =
        document.getElementById("collectionDate").value;

    const bloodGroup =
        document.getElementById("collectionBloodGroup").value;

    const componentType =
        document.getElementById("collectionComponent").value;

    const quantity =
        Number(
            document.getElementById("collectionQuantity").value
        );

    const healthCheckStatus =
        document.getElementById("collectionHealthStatus").value;

    const remarks =
        document.getElementById("collectionRemarks").value.trim();


    // ==========================================
    // VALIDATION
    // ==========================================

    if (!donorId) {

        showMessage(
            "Please select a donor.",
            "error"
        );

        return;
    }

    if (!donationDate) {

        showMessage(
            "Please select donation date.",
            "error"
        );

        return;
    }

    if (!bloodGroup) {

        showMessage(
            "Please select blood group.",
            "error"
        );

        return;
    }

    if (quantity <= 0) {

        showMessage(
            "Quantity must be greater than 0.",
            "error"
        );

        return;
    }


    // ==========================================
    // SEND DATA TO BACKEND
    // ==========================================

    const donationData = {

        donor_id: Number(donorId),

        donation_date: donationDate,

        blood_group: bloodGroup,

        component_type: componentType,

        quantity: quantity,

        health_check_status: healthCheckStatus,

        remarks: remarks
    };


    try {

        const response = await fetch(
            `${API_URL}/api/donations`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(donationData)
            }
        );


        const data = await response.json();


        // ==========================================
        // SUCCESS
        // ==========================================

        if (response.ok && data.status === "success") {

            let message =
                "Blood donation recorded successfully.";

            if (data.stock_updated) {

                message +=
                    " Blood stock has been updated.";
            }

            showMessage(
                message,
                "success"
            );


            // Reset form

            document
                .getElementById("staffCollectionForm")
                .reset();


            // Set today's date again

            document.getElementById("collectionDate").value =
                new Date()
                    .toISOString()
                    .split("T")[0];


            // Hide donor information

            document.getElementById("donorInfo").style.display =
                "none";


            // Reset donor dropdown

            document.getElementById("donorSelect").value = "";


            return;
        }


        // ==========================================
        // BACKEND ERROR
        // ==========================================

        showMessage(
            data.message || "Unable to record donation.",
            "error"
        );

    } catch (error) {

        console.error(
            "Donation submission error:",
            error
        );

        showMessage(
            "Unable to connect to the backend server.",
            "error"
        );
    }
}


// ==========================================
// SHOW MESSAGE
// ==========================================

function showMessage(message, type) {

    const messageBox =
        document.getElementById("collectionMessage");

    messageBox.textContent = message;

    messageBox.style.display = "block";

    messageBox.className = "message";

    if (type === "success") {

        messageBox.classList.add(
            "success-message"
        );

    } else {

        messageBox.classList.add(
            "error-message"
        );
    }


    // Automatically hide after 5 seconds

    setTimeout(function () {

        messageBox.style.display = "none";

    }, 5000);
}