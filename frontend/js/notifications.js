const NOTIFICATION_API_URL = "http://127.0.0.1:5000";


// ==========================================
// GET LOGGED-IN USER
// ==========================================

function getLoggedInUser() {

    const userData = localStorage.getItem("bbmsUser");

    if (!userData) {
        return null;
    }

    try {
        return JSON.parse(userData);
    } catch (error) {
        console.error("Invalid user data:", error);
        return null;
    }
}


// ==========================================
// LOAD NOTIFICATIONS
// ==========================================

async function loadNotifications() {

    const user = getLoggedInUser();

    if (!user) {

        document.getElementById("notificationsList").innerHTML = `
            <div class="notification-empty">
                <h3>Please Login</h3>
                <p>You need to login to view notifications.</p>
            </div>
        `;

        return;
    }


    try {

        const response = await fetch(
            `${NOTIFICATION_API_URL}/api/notifications/${user.user_id}`,
            {
            credentials: "include"
            }
        );

        const data = await response.json();


        if (!response.ok) {

            document.getElementById("notificationsList").innerHTML = `
                <div class="notification-empty">
                    <h3>Unable to load notifications</h3>
                    <p>${data.message || "Something went wrong."}</p>
                </div>
            `;

            return;
        }


        displayNotifications(data.notifications || []);

    } catch (error) {

        console.error("Notification error:", error);

        document.getElementById("notificationsList").innerHTML = `
            <div class="notification-empty">
                <h3>Server Connection Error</h3>
                <p>Unable to connect to Blood Bank server.</p>
            </div>
        `;
    }
}


// ==========================================
// DISPLAY NOTIFICATIONS
// ==========================================

function displayNotifications(notifications) {

    const container =
        document.getElementById("notificationsList");

    const totalElement =
        document.getElementById("totalNotifications");

    const unreadElement =
        document.getElementById("unreadNotifications");


    totalElement.textContent = notifications.length;


    const unreadCount = notifications.filter(
        notification => Number(notification.is_read) === 0
    ).length;


    unreadElement.textContent = unreadCount;


    if (notifications.length === 0) {

        container.innerHTML = `
            <div class="notification-empty">

                <div class="empty-icon">
                    🔔
                </div>

                <h3>No Notifications</h3>

                <p>
                    You don't have any notifications yet.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML = notifications.map(notification => {

        const unreadClass =
            Number(notification.is_read) === 0
                ? "unread"
                : "";


        const readButton =
            Number(notification.is_read) === 0
                ? `
                    <button
                        class="read-btn"
                        onclick="markAsRead(${notification.notification_id})">
                        ✓ Mark as Read
                    </button>
                  `
                : `
                    <span class="read-status">
                        ✓ Read
                    </span>
                  `;


        return `

            <div class="notification-card ${unreadClass}">

                <div class="notification-icon">
                    ${getNotificationIcon(
                        notification.notification_type
                    )}
                </div>


                <div class="notification-content">

                    <div class="notification-title-row">

                        <h3>
                            ${escapeHtml(notification.title)}
                        </h3>

                        ${
                            Number(notification.is_read) === 0
                                ? '<span class="unread-badge">NEW</span>'
                                : ''
                        }

                    </div>


                    <p>
                        ${escapeHtml(notification.message)}
                    </p>


                    <small>
                        ${formatNotificationDate(
                            notification.created_at
                        )}
                    </small>


                    <div class="notification-card-action">
                        ${readButton}
                    </div>

                </div>

            </div>
        `;

    }).join("");
}


// ==========================================
// NOTIFICATION ICON
// ==========================================

function getNotificationIcon(type) {

    switch (type) {

        case "request":
            return "📋";

        case "approval":
            return "✅";

        case "rejection":
            return "❌";

        case "issue":
        case "blood_issued":
        return "🩸";
        
        case "donation":
            return "💉";

        case "general":
            return "🔔";

        default:
            return "🔔";
    }
}


// ==========================================
// MARK ONE NOTIFICATION AS READ
// ==========================================

async function markAsRead(notificationId) {

    try {

       
const response = await fetch(
    `${NOTIFICATION_API_URL}/api/notifications/${notificationId}/read`,
    {
        method: "PUT",
        credentials: "include"
    }
);



        const data = await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Unable to mark notification as read."
            );

            return;
        }


        loadNotifications();

    } catch (error) {

        console.error("Mark read error:", error);

        alert(
            "Unable to connect to Blood Bank server."
        );
    }
}


// ==========================================
// MARK ALL AS READ
// ==========================================

async function markAllAsRead() {

    const user = getLoggedInUser();

    if (!user) {
        return;
    }


    try {

        
const response = await fetch(
    `${NOTIFICATION_API_URL}/api/notifications/${user.user_id}/read-all`,
    {
        method: "PUT",
        credentials: "include"
    }
);



        const data = await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Unable to mark notifications as read."
            );

            return;
        }


        loadNotifications();

    } catch (error) {

        console.error("Mark all read error:", error);

        alert(
            "Unable to connect to Blood Bank server."
        );
    }
}


// ==========================================
// FORMAT DATE
// ==========================================

function formatNotificationDate(dateValue) {

    if (!dateValue) {
        return "";
    }


    const date = new Date(dateValue);


    if (isNaN(date.getTime())) {
        return dateValue;
    }


    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


// ==========================================
// SECURITY - ESCAPE HTML
// ==========================================

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==========================================
// PAGE START
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadNotifications();


        const markAllButton =
            document.getElementById("markAllReadBtn");


        if (markAllButton) {

            markAllButton.addEventListener(
                "click",
                markAllAsRead
            );
        }

    }
);