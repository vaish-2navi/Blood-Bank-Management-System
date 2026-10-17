
const ADMIN_API_URL = "http://127.0.0.1:5000";

let allUsers = [];

document.addEventListener("DOMContentLoaded", function () {
    const userData = localStorage.getItem("bbmsUser");

    if (!userData) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    let currentUser;

    try {
        currentUser = JSON.parse(userData);
    } catch (error) {
        localStorage.removeItem("bbmsUser");
        window.location.href = "login.html";
        return;
    }

    if (currentUser.role !== "admin") {
        alert("Access denied. Admin only.");
        window.location.href = "role-dashboard.html";
        return;
    }

    document.getElementById("userSearch").addEventListener("input", filterUsers);

    loadUsers(currentUser);
});

async function loadUsers(currentUser) {
    const tableBody = document.getElementById("usersTableBody");
    const userCount = document.getElementById("userCount");

    tableBody.innerHTML = `
        <tr><td colspan="7">Loading users...</td></tr>
    `;

    try {
        const response = await fetch(`${ADMIN_API_URL}/api/admin/users`, {
            headers: {
                "X-Admin-User-ID": String(currentUser.user_id)
            },
            cache: "no-store"
        });

        const data = await response.json();

        if (!response.ok || data.status !== "success") {
            throw new Error(data.message || "Unable to load users.");
        }

        allUsers = data.users || [];
        userCount.textContent = `Total users: ${allUsers.length}`;

        renderUsers(allUsers);
    } catch (error) {
        console.error("Admin users error:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="7">Unable to load users. Please check the backend and API.</td>
            </tr>
        `;

        userCount.textContent = "Users could not be loaded.";
        showUsersMessage(error.message, "error");
    }
}

function renderUsers(users) {
    const tableBody = document.getElementById("usersTableBody");
    const currentUser = JSON.parse(
        localStorage.getItem("bbmsUser") || "null"
    );

    tableBody.innerHTML = "";

    if (!users.length) {
        tableBody.innerHTML = `
            <tr><td colspan="7">No users found.</td></tr>
        `;
        return;
    }

    users.forEach(function (user) {
        const row = document.createElement("tr");

        [
            user.user_id,
            user.full_name,
            user.email,
            user.phone || "-",
            user.role
        ].forEach(function (value) {
            const cell = document.createElement("td");
            cell.textContent = value ?? "-";
            row.appendChild(cell);
        });

        // Status badge
        const statusCell = document.createElement("td");
        const badge = document.createElement("span");

        badge.className =
            `status-badge status-${String(user.status).toLowerCase()}`;
        badge.textContent = user.status;

        statusCell.appendChild(badge);
        row.appendChild(statusCell);

        // Action controls
        const actionCell = document.createElement("td");

        if (Number(user.user_id) === Number(currentUser.user_id)) {
            actionCell.textContent = "Current account";
        } else {
            // Activate / Deactivate
            const statusButton = document.createElement("button");

            statusButton.textContent =
                user.status === "active" ? "Deactivate" :
                user.status === "blocked" ? "Unblock" : "Activate";

            statusButton.addEventListener("click", function () {
                const nextStatus =
                    user.status === "active" ? "inactive" : "active";

                updateUser(user.user_id, { status: nextStatus });
            });

            // Block account
            const blockButton = document.createElement("button");

            blockButton.textContent =
                user.status === "blocked" ? "Blocked" : "Block";
            blockButton.disabled = user.status === "blocked";

            blockButton.addEventListener("click", function () {
                if (confirm(`Block ${user.full_name}'s account?`)) {
                    updateUser(user.user_id, { status: "blocked" });
                }
            });

            // Role dropdown
            const roleSelect = document.createElement("select");

            ["donor", "patient", "hospital", "staff", "admin"].forEach(
                function (role) {
                    const option = document.createElement("option");
                    option.value = role;
                    option.textContent = role;
                    option.selected = role === user.role;
                    roleSelect.appendChild(option);
                }
            );

            // Update Role button
            const roleButton = document.createElement("button");
            roleButton.textContent = "Update Role";

            roleButton.addEventListener("click", function () {
                const selectedRole = roleSelect.value;

                if (selectedRole === user.role) {
                    showUsersMessage(
                        "Select a different role first.",
                        "error"
                    );
                    return;
                }

                if (
                    confirm(
                        `Change ${user.full_name}'s role to ${selectedRole}?`
                    )
                ) {
                    updateUser(user.user_id, { role: selectedRole });
                }
            });

            actionCell.append(
                statusButton,
                blockButton,
                roleSelect,
                roleButton
            );
        }

        row.appendChild(actionCell);
        tableBody.appendChild(row);
    });
}

async function updateUser(userId, changes) {
    const currentUser = JSON.parse(
        localStorage.getItem("bbmsUser") || "null"
    );

    if (!currentUser || currentUser.role !== "admin") {
        showUsersMessage("Admin login required.", "error");
        return;
    }

    try {
        const response = await fetch(
            `${ADMIN_API_URL}/api/admin/users/${userId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-Admin-User-ID": String(currentUser.user_id)
                },
                body: JSON.stringify(changes)
            }
        );

        const data = await response.json();

        if (!response.ok || data.status !== "success") {
            throw new Error(data.message || "Update failed.");
        }

        showUsersMessage(data.message || "User updated successfully.", "success");
        await loadUsers(currentUser);
    } catch (error) {
        console.error("Update user error:", error);
        showUsersMessage(error.message, "error");
    }
}

function filterUsers() {
    const searchInput = document.getElementById("userSearch");
    const searchText = searchInput.value.trim().toLowerCase();

    const filteredUsers = allUsers.filter(function (user) {
        return [
            user.full_name,
            user.email,
            user.phone,
            user.role,
            user.status,
            user.user_id
        ].some(function (value) {
            return String(value ?? "")
                .toLowerCase()
                .includes(searchText);
        });
    });

    renderUsers(filteredUsers);

    document.getElementById("userCount").textContent =
        searchText
            ? `Showing ${filteredUsers.length} of ${allUsers.length} users`
            : `Total users: ${allUsers.length}`;
}

function showUsersMessage(message, type) {
    const messageBox = document.getElementById("usersMessage");

    messageBox.textContent = message;
    messageBox.className = "users-message";
    messageBox.classList.add(
        type === "error" ? "users-error" : "users-info"
    );
    messageBox.style.display = "block";
}
