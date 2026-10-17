const PATIENT_API_URL = "http://127.0.0.1:5000";


document.addEventListener("DOMContentLoaded", function () {

    const userData = localStorage.getItem("bbmsUser");

    // Login check
    if (!userData) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(userData);

    // Role check
    if (user.role !== "patient") {
        alert("Access denied. Patient account required.");
        window.location.href = "profile.html";
        return;
    }


    // Display account information
    document.getElementById("patientName").textContent =
        user.full_name || "Patient";

    document.getElementById("patientEmail").textContent =
        user.email || "No email available";

    document.getElementById("accountFullName").textContent =
        user.full_name || "-";

    document.getElementById("accountEmail").textContent =
        user.email || "-";

    document.getElementById("accountPhone").textContent =
        user.phone || "-";


    // Load patient profile
    loadPatientProfile(user.user_id);


    // Save patient profile
    document
        .getElementById("patientProfileForm")
        .addEventListener("submit", function (event) {

            event.preventDefault();

            savePatientProfile(user.user_id);
        });

});


/* =========================================
   LOAD PATIENT PROFILE
========================================= */

async function loadPatientProfile(userId) {

    try {

        const response = await fetch(
            `${PATIENT_API_URL}/api/patients/${userId}`
        );

        const data = await response.json();

        if (response.ok && data.status === "success") {

            const patient = data.patient;

            document.getElementById("patientBloodGroup").value =
                patient.blood_group || "";

            document.getElementById("patientDateOfBirth").value =
                patient.date_of_birth || "";

            document.getElementById("patientGender").value =
                patient.gender || "";

            document.getElementById("patientAddress").value =
                patient.address || "";

            document.getElementById("patientMedicalCondition").value =
                patient.medical_condition || "";

        }

    } catch (error) {

        console.error(
            "Patient profile load error:",
            error
        );

    }

}


/* =========================================
   SAVE PATIENT PROFILE
========================================= */

async function savePatientProfile(userId) {

    const message =
        document.getElementById("patientProfileMessage");


    const data = {

        user_id: userId,

        blood_group:
            document.getElementById("patientBloodGroup").value,

        date_of_birth:
            document.getElementById("patientDateOfBirth").value || null,

        gender:
            document.getElementById("patientGender").value || null,

        address:
            document.getElementById("patientAddress").value || null,

        medical_condition:
            document.getElementById("patientMedicalCondition").value || null

    };


    try {

        const response = await fetch(
            `${PATIENT_API_URL}/api/patients`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(data)
            }
        );


        const result = await response.json();


        if (response.ok && result.status === "success") {

            message.textContent =
                "✓ Patient profile saved successfully.";

            message.style.color = "#2e7d32";

        } else {

            message.textContent =
                result.message ||
                "Unable to save patient profile.";

            message.style.color = "#c62828";
        }


    } catch (error) {

        console.error(
            "Patient profile save error:",
            error
        );

        message.textContent =
            "Unable to connect to server.";

        message.style.color = "#c62828";
    }

}