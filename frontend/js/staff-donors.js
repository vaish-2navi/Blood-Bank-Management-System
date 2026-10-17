// =====================================
// BBMS - STAFF DONOR MANAGEMENT
// =====================================

const API_URL = "http://127.0.0.1:5000";

let allDonors = [];


// =====================================
// PAGE LOAD
// =====================================

document.addEventListener("DOMContentLoaded", function () {

    checkStaffAccess();

    loadDonors();

    setupFilters();

});


// =====================================
// STAFF ACCESS CHECK
// =====================================

function checkStaffAccess() {

    const userData = localStorage.getItem("bbmsUser");

    if (!userData) {

        alert("Please login first.");

        window.location.href = "login.html";

        return;

    }

    const user = JSON.parse(userData);

    if (user.role !== "staff") {

        alert("Access denied. Staff only.");

        window.location.href = "role-dashboard.html";

        return;

    }

}


// =====================================
// LOAD ALL DONORS
// =====================================

async function loadDonors() {

    const container =
        document.getElementById("donorTableContainer");

    try {

        const response =
            await fetch(`${API_URL}/api/staff/donors`);

        const data =
            await response.json();

        if (!response.ok || data.status !== "success") {

            container.innerHTML = `
                <p>
                    Unable to load donor records.
                </p>
            `;

            return;

        }

        allDonors = data.donors || [];

        displayDonors(allDonors);

    } catch (error) {

        console.error("Donor loading error:", error);

        container.innerHTML = `
            <p>
                Cannot connect to server.
                Please make sure Flask backend is running.
            </p>
        `;

    }

}


// =====================================
// DISPLAY DONORS
// =====================================

function displayDonors(donors) {

    const container =
        document.getElementById("donorTableContainer");

    const count =
        document.getElementById("donorCount");


    count.textContent =
        `${donors.length} donor(s) found`;


    if (donors.length === 0) {

        container.innerHTML = `
            <p>
                No donor records found.
            </p>
        `;

        return;

    }


    let tableHTML = `

        <table class="stock-table">

            <thead>

                <tr>

                    <th>Donor</th>

                    <th>Blood Group</th>

                    <th>Contact</th>

                    <th>Gender</th>

                    <th>Last Donation</th>

                    <th>Status</th>

                    <th>Action</th>

                </tr>

            </thead>

            <tbody>

    `;


    donors.forEach(function (donor) {

        tableHTML += `

            <tr>

                <td>

                    <strong>
                        ${donor.full_name || "N/A"}
                    </strong>

                    <br>

                    <small>
                        ${donor.email || "No email"}
                    </small>

                </td>


                <td>

                    <strong>
                        ${donor.blood_group || "N/A"}
                    </strong>

                </td>


                <td>
                    ${donor.phone || "N/A"}
                </td>


                <td>
                    ${donor.gender || "N/A"}
                </td>


                <td>
                    ${donor.last_donation_date || "No donation yet"}
                </td>


                <td>
                    ${donor.donor_status || "Active"}
                </td>


                <td>

                    <button
                        type="button"
                        class="view-donor-btn"
                        onclick="viewDonor(${donor.donor_id})"
                    >
                        View
                    </button>

                </td>

            </tr>

        `;

    });


    tableHTML += `

            </tbody>

        </table>

    `;


    container.innerHTML = tableHTML;

}


// =====================================
// SEARCH + FILTER
// =====================================

function setupFilters() {

    const searchInput =
        document.getElementById("donorSearch");

    const bloodGroupFilter =
        document.getElementById("donorBloodGroupFilter");

    const clearButton =
        document.getElementById("clearDonorFilters");


    searchInput.addEventListener(
        "input",
        applyFilters
    );


    bloodGroupFilter.addEventListener(
        "change",
        applyFilters
    );


    clearButton.addEventListener(
        "click",
        function () {

            searchInput.value = "";

            bloodGroupFilter.value = "";

            displayDonors(allDonors);

        }
    );

}


// =====================================
// APPLY FILTERS
// =====================================

function applyFilters() {

    const search =
        document
            .getElementById("donorSearch")
            .value
            .toLowerCase()
            .trim();


    const bloodGroup =
        document
            .getElementById("donorBloodGroupFilter")
            .value;


    const filteredDonors =
        allDonors.filter(function (donor) {

            const matchesSearch =

                !search ||

                (donor.full_name || "")
                    .toLowerCase()
                    .includes(search) ||

                (donor.email || "")
                    .toLowerCase()
                    .includes(search) ||

                (donor.phone || "")
                    .toLowerCase()
                    .includes(search);


            const matchesBloodGroup =

                !bloodGroup ||

                donor.blood_group === bloodGroup;


            return (
                matchesSearch &&
                matchesBloodGroup
            );

        });


    displayDonors(filteredDonors);

}


// =====================================
// VIEW DONOR DETAILS
// =====================================

function viewDonor(donorId) {

    const donor =
        allDonors.find(function (item) {

            return item.donor_id === donorId;

        });


    if (!donor) {

        alert("Donor details not found.");

        return;

    }


    alert(

        "Donor Details\n\n" +

        "Name: " +
        (donor.full_name || "N/A") +

        "\nEmail: " +
        (donor.email || "N/A") +

        "\nPhone: " +
        (donor.phone || "N/A") +

        "\nBlood Group: " +
        (donor.blood_group || "N/A") +

        "\nGender: " +
        (donor.gender || "N/A") +

        "\nDate of Birth: " +
        (donor.date_of_birth || "N/A") +

        "\nAddress: " +
        (donor.address || "N/A") +

        "\nMedical History: " +
        (donor.medical_history || "N/A") +

        "\nLast Donation: " +
        (donor.last_donation_date || "No donation yet") +

        "\nStatus: " +
        (donor.donor_status || "Active")

    );

}