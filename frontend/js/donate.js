const DONATION_API_URL = "http://127.0.0.1:5000";

const user = JSON.parse(localStorage.getItem("bbmsUser"));

if (!user) {
    window.location.href = "login.html";
}

const donationForm = document.getElementById("donationForm");
const donationMessage = document.getElementById("donationMessage");
const donationHistory = document.getElementById("donationHistory");

donationForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    console.log("Logged-in user:", user);
    console.log("Sending donor_id:", user.user_id);

    const data = {
        donor_id: user.user_id,
        donation_date: document.getElementById("donationDate").value,
        blood_group: document.getElementById("donationBloodGroup").value,
        component_type: document.getElementById("donationComponent").value,
        quantity: Number(document.getElementById("donationQuantity").value),
        health_check_status: document.getElementById("healthCheckStatus").value,
        remarks: document.getElementById("donationRemarks").value
    };

    try {
        const response = await fetch(`${DONATION_API_URL}/api/donations`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            donationMessage.textContent = "✅ Donation recorded successfully!";
            donationMessage.style.color = "green";

            donationForm.reset();
            document.getElementById("donationQuantity").value = 1;

            loadDonationHistory();
        } else {
            donationMessage.textContent = "❌ " + result.message;
            donationMessage.style.color = "red";
        }

    } catch (error) {
        donationMessage.textContent = "❌ Unable to connect to server.";
        donationMessage.style.color = "red";
    }
});


async function loadDonationHistory() {

    try {
        const response = await fetch(
            `${DONATION_API_URL}/api/donations/${user.user_id}`
        );

        const result = await response.json();

        if (!result.donations || result.donations.length === 0) {
            donationHistory.innerHTML =
                "<p>No donation history found.</p>";
            return;
        }

        donationHistory.innerHTML = result.donations.map(donation => `
            <div class="request-card">

                <h3>${donation.blood_group} - ${donation.component_type}</h3>

                <p>
                    <strong>Quantity:</strong>
                    ${donation.quantity} Unit(s)
                </p>

                <p>
                    <strong>Date:</strong>
                    ${donation.donation_date}
                </p>

                <p>
                    <strong>Health Check:</strong>
                    ${donation.health_check_status}
                </p>

                <p>
                    <strong>Remarks:</strong>
                    ${donation.remarks || "None"}
                </p>

            </div>
        `).join("");

    } catch (error) {
        donationHistory.innerHTML =
            "<p>Unable to load donation history.</p>";
    }
}

document.addEventListener("DOMContentLoaded", loadDonationHistory);