# 🩸 Blood Bank Management System (BBMS)

A web-based **Blood Bank Management System** designed to manage blood donations, blood inventory, blood requests, donor records, and blood distribution efficiently.

## 📌 Project Overview

The Blood Bank Management System helps streamline blood bank operations by connecting donors, patients, staff, and administrators through a centralized platform. It helps users check blood availability, manage donations, process blood requests, and maintain inventory records.

The system aims to improve the efficiency, accuracy, and accessibility of blood bank management.

## ✨ Features

### 👤 User Roles
- **Donor:** Manage donor profiles, submit donation details, and view donation history.
- **Patient:** Check blood availability, submit blood requests, track request status, and view notifications.
- **Staff:** Manage donor records, blood collection, inventory, and blood requests.
- **Admin:** Manage users, monitor the system, and generate reports.

### 🩸 Blood Inventory Management
- View blood stock by blood group.
- Search and filter available blood units.
- Track blood components, quantities, expiry dates, and storage locations.
- Update inventory through blood collection and issue operations.

### 📝 Blood Request Management
- Submit blood requests.
- Approve or reject requests.
- Issue blood according to availability.
- Track request status and blood issue history.
- Prevent issuing more blood than the available inventory.

### 📊 Reports and Notifications
- View administrative reports.
- Export reports to CSV.
- Receive notifications about relevant activities.
- Maintain donor and donation history.

### 🔐 Security
- Role-based access control.
- Session-based authentication.
- Environment variables for sensitive configuration.
- Git ignore rules to help prevent uploading secrets and virtual environments.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Web page structure |
| CSS3 | Styling and responsive UI |
| JavaScript | Frontend interactions and API requests |
| Python | Backend programming |
| Flask | Backend framework and REST APIs |
| MySQL | Database management |
| mysql-connector-python | MySQL connectivity |
| Flask-CORS | Cross-origin API communication |
| python-dotenv | Environment variable configuration |
| Git and GitHub | Version control and source code hosting |

## 📂 Project Structure

```text
Blood-Bank-Management-System/
├── backend/
│   ├── app.py
│   ├── db.py
│   ├── requirements.txt
│   └── .env                 # Local only; do not upload
├── frontend/
│   ├── css/
│   │   ├── style.css
│   │   └── admin-reports.css
│   ├── js/
│   │   ├── auth.js
│   │   ├── blood-stock.js
│   │   ├── requests.js
│   │   └── ...
│   ├── images/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   └── role-dashboard.html
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites

Install the following software before running the project:

- Python 3
- MySQL or XAMPP
- Visual Studio Code
- Git
- A modern web browser

### 1. Clone the Repository

Open a terminal and run:

```bash
git clone https://github.com/vaish-2navi/Blood-Bank-Management-System.git
cd Blood-Bank-Management-System
```

### 2. Create and Activate a Virtual Environment

```bash
python -m venv backend/venv
```

For Windows PowerShell:

```powershell
.\backend\venv\Scripts\Activate.ps1
```

### 3. Install Dependencies

```bash
pip install -r backend/requirements.txt
```

### 4. Configure the MySQL Database

1. Start MySQL using XAMPP or your installed MySQL server.
2. Open phpMyAdmin.
3. Create a database named `bbms_db`.
4. Import your project's database SQL file if available, or create the required tables using your database schema.

**Note:** The database schema or SQL export must be included separately if another developer needs to recreate the database.

### 5. Configure Environment Variables

Create a local file named `backend/.env`:

```env
DB_HOST=127.0.0.1
DB_PORT=4307
DB_USER=root
DB_PASSWORD=
DB_NAME=bbms_db
FLASK_SECRET_KEY=replace_with_a_random_secret_key
```

Update the database port and credentials to match your local MySQL configuration. The port shown above is an example of the project's local setup.

Generate a strong secret key for your own environment. **Never commit or publish your actual `.env` file or secret key.**

### 6. Start the Backend

From the project root, run:

```powershell
python backend/app.py
```

If the application expects the backend working directory, use:

```powershell
cd backend
python app.py
```

The backend is configured for local development at:

`http://127.0.0.1:5000`

### 7. Start the Frontend

1. Open the project in Visual Studio Code.
2. Install the **Live Server** extension if needed.
3. Right-click `frontend/index.html` or the appropriate login page.
4. Select **Open with Live Server**.

The frontend will open in your browser. If the application uses a separate login page, open `frontend/login.html`.

## 📸 Screenshots

Add screenshots of your running application to the `frontend/images/` folder, then use the following Markdown to display them.

### Login Page

![Login Page](frontend/images/login-screenshot.png)
<img width="638" height="291" alt="image" src="https://github.com/user-attachments/assets/2025c116-5828-460e-8447-0617d99a4e3f" />

### Role Dashboard

![Role Dashboard](frontend/images/dashboard-screenshot.png)
<img width="640" height="285" alt="image" src="https://github.com/user-attachments/assets/762f86a0-322e-4737-a7ee-e07bea004bf8" />

### Blood Stock Management

![Blood Stock Management](frontend/images/blood-stock-screenshot.png)
<img width="631" height="290" alt="image" src="https://github.com/user-attachments/assets/961fab22-8214-47de-a4f4-140a9cd71040" />

### Admin Reports

![Admin Reports](frontend/images/admin-reports-screenshot.png)
<img width="629" height="289" alt="image" src="https://github.com/user-attachments/assets/ef526c1c-d38f-4f66-9dee-081e1d956a98" />

> Replace these example screenshot paths with actual screenshots from your application. Until those images are added, the screenshot previews will not display.

## 🧪 Testing

The system has been tested through manual application workflows, including:

- User registration and login.
- Role-specific dashboard access.
- Blood inventory viewing and filtering.
- Blood collection and inventory updates.
- Blood request approval and rejection.
- Blood issue validation against available stock.
- Notifications and donation history.
- Administrative reports and CSV export.
- Logout and session handling.

## 🔒 Security Notes

- Keep `.env` files and secret keys out of version control.
- Do not use real donor or patient information in public demonstrations.
- Configure strong credentials before deploying the application.
- Use HTTPS and production-grade session and server settings for public deployment.
- This academic project is a demonstration and should not be used for real clinical decisions without appropriate validation and security review.

## 🚀 Future Enhancements

- Email and SMS notifications.
- Automated blood stock expiry alerts.
- Blood donation appointment scheduling.
- Advanced analytics and visual reports.
- Deployment to a secure cloud platform.
- Improved automated testing and audit logging.

## 🎓 Project Information

**Project Name:** Blood Bank Management System  
**Project Type:** Academic / Software Engineering Project  
**Backend:** Python Flask  
**Database:** MySQL  
**Frontend:** HTML, CSS, JavaScript

## 👩‍💻 Author

**Vaishnavi Jadhav**

GitHub: [vaish-2navi](https://github.com/vaish-2navi)

## 📄 License

This project is available for educational purposes. A formal license has not yet been added. Add an MIT License file if you want to distribute the project under the MIT License.
