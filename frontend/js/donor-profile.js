// ================================
// BBMS - DONOR PROFILE
// VIEW + UPDATE
// ================================

const donorProfileForm =
    document.getElementById("donorProfileForm");

const DONOR_API_URL = "http://127.0.0.1:5000";


// ================================
// LOAD EXISTING DONOR PROFILE
// ================================

async function loadDonorProfile() {

    const userData = localStorage.getItem("bbmsUser");

    if (!userData) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(userData);

// ================================
// ROLE SECURITY
// ================================

if (user.role !== "donor") {

    alert("Access denied. This page is only for donors.");

    window.location.href = "role-dashboard.html";

    return;
}

    try {

        const response = await fetch(
            `${DONOR_API_URL}/api/donors/${user.user_id}`
        );

        const data = await response.json();

        if (response.ok) {

            const donor = data.donor;

            document.getElementById("bloodGroup").value =
                donor.blood_group || "";

            document.getElementById("dateOfBirth").value =
                donor.date_of_birth || "";

            document.getElementById("gender").value =
                donor.gender || "";

            document.getElementById("address").value =
                donor.address || "";

            document.getElementById("medicalHistory").value =
                donor.medical_history || "";

            console.log(
                "Donor profile loaded successfully",
                donor
            );

        } else if (response.status === 404) {

            console.log(
                "No donor profile found. Create a new profile."
            );

        } else {

            alert(
                data.message ||
                "Unable to load donor profile."
            );
        }

    } catch (error) {

        console.error(error);

        alert(
            "Cannot connect to server. Please make sure Flask backend is running."
        );
    }
}


// ================================
// SAVE / UPDATE DONOR PROFILE
// ================================

if (donorProfileForm) {

    donorProfileForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const userData =
                localStorage.getItem("bbmsUser");

            if (!userData) {

                alert("Please login first.");

                window.location.href = "login.html";

                return;
            }

            const user = JSON.parse(userData);

            const bloodGroup =
                document.getElementById("bloodGroup").value;

            const dateOfBirth =
                document.getElementById("dateOfBirth").value;

            const gender =
                document.getElementById("gender").value;

            const address =
                document.getElementById("address").value.trim();

            const medicalHistory =
                document.getElementById("medicalHistory").value.trim();


            // ================================
            // REQUIRED FIELD VALIDATION
            // ================================

            if (
                !bloodGroup ||
                !dateOfBirth ||
                !gender ||
                !address
            ) {

                alert(
                    "Please fill all required fields."
                );

                return;
            }


            // ================================
            // AGE VALIDATION
            // ================================

            const birthDate = new Date(dateOfBirth);
            const today = new Date();

            let age =
                today.getFullYear() -
                birthDate.getFullYear();

            const monthDifference =
                today.getMonth() -
                birthDate.getMonth();

            if (
                monthDifference < 0 ||
                (
                    monthDifference === 0 &&
                    today.getDate() < birthDate.getDate()
                )
            ) {
                age--;
            }

            if (age < 18) {

                alert(
                    "Donor must be at least 18 years old."
                );

                return;
            }


            // ================================
            // BLOOD GROUP VALIDATION
            // ================================

            const validBloodGroups = [
                "A+",
                "A-",
                "B+",
                "B-",
                "O+",
                "O-",
                "AB+",
                "AB-"
            ];

            if (!validBloodGroups.includes(bloodGroup)) {

                alert(
                    "Please select a valid blood group."
                );

                return;
            }


            // ================================
            // SAVE / UPDATE
            // ================================

            try {

                const checkResponse = await fetch(
                    `${DONOR_API_URL}/api/donors/${user.user_id}`
                );

                let response;


                // Existing profile → UPDATE
                if (checkResponse.ok) {

                    response = await fetch(
                        `${DONOR_API_URL}/api/donors/${user.user_id}`,
                        {

                            method: "PUT",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify({

                                blood_group: bloodGroup,

                                date_of_birth: dateOfBirth,

                                gender: gender,

                                address: address,

                                medical_history: medicalHistory

                            })
                        }
                    );

                }

                // New profile → CREATE
                else {

                    response = await fetch(
                        `${DONOR_API_URL}/api/donors`,
                        {

                            method: "POST",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify({

                                user_id: user.user_id,

                                blood_group: bloodGroup,

                                date_of_birth: dateOfBirth,

                                gender: gender,

                                address: address,

                                medical_history: medicalHistory

                            })
                        }
                    );
                }


                const data =
                    await response.json();


                if (response.ok) {

                    alert(
                        data.message ||
                        "Donor profile saved successfully!"
                    );

                } else {

                    alert(
                        data.message ||
                        "Unable to save donor profile."
                    );
                }


            } catch (error) {

                console.error(error);

                alert(
                    "Cannot connect to server. Please make sure Flask backend is running."
                );
            }

        }
    );
}


// ================================
// LOAD PROFILE WHEN PAGE OPENS
// ================================

loadDonorProfile();