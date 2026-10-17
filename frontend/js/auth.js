const API_URL = "http://127.0.0.1:5000";

// ================================
// REGISTER
// ================================

async function registerUser() {
    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const phone = document.getElementById("registerPhone").value.trim();
    const role = document.getElementById("registerRole").value;
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!name || !email || !password || !role) {
        alert("Please fill all required fields.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    if (password.length < 6) {
        alert("Password must contain at least 6 characters.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                full_name: name,
                email: email,
                phone: phone,
                password: password,
                role: role
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Registration successful! Please login.");
            window.location.href = "login.html";
        } else {
            alert(data.message || "Registration failed.");
        }
    } catch (error) {
        console.error("Registration error:", error);
        alert("Cannot connect to server. Please make sure Flask backend is running.");
    }
}

// ================================
// LOGIN
// ================================

async function loginUser() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const role = document.getElementById("loginRole").value;

    if (!email || !password || !role) {
        alert("Please enter email, password and role.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password,
                role: role
            })
        });

        const data = await response.json();
        console.log("Login response:", response.status, data);
console.log("Login successful:", data.status === "success");

        if (response.ok) {
            localStorage.setItem("bbmsUser", JSON.stringify(data.user));

            alert("Login successful!");
            window.location.href = "role-dashboard.html";
        } else {
            alert(data.message || "Login failed.");
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("Cannot connect to server. Please make sure Flask backend is running.");
    }
}

// ================================
// FORM EVENT LISTENERS
// ================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();
        registerUser();
    });
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        loginUser();
    });
}

// ================================
// ROLE DASHBOARD
// ================================

function loadRoleDashboard() {
    const userData = localStorage.getItem("bbmsUser");

    if (!userData) {
        window.location.href = "login.html";
        return;
    }

    let user;

    try {
        user = JSON.parse(userData);
    } catch (error) {
        localStorage.removeItem("bbmsUser");
        window.location.href = "login.html";
        return;
    }

    const title = document.getElementById("dashboardTitle");
    const subtitle = document.getElementById("dashboardSubtitle");
    const actions = document.getElementById("roleActions");

    if (!title || !subtitle || !actions) {
        return;
    }

    // ============================
    // DONOR
    // ============================

    if (user.role === "donor") {
        title.textContent = `Welcome, ${user.full_name}`;
        subtitle.textContent =
            "Donor Dashboard - Manage your donations and profile.";

        actions.innerHTML = `
            <div class="action-card"
                 onclick="window.location.href='donor-profile.html'">
                <h3>👤 My Profile</h3>
                <p>View and update your donor profile.</p>
            </div>

            <div class="action-card"
                 onclick="window.location.href='donation-history.html'"
                <h3>🩸 Donation History</h3>
                <p>View your previous blood donations.</p>
            </div>

            <div class="action-card">
                <h3>📅 Appointments</h3>
                <p>Appointment module will be added later.</p>
            </div>

            <div class="action-card"
                 onclick="window.location.href='notifications.html'">
                <h3>🔔 Notifications</h3>
                <p>View important notifications.</p>
            </div>
        `;
    }

    // ============================
    // PATIENT
    // ============================

    else if (user.role === "patient") {
        title.textContent = `Welcome, ${user.full_name}`;
        subtitle.textContent =
            "Patient Dashboard - Search and request blood.";

        actions.innerHTML = `
            <div class="action-card"
                 onclick="window.location.href='blood-stock.html'">
                <h3>🩸 Blood Availability</h3>
                <p>Check available blood groups and components.</p>
            </div>

            <div class="action-card"
                 onclick="window.location.href='requests.html'">
                <h3>📋 Request Blood</h3>
                <p>Submit a new blood request.</p>
            </div>

            <div class="action-card"
                 onclick="window.location.href='requests.html'">
                <h3>📊 Request Status</h3>
                <p>Track your blood requests.</p>
            </div>

            <div class="action-card"
                 onclick="window.location.href='notifications.html'">
                <h3>🔔 Notifications</h3>
                <p>View request and blood availability alerts.</p>
            </div>
        `;
    }

    // ============================
    // HOSPITAL
    // ============================

    else if (user.role === "hospital") {
        title.textContent = `Welcome, ${user.full_name}`;
        subtitle.textContent =
            "Hospital Dashboard - Manage blood requests.";

        actions.innerHTML = `
            <div class="action-card"
                 onclick="window.location.href='blood-stock.html'">
                <h3>🩸 Blood Availability</h3>
                <p>Check available blood stock.</p>
            </div>

            <div class="action-card"
                 onclick="window.location.href='requests.html'">
                <h3>📋 Blood Requests</h3>
                <p>Create and manage blood requests.</p>
            </div>

            <div class="action-card"
                 onclick="window.location.href='requests.html'">
                <h3>📊 Request Status</h3>
                <p>Track submitted requests.</p>
            </div>

            <div class="action-card"
                 onclick="window.location.href='notifications.html'">
                <h3>🔔 Notifications</h3>
                <p>View important hospital notifications.</p>
            </div>
        `;
    }

    // ============================
    // STAFF
    // ============================

    else if (user.role === "staff") {
        title.textContent = `Welcome, ${user.full_name}`;
        subtitle.textContent =
            "Blood Bank Staff Dashboard - Manage blood bank operations.";

        actions.innerHTML = `
            <div class="action-card"
                 onclick="window.location.href='staff-donors.html'">
                <h3>👥 Donor Management</h3>
                <p>Manage donor information and records.</p>
            </div>

            <div class="action-card"
                 onclick="window.location.href='blood-stock.html'">
                <h3>🩸 Blood Inventory</h3>
                <p>Manage available blood stock.</p>
            </div>

            <div class="action-card"
                 onclick="window.location.href='requests.html'">
                <h3>📋 Blood Requests</h3>
                <p>Review and manage blood requests.</p>
            </div>

            <div class="action-card"
                 onclick="window.location.href='staff-collection.html'">
                <h3>🩸 Blood Collection</h3>
                <p>Record blood donation and collection details.</p>
            </div>

            <div class="action-card"
                 onclick="window.location.href='blood-issues.html'">
                <h3>🩸 Blood Issue History</h3>
                <p>View blood units issued against approved requests.</p>
            </div>
        `;
    }

    // ============================
    // ADMIN
    // ============================

    else if (user.role === "admin") {
        title.textContent = `Welcome, ${user.full_name}`;
        subtitle.textContent =
            "Administrator Dashboard - Complete system control.";

        actions.innerHTML = `
            <div class="action-card"
                 onclick="window.location.href='admin-users.html'">
                <h3>👥 User Management</h3>
                <p>Manage system users and their accounts.</p>
            </div>

            <div class="action-card"
                 onclick="window.location.href='blood-stock.html'">
                <h3>🩸 Blood Inventory</h3>
                <p>Monitor and manage blood inventory.</p>
            </div>

            <div class="action-card"
                 onclick="window.location.href='requests.html'">
                <h3>📋 Request Management</h3>
                <p>Monitor blood requests and approvals.</p>
            </div>

            <div class="action-card"
                 onclick="window.location.href='admin-reports.html'">
                <h3>📊 Reports</h3>
                <p>View blood bank activity and inventory reports.</p>
            </div>

            <div class="action-card"
                 onclick="window.location.href='blood-issues.html'">
                <h3>🩸 Blood Issue History</h3>
                <p>View all blood issue records and issued quantities.</p>
            </div>
        `;
    }

    else {
        title.textContent = "Dashboard";
        subtitle.textContent = "Your account role is not recognized.";
        actions.replaceChildren();
    }
}

// ================================
// LOGOUT
// ================================


async function logoutUser() {
    try {
        await fetch(`${API_URL}/api/logout`, {
            method: "POST",
            credentials: "include"
        });
    } catch (error) {
        console.error("Logout API error:", error);
    } finally {
        localStorage.removeItem("bbmsUser");
        window.location.href = "login.html";
    }
}

function logout() {
    logoutUser();
}


// ================================
// LOAD DASHBOARD AUTOMATICALLY
// ================================

if (window.location.pathname.includes("role-dashboard.html")) {
    loadRoleDashboard();
}