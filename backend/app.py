import os
from datetime import timedelta
from functools import wraps

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from db import get_db_connection
from werkzeug.security import generate_password_hash, check_password_hash
app = Flask(__name__)

app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY")

if not app.config["SECRET_KEY"]:
    raise RuntimeError("FLASK_SECRET_KEY is missing from .env")

app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False  # Localhost HTTP development
app.permanent_session_lifetime = timedelta(hours=2)

CORS(app, supports_credentials=True)


def staff_admin_required(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        user_id = session.get("user_id")

        if not user_id:
            return jsonify({
                "status": "error",
                "message": "Please log in first."
            }), 401

        connection = None
        cursor = None

        try:
            connection = get_db_connection()
            cursor = connection.cursor(dictionary=True)

            cursor.execute(
                "SELECT role, status FROM users WHERE user_id = %s",
                (user_id,)
            )
            user = cursor.fetchone()

            if not user or user["status"] != "active":
                session.clear()
                return jsonify({
                    "status": "error",
                    "message": "Account is inactive or unavailable."
                }), 403

            if user["role"] not in ("staff", "admin"):
                return jsonify({
                    "status": "error",
                    "message": "Access denied. Staff/Admin only."
                }), 403

            return function(*args, **kwargs)

        except Exception:
            app.logger.exception("Staff/Admin authorization failed")
            return jsonify({
                "status": "error",
                "message": "Unable to verify your account."
            }), 500

        finally:
            if cursor:
                cursor.close()
            if connection and connection.is_connected():
                connection.close()

    return wrapper

    
# ---------------- LOGOUT ----------------

@app.route("/api/logout", methods=["POST"])
def logout_api():
    session.clear()

    return jsonify({
        "status": "success",
        "message": "Logged out successfully."
    }), 200



# ---------------- HOME ----------------

@app.route("/")
def home():
    return jsonify({
        "message": "Blood Bank Management System Backend is Running"
    })


# ---------------- TEST DATABASE ----------------

@app.route("/test-db")
def test_database():
    try:
        connection = get_db_connection()

        if connection.is_connected():
            connection.close()

            return jsonify({
                "status": "success",
                "message": "MySQL Database Connected Successfully"
            })

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        })


# ---------------- REGISTER ----------------

@app.route("/api/register", methods=["POST"])
def register():

    try:
        data = request.get_json()

        full_name = data.get("full_name")
        email = data.get("email")
        phone = data.get("phone")
        password = data.get("password")
        role = data.get("role")

        # Check required fields
        if not full_name or not email or not password or not role:
            return jsonify({
                "status": "error",
                "message": "Please fill all required fields"
            }), 400

        # Allowed roles
        allowed_roles = [
            "donor",
            "patient",
            "hospital",
            "staff",
            "admin"
        ]

        if role not in allowed_roles:
            return jsonify({
                "status": "error",
                "message": "Invalid role selected"
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        # Check existing email
        cursor.execute(
            "SELECT user_id FROM users WHERE email = %s",
            (email,)
        )

        existing_user = cursor.fetchone()

        if existing_user:
            cursor.close()
            connection.close()

            return jsonify({
                "status": "error",
                "message": "Email already registered"
            }), 409

        # Hash password
        password_hash = generate_password_hash(password)

        # Insert user
        query = """
            INSERT INTO users
            (full_name, email, phone, password_hash, role)
            VALUES (%s, %s, %s, %s, %s)
        """

        cursor.execute(
            query,
            (
                full_name,
                email,
                phone,
                password_hash,
                role
            )
        )

        connection.commit()

        user_id = cursor.lastrowid

        cursor.close()
        connection.close()

        return jsonify({
            "status": "success",
            "message": "Registration successful",
            "user_id": user_id
        }), 201

    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


# ---------------- LOGIN ----------------

@app.route("/api/login", methods=["POST"])
def login():

    try:
        data = request.get_json()

        email = data.get("email")
        password = data.get("password")
        role = data.get("role")

        if not email or not password or not role:
            return jsonify({
                "status": "error",
                "message": "Please enter email, password and role"
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT user_id, full_name, email, phone,
                   password_hash, role, status
            FROM users
            WHERE email = %s
        """

        cursor.execute(query, (email,))
        user = cursor.fetchone()

        cursor.close()
        connection.close()

        # User not found
        if not user:
            return jsonify({
                "status": "error",
                "message": "Invalid email or password"
            }), 401

        
        # Check account status
        if user["status"] == "blocked":
            return jsonify({
                "status": "error",
                "message": "Your account has been blocked. Please contact the administrator."
            }), 403

        if user["status"] == "inactive":
            return jsonify({
                "status": "error",
                "message": "Your account is inactive. Please contact the administrator."
            }), 403

        if user["status"] != "active":
            return jsonify({
                "status": "error",
                "message": "Your account cannot log in. Please contact the administrator."
            }), 403


        # Check password
        if not check_password_hash(
            user["password_hash"],
            password
        ):
            return jsonify({
                "status": "error",
                "message": "Invalid email or password"
            }), 401

        # Check selected role
        if user["role"] != role:
            return jsonify({
                "status": "error",
                "message": "Selected role does not match your account"
            }), 403

        session.clear()
        session.permanent = True
        session["user_id"] = user["user_id"]
        session["role"] = user["role"]

        return jsonify({
            "status": "success",
            "message": "Login successful",
            "user": {
                "user_id": user["user_id"],
                "full_name": user["full_name"],
                "email": user["email"],
                "phone": user["phone"],
                "role": user["role"]
         }
       }), 200

    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500
    # ---------------- DONOR PROFILE ----------------

@app.route("/api/donors", methods=["POST"])
def create_donor_profile():

    try:
        data = request.get_json()

        user_id = data.get("user_id")
        blood_group = data.get("blood_group")
        date_of_birth = data.get("date_of_birth")
        gender = data.get("gender")
        address = data.get("address")
        medical_history = data.get("medical_history")

        # Required fields
        if not user_id or not blood_group or not date_of_birth or not gender or not address:
            return jsonify({
                "status": "error",
                "message": "Please fill all required donor details"
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        # Check whether donor profile already exists
        cursor.execute(
            "SELECT donor_id FROM donors WHERE user_id = %s",
            (user_id,)
        )

        existing_donor = cursor.fetchone()

        if existing_donor:
            cursor.close()
            connection.close()

            return jsonify({
                "status": "error",
                "message": "Donor profile already exists"
            }), 409

        # Insert donor profile
        query = """
            INSERT INTO donors
            (
                user_id,
                blood_group,
                date_of_birth,
                gender,
                address,
                medical_history
            )
            VALUES (%s, %s, %s, %s, %s, %s)
        """

        cursor.execute(
            query,
            (
                user_id,
                blood_group,
                date_of_birth,
                gender,
                address,
                medical_history
            )
        )

        connection.commit()

        donor_id = cursor.lastrowid

        cursor.close()
        connection.close()

        return jsonify({
            "status": "success",
            "message": "Donor profile saved successfully",
            "donor_id": donor_id
        }), 201

    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500
    # ---------------- GET DONOR PROFILE ----------------

@app.route("/api/donors/<int:user_id>", methods=["GET"])
def get_donor_profile(user_id):

    try:

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT
                donor_id,
                user_id,
                blood_group,
                date_of_birth,
                gender,
                address,
                medical_history,
                last_donation_date,
                donor_status
            FROM donors
            WHERE user_id = %s
        """

        cursor.execute(query, (user_id,))

        donor = cursor.fetchone()

        cursor.close()
        connection.close()


        if not donor:

            return jsonify({
                "status": "error",
                "message": "Donor profile not found"
            }), 404


        # Convert date to string for JSON
        if donor["date_of_birth"]:
            donor["date_of_birth"] = str(
                donor["date_of_birth"]
            )

        if donor["last_donation_date"]:
            donor["last_donation_date"] = str(
                donor["last_donation_date"]
            )


        return jsonify({
            "status": "success",
            "donor": donor
        }), 200


    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


# ---------------- UPDATE DONOR PROFILE ----------------

@app.route("/api/donors/<int:user_id>", methods=["PUT"])
def update_donor_profile(user_id):

    try:

        data = request.get_json()

        blood_group = data.get("blood_group")
        date_of_birth = data.get("date_of_birth")
        gender = data.get("gender")
        address = data.get("address")
        medical_history = data.get("medical_history")


        if (
            not blood_group
            or not date_of_birth
            or not gender
            or not address
        ):

            return jsonify({
                "status": "error",
                "message": "Please fill all required donor details"
            }), 400


        connection = get_db_connection()
        cursor = connection.cursor()


        query = """
            UPDATE donors
            SET
                blood_group = %s,
                date_of_birth = %s,
                gender = %s,
                address = %s,
                medical_history = %s
            WHERE user_id = %s
        """


        cursor.execute(
            query,
            (
                blood_group,
                date_of_birth,
                gender,
                address,
                medical_history,
                user_id
            )
        )


        connection.commit()

        affected_rows = cursor.rowcount


        cursor.close()
        connection.close()


        if affected_rows == 0:

            return jsonify({
                "status": "error",
                "message": "Donor profile not found"
            }), 404


        return jsonify({
            "status": "success",
            "message": "Donor profile updated successfully"
        }), 200


    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500
    # ---------------- GET ALL DONORS FOR STAFF ----------------

@app.route("/api/staff/donors", methods=["GET"])
def get_all_donors_for_staff():

    try:

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT
                d.donor_id,
                d.user_id,
                u.full_name,
                u.email,
                u.phone,
                d.blood_group,
                d.date_of_birth,
                d.gender,
                d.address,
                d.medical_history,
                d.last_donation_date,
                d.donor_status
            FROM donors d
            INNER JOIN users u
                ON d.user_id = u.user_id
            ORDER BY d.donor_id DESC
        """

        cursor.execute(query)

        donors = cursor.fetchall()

        cursor.close()
        connection.close()

        # Convert dates to strings
        for donor in donors:

            if donor["date_of_birth"]:
                donor["date_of_birth"] = str(
                    donor["date_of_birth"]
                )

            if donor["last_donation_date"]:
                donor["last_donation_date"] = str(
                    donor["last_donation_date"]
                )

        return jsonify({
            "status": "success",
            "donors": donors
        }), 200

    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    # ================================
# PATIENT PROFILE API
# ================================

# ---------------- CREATE PATIENT PROFILE ----------------

@app.route("/api/patients", methods=["POST"])
def create_patient_profile():

    try:

        data = request.get_json()

        user_id = data.get("user_id")
        blood_group = data.get("blood_group")
        date_of_birth = data.get("date_of_birth")
        gender = data.get("gender")
        address = data.get("address")
        medical_condition = data.get("medical_condition")


        # Required fields
        if not user_id or not blood_group:
            return jsonify({
                "status": "error",
                "message": "Blood group is required"
            }), 400


        connection = get_db_connection()
        cursor = connection.cursor()


        # Check whether patient profile already exists
        cursor.execute(
            "SELECT patient_id FROM patients WHERE user_id = %s",
            (user_id,)
        )

        existing_patient = cursor.fetchone()


        if existing_patient:

            # Update existing patient profile
            query = """
                UPDATE patients
                SET
                    blood_group = %s,
                    date_of_birth = %s,
                    gender = %s,
                    address = %s,
                    medical_condition = %s
                WHERE user_id = %s
            """

            cursor.execute(
                query,
                (
                    blood_group,
                    date_of_birth,
                    gender,
                    address,
                    medical_condition,
                    user_id
                )
            )

            connection.commit()

            cursor.close()
            connection.close()

            return jsonify({
                "status": "success",
                "message": "Patient profile updated successfully"
            }), 200


        # Insert new patient profile
        query = """
            INSERT INTO patients
            (
                user_id,
                blood_group,
                date_of_birth,
                gender,
                address,
                medical_condition
            )
            VALUES (%s, %s, %s, %s, %s, %s)
        """

        cursor.execute(
            query,
            (
                user_id,
                blood_group,
                date_of_birth,
                gender,
                address,
                medical_condition
            )
        )

        connection.commit()

        patient_id = cursor.lastrowid

        cursor.close()
        connection.close()


        return jsonify({
            "status": "success",
            "message": "Patient profile saved successfully",
            "patient_id": patient_id
        }), 201


    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


# ---------------- GET PATIENT PROFILE ----------------

@app.route("/api/patients/<int:user_id>", methods=["GET"])
def get_patient_profile(user_id):

    try:

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)


        query = """
            SELECT
                patient_id,
                user_id,
                blood_group,
                date_of_birth,
                gender,
                address,
                medical_condition
            FROM patients
            WHERE user_id = %s
        """


        cursor.execute(query, (user_id,))

        patient = cursor.fetchone()


        cursor.close()
        connection.close()


        if not patient:

            return jsonify({
                "status": "error",
                "message": "Patient profile not found"
            }), 404


        # Convert date to string
        if patient["date_of_birth"]:

            patient["date_of_birth"] = str(
                patient["date_of_birth"]
            )


        return jsonify({
            "status": "success",
            "patient": patient
        }), 200


    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500
        # ================================
# BLOOD INVENTORY API
# ================================

@app.route("/api/blood-stock", methods=["GET"])
def get_blood_stock():

    try:

        connection = get_db_connection()

        cursor = connection.cursor(dictionary=True)

        # Automatically mark expired blood units
        cursor.execute("""
            UPDATE blood_inventory
            SET status = 'expired'
            WHERE expiry_date < CURDATE()
            AND status = 'available'
            """)

        connection.commit()
        

        query = """
            SELECT
                blood_unit_id,
                blood_group,
                component_type,
                quantity,
                collection_date,
                expiry_date,
                storage_location,
                status,
                donor_id
            FROM blood_inventory
            ORDER BY blood_group
        """

        cursor.execute(query)

        stock = cursor.fetchall()

        cursor.close()
        connection.close()

        # Convert dates to strings for JSON
        for item in stock:

            if item["collection_date"]:
                item["collection_date"] = str(
                    item["collection_date"]
                )

            if item["expiry_date"]:
                item["expiry_date"] = str(
                    item["expiry_date"]
                )

        return jsonify({
            "status": "success",
            "blood_stock": stock
        }), 200

    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500
    # ================================
# ADD BLOOD STOCK API
# ================================

@app.route("/api/blood-stock", methods=["POST"])
def add_blood_stock():

    try:

        data = request.get_json()

        blood_group = data.get("blood_group")
        component_type = data.get("component_type")
        quantity = data.get("quantity")
        collection_date = data.get("collection_date")
        expiry_date = data.get("expiry_date")
        storage_location = data.get("storage_location")
        donor_id = data.get("donor_id")


        # ================================
        # REQUIRED FIELD VALIDATION
        # ================================

        if (
            not blood_group or
            not component_type or
            not quantity or
            not collection_date or
            not expiry_date
        ):

            return jsonify({
                "status": "error",
                "message": "Please fill all required blood stock details"
            }), 400


        # ================================
        # QUANTITY VALIDATION
        # ================================

        if int(quantity) <= 0:

            return jsonify({
                "status": "error",
                "message": "Quantity must be greater than 0"
            }), 400


        connection = get_db_connection()

        cursor = connection.cursor()


        # ================================
        # INSERT BLOOD STOCK
        # ================================

        query = """
            INSERT INTO blood_inventory
            (
                blood_group,
                component_type,
                quantity,
                collection_date,
                expiry_date,
                storage_location,
                status,
                donor_id
            )
            VALUES (%s, %s, %s, %s, %s, %s, 'available', %s)
        """


        cursor.execute(
            query,
            (
                blood_group,
                component_type,
                quantity,
                collection_date,
                expiry_date,
                storage_location,
                donor_id
            )
        )


        connection.commit()

        blood_unit_id = cursor.lastrowid


        cursor.close()
        connection.close()


        return jsonify({
            "status": "success",
            "message": "Blood stock added successfully",
            "blood_unit_id": blood_unit_id
        }), 201


    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500
    # ================================
# BLOOD REQUEST API
# ================================



# ================================
# CREATE BLOOD REQUEST
# ================================

@app.route("/api/blood-requests", methods=["POST"])
def create_blood_request():
    connection = None
    cursor = None
    try:
        data = request.get_json()

        user_id = session.get("user_id")

        if not user_id:
            return jsonify({
                "status": "error",
                "message": "Please log in first"
            }), 401

        patient_id = None
        hospital_id = None

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT role FROM users WHERE user_id = %s AND status = 'active'",
            (user_id,)
        )
        logged_in_user = cursor.fetchone()

        if not logged_in_user:
            cursor.close()
            connection.close()
            session.clear()
            return jsonify({
                "status": "error",
                "message": "User account is inactive or unavailable"
            }), 403

        if logged_in_user["role"] == "patient":
            cursor.execute(
                "SELECT patient_id FROM patients WHERE user_id = %s",
                (user_id,)
            )
            patient = cursor.fetchone()

            if not patient:
                cursor.close()
                connection.close()
                return jsonify({
                    "status": "error",
                    "message": "Patient profile not found"
                }), 400

            patient_id = patient["patient_id"]

        elif logged_in_user["role"] == "hospital":
            cursor.execute(
                "SELECT hospital_id FROM hospitals WHERE user_id = %s",
                (user_id,)
            )
            hospital = cursor.fetchone()

            if not hospital:
                cursor.close()
                connection.close()
                return jsonify({
                    "status": "error",
                    "message": "Hospital profile not found"
                }), 400

            hospital_id = hospital["hospital_id"]

        else:
            cursor.close()
            connection.close()
            return jsonify({
                "status": "error",
                "message": (
                    "Only patient or hospital accounts can "
                    "submit blood requests"
                )
            }), 403

        blood_group = data.get("blood_group")
        component_type = data.get("component_type")
        quantity = data.get("quantity")
        urgency = data.get("urgency", "normal")
        required_date = data.get("required_date")
        reason = data.get("reason")

        

        # ================================
        # QUANTITY VALIDATION
        # ================================

        try:

            quantity = int(quantity)

        except:

            return jsonify({
                "status": "error",
                "message": "Quantity must be a valid number"
            }), 400


        if quantity <= 0:

            return jsonify({
                "status": "error",
                "message": "Quantity must be greater than 0"
            }), 400


        # ================================
        # BLOOD GROUP VALIDATION
        # ================================

        valid_blood_groups = [
            "A+",
            "A-",
            "B+",
            "B-",
            "O+",
            "O-",
            "AB+",
            "AB-"
        ]


        if blood_group not in valid_blood_groups:

            return jsonify({
                "status": "error",
                "message": "Invalid blood group"
            }), 400


        # ================================
        # COMPONENT VALIDATION
        # ================================

        valid_components = [
            "Whole Blood",
            "Plasma",
            "Platelets"
        ]


        if component_type not in valid_components:

            return jsonify({
                "status": "error",
                "message": "Invalid component type"
            }), 400


        # ================================
        # URGENCY VALIDATION
        # ================================

        valid_urgency = [
            "normal",
            "urgent",
            "critical"
        ]


        if urgency not in valid_urgency:

            return jsonify({
                "status": "error",
                "message": "Invalid urgency level"
            }), 400


        


        # ================================
        # INSERT REQUEST
        # ================================

        query = """
            INSERT INTO blood_requests
            (
                patient_id,
                hospital_id,
                blood_group,
                component_type,
                quantity,
                urgency,
                required_date,
                reason,
                status
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                'pending'
            )
        """


        cursor.execute(
            query,
            (
                patient_id,
                hospital_id,
                blood_group,
                component_type,
                quantity,
                urgency,
                required_date,
                reason
            )
        )


               # ================================
        # GET REQUEST ID
        # ================================

        request_id = cursor.lastrowid


        # ================================
        # CREATE NOTIFICATION
        # ================================

        if user_id:

            cursor.execute(
                """
                INSERT INTO notifications
                (
                    user_id,
                    title,
                    message,
                    notification_type,
                    is_read
                )
                VALUES (%s, %s, %s, %s, 0)
                """,
                (
                    user_id,
                    "Blood Request Submitted",
                    f"Your request for {blood_group} {component_type} has been submitted successfully.",
                    "request"
                )
            )


        # ================================
        # COMMIT REQUEST + NOTIFICATION
        # ================================

        connection.commit()


        cursor.close()
        connection.close()


        # ================================
        # SUCCESS RESPONSE
        # ================================

        return jsonify({
            "status": "success",
            "message": "Blood request submitted successfully",
            "request_id": request_id
        }), 201

    except Exception as error:
        if connection and connection.is_connected():
            connection.rollback()

        print("Blood request error:", error)

        return jsonify({
            "status": "error",
            "message": "Failed to submit blood request"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# ================================
# GET ALL BLOOD REQUESTS
# ================================

@app.route("/api/blood-requests", methods=["GET"])
def get_blood_requests():

    try:

        connection = get_db_connection()

        cursor = connection.cursor(
            dictionary=True
        )
       


        query = """
            SELECT
                request_id,
                patient_id,
                hospital_id,
                blood_group,
                component_type,
                quantity,
                urgency,
                request_date,
                required_date,
                reason,
                status,
                approved_by
            FROM blood_requests
            ORDER BY request_date DESC
        """


        cursor.execute(query)


        requests = cursor.fetchall()


        cursor.close()
        connection.close()


        # Convert dates/timestamps to strings

        for item in requests:

            if item["request_date"]:

                item["request_date"] = str(
                    item["request_date"]
                )


            if item["required_date"]:

                item["required_date"] = str(
                    item["required_date"]
                )


        return jsonify({

            "status": "success",

            "blood_requests":
                requests

        }), 200


    except Exception as error:

        return jsonify({

            "status": "error",

            "message":
                str(error)

        }), 500
    
# ==========================================
# UPDATE BLOOD REQUEST STATUS
# ==========================================

@app.route("/api/blood-requests/<int:request_id>/status", methods=["PUT"])
@staff_admin_required
def update_blood_request_status(request_id):

    connection = None
    cursor = None

    try:
        data = request.get_json(silent=True) or {}
        status = data.get("status")
        approved_by = data.get("approved_by")

        allowed_statuses = [
            "pending", "approved", "rejected", "fulfilled"
        ]

        if status not in allowed_statuses:
            return jsonify({
                "status": "error",
                "message": "Invalid request status"
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get request details, including the actual owner
        cursor.execute(
            """
            SELECT
                request_id,
                patient_id,
                hospital_id,
                blood_group,
                component_type,
                quantity,
                status
            FROM blood_requests
            WHERE request_id = %s
            FOR UPDATE
            """,
            (request_id,)
        )

        blood_request = cursor.fetchone()

        if not blood_request:
            return jsonify({
                "status": "error",
                "message": "Blood request not found"
            }), 404

        old_status = blood_request["status"]

        if status == "approved":
            if old_status in ("approved", "fulfilled"):
                return jsonify({
                    "status": "error",
                    "message": "Request is already approved or fulfilled"
                }), 400

        elif status == "rejected":
            if old_status == "fulfilled":
                return jsonify({
                    "status": "error",
                    "message": "A fulfilled request cannot be rejected"
                }), 400

        # Update request status
        cursor.execute(
            """
            UPDATE blood_requests
            SET status = %s, approved_by = %s
            WHERE request_id = %s
            """,
            (status, approved_by, request_id)
        )

        # Send notifications only for approval or rejection
        if status in ("approved", "rejected"):

            recipient = None

            if blood_request["patient_id"]:
                cursor.execute(
                    """
                    SELECT user_id
                    FROM patients
                    WHERE patient_id = %s
                    """,
                    (blood_request["patient_id"],)
                )
                recipient = cursor.fetchone()

            elif blood_request["hospital_id"]:
                cursor.execute(
                    """
                    SELECT user_id
                    FROM hospitals
                    WHERE hospital_id = %s
                    """,
                    (blood_request["hospital_id"],)
                )
                recipient = cursor.fetchone()

            if recipient:
                if status == "approved":
                    title = "Blood Request Approved"
                    message = (
                        f"Your blood request #{request_id} for "
                        f"{blood_request['blood_group']} "
                        f"{blood_request['component_type']} has been approved."
                    )
                else:
                    title = "Blood Request Rejected"
                    message = (
                        f"Your blood request #{request_id} for "
                        f"{blood_request['blood_group']} "
                        f"{blood_request['component_type']} has been rejected."
                    )

                cursor.execute(
                    """
                    INSERT INTO notifications
                    (user_id, title, message, notification_type, is_read)
                    VALUES (%s, %s, %s, %s, 0)
                    """,
                    (
                        recipient["user_id"],
                        title,
                        message,
                        "request"
                    )
                )

        connection.commit()

        messages = {
            "approved": "Blood request approved successfully",
            "rejected": "Blood request rejected successfully",
            "fulfilled": "Blood request marked as fulfilled",
            "pending": "Blood request set to pending"
        }

        return jsonify({
            "status": "success",
            "message": messages[status],
            "request_id": request_id,
            "new_status": status
        }), 200

    except Exception:
        if connection:
            connection.rollback()

        app.logger.exception("Failed to update blood request status")
        return jsonify({
            "status": "error",
            "message": "Unable to update blood request status."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()

            # ==========================================
# BLOOD ISSUE RECORD APIs
# ==========================================

@app.route("/api/blood-issues", methods=["POST"])
@staff_admin_required
def issue_blood():

    connection = None
    cursor = None

    try:

        data = request.get_json()

        request_id = data.get("request_id")
        issued_by = session["user_id"]
        remarks = data.get("remarks", "")

        if not request_id or not issued_by:
            return jsonify({
                "status": "error",
                "message": "Request ID and issued by are required"
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # ==========================================
        # 1. GET REQUEST
        # ==========================================

        cursor.execute(
            """
            SELECT
                request_id,
                patient_id,
                hospital_id,
                blood_group,
                component_type,
                quantity,
                status
            FROM blood_requests
            WHERE request_id = %s
            FOR UPDATE
            """,
            (request_id,)
        )

        blood_request = cursor.fetchone()

        if not blood_request:
            return jsonify({
                "status": "error",
                "message": "Blood request not found"
            }), 404

        # ==========================================
        # 2. CHECK REQUEST STATUS
        # ==========================================

        if blood_request["status"] != "approved":
            return jsonify({
                "status": "error",
                "message": "Only approved requests can be issued"
            }), 400

        requested_quantity = blood_request["quantity"]

        # ==========================================
        # 3. FIND AVAILABLE BLOOD STOCK
        # ==========================================

        cursor.execute(
            """
            SELECT
                blood_unit_id,
                quantity
            FROM blood_inventory
            WHERE blood_group = %s
            AND component_type = %s
            AND status = 'available'
            AND expiry_date >= CURDATE()
            AND quantity > 0
            ORDER BY expiry_date ASC
            FOR UPDATE
            """,
            (
                blood_request["blood_group"],
                blood_request["component_type"]
            )
        )

        stock_rows = cursor.fetchall()

        total_available = sum(
            row["quantity"] for row in stock_rows
        )

        if total_available < requested_quantity:
            return jsonify({
                "status": "error",
                "message": (
                    f"Insufficient stock. "
                    f"Required: {requested_quantity}, "
                    f"Available: {total_available}"
                )
            }), 400

        # ==========================================
        # 4. CREATE ISSUE RECORDS
        # ==========================================

        remaining_quantity = requested_quantity
        issue_records = []

        for stock in stock_rows:

            if remaining_quantity <= 0:
                break

            stock_quantity = stock["quantity"]

            issue_quantity = min(
                stock_quantity,
                remaining_quantity
            )

            # Insert issue record
            cursor.execute(
                """
                INSERT INTO blood_issue_records
                (
                    request_id,
                    blood_unit_id,
                    issued_to_patient,
                    issued_to_hospital,
                    issued_by,
                    quantity,
                    remarks
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    request_id,
                    stock["blood_unit_id"],
                    blood_request["patient_id"],
                    blood_request["hospital_id"],
                    issued_by,
                    issue_quantity,
                    remarks
                )
            )

            issue_records.append({
                "blood_unit_id": stock["blood_unit_id"],
                "quantity": issue_quantity
            })

            # ==========================================
            # 5. UPDATE INVENTORY
            # ==========================================

            new_quantity = stock_quantity - issue_quantity

            if new_quantity == 0:

                cursor.execute(
                    """
                    UPDATE blood_inventory
                    SET
                        quantity = 0,
                        status = 'issued'
                    WHERE blood_unit_id = %s
                    """,
                    (stock["blood_unit_id"],)
                )

            else:

                cursor.execute(
                    """
                    UPDATE blood_inventory
                    SET quantity = %s
                    WHERE blood_unit_id = %s
                    """,
                    (
                        new_quantity,
                        stock["blood_unit_id"]
                    )
                )

            remaining_quantity -= issue_quantity

        # ==========================================
        # 6. UPDATE REQUEST
        # ==========================================

        cursor.execute(
            """
            UPDATE blood_requests
            SET status = 'fulfilled'
            WHERE request_id = %s
            """,
            (request_id,)
        )

         # ==========================================
        # 6. CREATE BLOOD ISSUE NOTIFICATION
        # ==========================================

        recipient_user_id = None

        if blood_request["patient_id"]:
            cursor.execute(
                """
                SELECT user_id
                FROM patients
                WHERE patient_id = %s
                """,
                (blood_request["patient_id"],)
            )
            recipient = cursor.fetchone()

            if recipient:
                recipient_user_id = recipient["user_id"]

        elif blood_request["hospital_id"]:
            cursor.execute(
                """
                SELECT user_id
                FROM hospitals
                WHERE hospital_id = %s
                """,
                (blood_request["hospital_id"],)
            )
            recipient = cursor.fetchone()

            if recipient:
                recipient_user_id = recipient["user_id"]

        if recipient_user_id:
            cursor.execute(
                """
                INSERT INTO notifications
                (
                    user_id,
                    title,
                    message,
                    notification_type,
                    is_read
                )
                VALUES (%s, %s, %s, %s, 0)
                """,
                (
                    recipient_user_id,
                    "Blood Issued Successfully",
                    f"Your blood request #{request_id} has been fulfilled. "
                    f"{requested_quantity} unit(s) of "
                    f"{blood_request['blood_group']} "
                    f"{blood_request['component_type']} issued.",
                    "blood_issued"
                )
            )

        

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Blood issued successfully",
            "request_id": request_id,
            "issued_quantity": requested_quantity,
            "issue_records": issue_records
        }), 201

    except Exception as error:

        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()
            
# ==========================================
# GET BLOOD ISSUE HISTORY
# ==========================================

@app.route("/api/blood-issues", methods=["GET"])
@staff_admin_required
def get_blood_issues():

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                bir.issue_id,
                bir.request_id,
                bir.blood_unit_id,
                bi.blood_group,
                bi.component_type,
                bir.quantity,
                bir.issued_to_patient,
                bir.issued_to_hospital,
                bir.issued_by,
                bir.issue_date,
                bir.remarks
            FROM blood_issue_records bir
            INNER JOIN blood_inventory bi
                ON bir.blood_unit_id = bi.blood_unit_id
            ORDER BY bir.issue_date DESC
            """
        )

        records = cursor.fetchall()

        for record in records:
            if record.get("issue_date"):
                record["issue_date"] = record["issue_date"].strftime(
                    "%Y-%m-%d %H:%M:%S"
                )

        return jsonify({
            "status": "success",
            "issue_records": records
        }), 200

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


            # ==========================================
# NOTIFICATION APIs
# ==========================================

# CREATE NOTIFICATION
@app.route("/api/notifications", methods=["POST"])
def create_notification():

    connection = None
    cursor = None

    try:
        data = request.get_json()

        user_id = data.get("user_id")
        title = data.get("title")
        message = data.get("message")
        notification_type = data.get("notification_type", "general")

        if not user_id or not title or not message:
            return jsonify({
                "status": "error",
                "message": "User ID, title and message are required"
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO notifications
            (
                user_id,
                title,
                message,
                notification_type,
                is_read
            )
            VALUES (%s, %s, %s, %s, 0)
            """,
            (
                user_id,
                title,
                message,
                notification_type
            )
        )

        notification_id = cursor.lastrowid

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Notification created successfully",
            "notification_id": notification_id
        }), 201

    except Exception as error:

        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()



# GET LOGGED-IN USER NOTIFICATIONS
@app.route("/api/notifications/<int:user_id>", methods=["GET"])
def get_notifications(user_id):

    connection = None
    cursor = None

    # Check login session
    session_user_id = session.get("user_id")

    if not session_user_id:
        return jsonify({
            "status": "error",
            "message": "Please log in first"
        }), 401

    # Users can only access their own notifications
    if int(session_user_id) != user_id:
        return jsonify({
            "status": "error",
            "message": "You can only view your own notifications"
        }), 403

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                notification_id,
                user_id,
                title,
                message,
                notification_type,
                is_read,
                created_at
            FROM notifications
            WHERE user_id = %s
            ORDER BY created_at DESC
            """,
            (session_user_id,)
        )

        notifications = cursor.fetchall()

        for notification in notifications:
            if notification["created_at"]:
                notification["created_at"] = str(
                    notification["created_at"]
                )

        return jsonify({
            "status": "success",
            "notifications": notifications
        }), 200

    except Exception:
        app.logger.exception("Failed to load notifications")
        return jsonify({
            "status": "error",
            "message": "Unable to load notifications."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()



# MARK NOTIFICATION AS READ
@app.route("/api/notifications/<int:notification_id>/read", methods=["PUT"])
def mark_notification_read(notification_id):

    connection = None
    cursor = None

    # Check login session
    session_user_id = session.get("user_id")

    if not session_user_id:
        return jsonify({
            "status": "error",
            "message": "Please log in first"
        }), 401

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Update only the logged-in user's notification
        cursor.execute(
            """
            UPDATE notifications
            SET is_read = 1
            WHERE notification_id = %s
              AND user_id = %s
            """,
            (notification_id, session_user_id)
        )

        if cursor.rowcount == 0:
            connection.rollback()

            return jsonify({
                "status": "error",
                "message": "Notification not found or access denied"
            }), 404

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Notification marked as read"
        }), 200

    except Exception:
        if connection:
            connection.rollback()

        app.logger.exception("Failed to mark notification as read")
        return jsonify({
            "status": "error",
            "message": "Unable to mark notification as read."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


            

# MARK ALL NOTIFICATIONS AS READ
@app.route("/api/notifications/<int:user_id>/read-all", methods=["PUT"])
def mark_all_notifications_read(user_id):
    connection = None
    cursor = None

    session_user_id = session.get("user_id")

    # Check login
    if not session_user_id:
        return jsonify({
            "status": "error",
            "message": "Please log in first"
        }), 401

    # User can update only their own notifications
    if int(session_user_id) != user_id:
        return jsonify({
            "status": "error",
            "message": "You can only update your own notifications"
        }), 403

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE notifications
            SET is_read = 1
            WHERE user_id = %s
            """,
            (session_user_id,)
        )

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "All notifications marked as read"
        }), 200

    except Exception:
        if connection:
            connection.rollback()

        app.logger.exception("Failed to mark notifications as read")
        return jsonify({
            "status": "error",
            "message": "Unable to mark notifications as read."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


    # =========================
# BLOOD DONATION APIs
# =========================
# =========================
# BLOOD DONATION APIs
# =========================

@app.route("/api/donations", methods=["POST"])
def add_donation():
    data = request.get_json()

    user_id = data.get("donor_id")
    donation_date = data.get("donation_date")
    blood_group = data.get("blood_group")
    component_type = data.get("component_type", "Whole Blood")
    quantity = data.get("quantity", 1)
    health_check_status = data.get("health_check_status", "pending")
    remarks = data.get("remarks", "")

    if not user_id or not donation_date or not blood_group:
        return jsonify({
            "status": "error",
            "message": "Donor information is required"
        }), 400

    if quantity <= 0:
        return jsonify({
            "status": "error",
            "message": "Quantity must be greater than 0"
        }), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Find actual donor_id using logged-in user's user_id
        cursor.execute(
            "SELECT donor_id FROM donors WHERE user_id = %s",
            (user_id,)
        )

        donor = cursor.fetchone()

        if not donor:
            cursor.close()
            conn.close()

            return jsonify({
                "status": "error",
                "message": "Donor profile not found. Please complete your donor profile first."
            }), 404

        actual_donor_id = donor["donor_id"]

        # =========================
        # 1. SAVE DONATION
        # =========================

        insert_query = """
            INSERT INTO blood_donations
            (
                donor_id,
                donation_date,
                blood_group,
                component_type,
                quantity,
                health_check_status,
                remarks
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """

        cursor.execute(insert_query, (
            actual_donor_id,
            donation_date,
            blood_group,
            component_type,
            quantity,
            health_check_status,
            remarks
        ))

        donation_id = cursor.lastrowid

        # =========================
        # 2. UPDATE DONOR PROFILE
        # =========================

        cursor.execute(
            """
            UPDATE donors
            SET last_donation_date = %s
            WHERE donor_id = %s
            """,
            (donation_date, actual_donor_id)
        )

        # =========================
        # 3. ADD TO BLOOD STOCK
        # =========================
        health_check_status = str(health_check_status).strip().lower()

        if health_check_status == "passed":

            from datetime import datetime, timedelta

            if component_type == "Whole Blood":
                expiry_days = 35
            elif component_type == "Platelets":
                expiry_days = 5
            else:
                expiry_days = 365

            expiry_date = (
                datetime.strptime(
                    str(donation_date),
                    "%Y-%m-%d"
                ).date()
                + timedelta(days=expiry_days)
            )

            inventory_query = """
                INSERT INTO blood_inventory
                (
                    blood_group,
                    component_type,
                    quantity,
                    collection_date,
                    expiry_date,
                    storage_location,
                    status,
                    donor_id
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """

            cursor.execute(inventory_query, (
                blood_group,
                component_type,
                quantity,
                donation_date,
                expiry_date,
                "Main Blood Bank",
                "available",
                actual_donor_id
            ))

        # =========================
        # 4. SAVE ALL CHANGES
        # =========================

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "message": "Blood donation recorded successfully",
            "donation_id": donation_id,
            "stock_updated": health_check_status == "passed"
        }), 201

    except Exception as e:

        if 'conn' in locals():
            conn.rollback()

        if 'cursor' in locals():
            cursor.close()

        if 'conn' in locals():
            conn.close()

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

    
# ==========================================
# DONOR - GET MY DONATION HISTORY
# ==========================================

@app.route("/api/donations/<int:user_id>", methods=["GET"])
def get_donation_history(user_id):
    connection = None
    cursor = None

    try:
        # Verify logged-in session
        session_user_id = session.get("user_id")

        if not session_user_id:
            return jsonify({
                "status": "error",
                "message": "Please log in first."
            }), 401

        # Donors can only view their own history
        if int(session_user_id) != user_id:
            return jsonify({
                "status": "error",
                "message": "Access denied."
            }), 403

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Convert logged-in user ID to actual donor ID
        cursor.execute(
            "SELECT donor_id FROM donors WHERE user_id = %s",
            (session_user_id,)
        )
        donor = cursor.fetchone()

        if not donor:
            return jsonify({
                "status": "success",
                "donations": []
            }), 200

        cursor.execute("""
            SELECT donation_id, blood_group, component_type,
                   quantity, donation_date, health_check_status, remarks
            FROM blood_donations
            WHERE donor_id = %s
            ORDER BY donation_date DESC
        """, (donor["donor_id"],))

        donations = cursor.fetchall()

        for donation in donations:
            if donation["donation_date"]:
                donation["donation_date"] = str(
                    donation["donation_date"]
                )

        return jsonify({
            "status": "success",
            "donations": donations
        }), 200

    except Exception as error:
        print("Donation history error:", error)
        return jsonify({
            "status": "error",
            "message": "Unable to load donation history."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

    





    # ==========================================
# ADMIN - GET ALL USERS
# ==========================================

@app.route("/api/admin/users", methods=["GET"])
def get_all_users_for_admin():
    try:
        # Verify admin identity from request header.
        # This is a temporary check for local development;
        # it is NOT secure authentication by itself.
        admin_user_id = request.headers.get("X-Admin-User-ID")

        if not admin_user_id:
            return jsonify({
                "status": "error",
                "message": "Admin authentication required."
            }), 401

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT user_id, full_name, email, phone, role, status
            FROM users
            WHERE user_id = %s AND role = 'admin'
            """,
            (admin_user_id,)
        )
        admin = cursor.fetchone()

        if not admin:
            cursor.close()
            connection.close()
            return jsonify({
                "status": "error",
                "message": "Access denied. Admin account required."
            }), 403

        cursor.execute(
            """
            SELECT user_id, full_name, email, phone, role, status
            FROM users
            ORDER BY user_id DESC
            """
        )

        users = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify({
            "status": "success",
            "users": users
        }), 200

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500
    
# ==========================================
# ADMIN - UPDATE USER STATUS OR ROLE
# ==========================================

@app.route("/api/admin/users/<int:user_id>", methods=["PUT"])
def update_admin_user(user_id):
    connection = None
    cursor = None

    try:
        admin_user_id = request.headers.get("X-Admin-User-ID")
        data = request.get_json(silent=True) or {}

        if not admin_user_id:
            return jsonify({
                "status": "error",
                "message": "Admin authentication required."
            }), 401

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Verify that the requester is an admin
        cursor.execute(
            "SELECT user_id FROM users WHERE user_id = %s AND role = 'admin' AND status = 'active'",
            (admin_user_id,)
        )
        admin = cursor.fetchone()

        if not admin:
            return jsonify({
                "status": "error",
                "message": "Active admin account required."
            }), 403

        # Prevent admins from changing their own account
        if int(admin_user_id) == user_id:
            return jsonify({
                "status": "error",
                "message": "You cannot change your own account here."
            }), 400

        cursor.execute(
            "SELECT user_id, role, status FROM users WHERE user_id = %s",
            (user_id,)
        )
        target_user = cursor.fetchone()

        if not target_user:
            return jsonify({
                "status": "error",
                "message": "User not found."
            }), 404

        allowed_statuses = ["active", "inactive", "blocked"]
        allowed_roles = ["donor", "patient", "hospital", "staff", "admin"]

        new_status = data.get("status")
        new_role = data.get("role")

        if new_status is None and new_role is None:
            return jsonify({
                "status": "error",
                "message": "Provide a status or role to update."
            }), 400

        if new_status is not None and new_status not in allowed_statuses:
            return jsonify({
                "status": "error",
                "message": "Invalid status."
            }), 400

        if new_role is not None and new_role not in allowed_roles:
            return jsonify({
                "status": "error",
                "message": "Invalid role."
            }), 400

        # Protect the last active admin account
        removing_admin = (
            target_user["role"] == "admin"
            and (
                new_role is not None and new_role != "admin"
                or new_status is not None and new_status != "active"
            )
        )

        if removing_admin:
            cursor.execute("""
                SELECT COUNT(*) AS total
                FROM users
                WHERE role = 'admin' AND status = 'active'
            """)
            active_admins = cursor.fetchone()["total"]

            if active_admins <= 1:
                return jsonify({
                    "status": "error",
                    "message": "The last active admin cannot be disabled or demoted."
                }), 400

        updates = []
        values = []

        if new_status is not None:
            updates.append("status = %s")
            values.append(new_status)

        if new_role is not None:
            updates.append("role = %s")
            values.append(new_role)

        values.append(user_id)

        cursor.execute(
            f"UPDATE users SET {', '.join(updates)} WHERE user_id = %s",
            tuple(values)
        )
        connection.commit()

        return jsonify({
            "status": "success",
            "message": "User updated successfully."
        }), 200

    except Exception as error:
        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

    

    
@app.route("/api/admin/reports", methods=["GET"])
def get_admin_reports():
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Total registered donors
        cursor.execute("""
            SELECT COUNT(*) AS total_donors
            FROM donors
        """)
        total_donors = cursor.fetchone()["total_donors"]

        # Available, non-expired blood units
        cursor.execute("""
            SELECT COALESCE(SUM(quantity), 0) AS total_units
            FROM blood_inventory
            WHERE status = 'available'
              AND expiry_date >= CURDATE()
        """)
        total_units = cursor.fetchone()["total_units"]

        # Pending blood requests
        cursor.execute("""
            SELECT COUNT(*) AS pending_requests
            FROM blood_requests
            WHERE status = 'pending'
        """)
        pending_requests = cursor.fetchone()["pending_requests"]

        # Total donations recorded
        cursor.execute("""
            SELECT COUNT(*) AS total_donations
            FROM blood_donations
        """)
        total_donations = cursor.fetchone()["total_donations"]

        # Stock grouped by blood group and component
        cursor.execute("""
            SELECT
                blood_group,
                component_type,
                SUM(quantity) AS quantity,
                MIN(expiry_date) AS nearest_expiry,
                GROUP_CONCAT(DISTINCT storage_location
                    SEPARATOR ', ') AS storage_location
            FROM blood_inventory
            WHERE status = 'available'
              AND expiry_date >= CURDATE()
            GROUP BY blood_group, component_type
            ORDER BY blood_group, component_type
        """)
        inventory = cursor.fetchall()

        return jsonify({
            "success": True,
            "summary": {
                "totalDonors": total_donors,
                "totalUnits": total_units,
                "pendingRequests": pending_requests,
                "totalDonations": total_donations
            },
            "inventory": [
                {
                    "blood_group": row["blood_group"],
                    "component_type": row["component_type"],
                    "quantity": row["quantity"],
                    "expiry_date": (
                        row["nearest_expiry"].isoformat()
                        if row["nearest_expiry"] else None
                    ),
                    "storage_location": row["storage_location"] or "Not specified",
                    "status": "Available"
                }
                for row in inventory
            ]
        }), 200

    except Exception as e:
        print("Admin reports error:", e)
        return jsonify({
            "success": False,
            "message": "Unable to load admin reports."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
 # ---------------- RUN SERVER ----------------
            
if __name__ == "__main__":
  app.run(debug=True)

