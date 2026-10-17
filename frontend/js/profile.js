document.addEventListener("DOMContentLoaded", function () {

    const userData = localStorage.getItem("bbmsUser");

    // User not logged in
    if (!userData) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(userData);

    // Display user information
    document.getElementById("profileName").textContent =
        user.full_name || "User";

    document.getElementById("profileEmail").textContent =
        user.email || "No email available";

    document.getElementById("profileRole").textContent =
        (user.role || "user").toUpperCase();


    // Personal Information
    const personalInfoOption =
        document.getElementById("personalInfoOption");

    if (user.role === "donor") {
    personalInfoOption.href = "donor-profile.html";

} else if (user.role === "patient") {
    personalInfoOption.href = "patient-profile.html";

} else {
    personalInfoOption.href = "#";

    personalInfoOption.addEventListener("click", function (event) {
        event.preventDefault();
        alert("Profile module is not available for this role yet.");
    });
}
    


    // Logout
    const logoutButton =
        document.getElementById("profileLogoutBtn");

    logoutButton.addEventListener("click", function () {

        const confirmLogout =
            confirm("Are you sure you want to logout?");

        if (!confirmLogout) {
            return;
        }

        localStorage.removeItem("bbmsUser");

        window.location.href = "login.html";
    });

});