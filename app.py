from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_mail import Mail, Message
from flask_socketio import SocketIO, emit, join_room, leave_room
from dotenv import load_dotenv
import hashlib
import os
import jwt
import sqlite3
import secrets
import string
import re
import json
import random
from datetime import datetime, timedelta, timezone
from functools import wraps
from ml_routes import register_ml_routes

# ── Load Environment Variables ───────────────────────────────────────
load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', os.urandom(24).hex())

app = register_ml_routes(app)

# ── SocketIO Configuration ──────────────────────────────────────────
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# ── Email Configuration ──────────────────────────────────────────────
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'True').lower() == 'true'
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER')

mail = Mail(app)

# ── JWT Configuration ────────────────────────────────────────────────
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-super-secret-jwt-key-change-in-production')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRY_HOURS = int(os.environ.get('JWT_EXPIRY_HOURS', 1))

# ── Login Attempt Limiter Config ─────────────────────────────────────
MAX_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

# ── Appointment Capacity ─────────────────────────────────────────────
MAX_APPOINTMENTS_PER_SLOT = 3

# ── Database Setup ────────────────────────────────────────────────────
DB_FILE = "secure_auth.db"

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

# ── HELPER FUNCTION FOR DAY OF WEEK ──────────────────────────────────
def get_day_of_week_index(date_str):
    """Get day of week (0=Monday, 6=Sunday) from date string"""
    from datetime import datetime as dt
    date_obj = dt.strptime(date_str, "%Y-%m-%d")
    return date_obj.weekday()  # 0=Monday, 6=Sunday

def get_day_name(day_index):
    """Get day name from index (0=Monday, 6=Sunday)"""
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    return days[day_index] if 0 <= day_index < 7 else 'Unknown'

def init_db():
    """Initialize SQLite database with all required tables."""
    conn = get_db()
    c = conn.cursor()

    # ── Users table (CREATE MUNA BAGO MAG-ALTER) ──────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            salt TEXT NOT NULL,
            hashed_password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            fullname TEXT,
            phone TEXT,
            address TEXT,
            is_verified INTEGER DEFAULT 0,
            verification_code TEXT,
            created_at TEXT NOT NULL
        )
    """)

    # ── Check if fullname column exists (PAGKATAPOS gawin ang table) ──
    c.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in c.fetchall()]
    
    if 'fullname' not in columns:
        print("Adding fullname column to users table...")
        c.execute("ALTER TABLE users ADD COLUMN fullname TEXT")
        print("Migration completed!")

    # ── Check if is_verified column exists ──────────────────────────────
    if 'is_verified' not in columns:
        print("Adding is_verified column to users table...")
        c.execute("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0")
        print("Migration completed!")
    
    if 'verification_code' not in columns:
        print("Adding verification_code column to users table...")
        c.execute("ALTER TABLE users ADD COLUMN verification_code TEXT")
        print("Migration completed!")

    # ── ✨ NEW: Add name_changed_at column for 7-day name change cooldown ──
    if 'name_changed_at' not in columns:
        print("Adding name_changed_at column to users table...")
        c.execute("ALTER TABLE users ADD COLUMN name_changed_at TEXT")
        print("Migration completed!")

    # ── Pets table ──────────────────────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS pets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_email TEXT NOT NULL,
            pet_type TEXT DEFAULT 'Dog',
            name TEXT NOT NULL,
            breed TEXT,
            age INTEGER,
            gender TEXT,
            color TEXT,
            weight REAL,
            medical_history TEXT,
            allergies TEXT,
            pet_image TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (customer_email) REFERENCES users(email) ON DELETE CASCADE
        )
    """)

    # ── Vaccinations table ──────────────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS vaccinations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pet_id INTEGER NOT NULL,
            vaccine_name TEXT NOT NULL,
            date_given TEXT NOT NULL,
            next_due_date TEXT,
            notes TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
        )
    """)

    # ── Visits table ────────────────────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS visits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pet_id INTEGER NOT NULL,
            visit_date TEXT NOT NULL,
            reason TEXT,
            diagnosis TEXT,
            treatment TEXT,
            notes TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
        )
    """)

    # ── Medical Records table ──────────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS medical_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pet_id INTEGER NOT NULL,
            vet_email TEXT NOT NULL,
            visit_date TEXT NOT NULL,
            diagnosis TEXT NOT NULL,
            treatment TEXT,
            prescription TEXT,
            notes TEXT,
            status TEXT DEFAULT 'active',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
            FOREIGN KEY (vet_email) REFERENCES users(email) ON DELETE CASCADE
        )
    """)

    # ── ML Recommendations table ──────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS ml_recommendations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pet_id INTEGER NOT NULL,
            recommendation_type TEXT NOT NULL,
            recommendation_text TEXT NOT NULL,
            confidence_score REAL,
            status TEXT DEFAULT 'pending',
            vet_notes TEXT,
            validated_at TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
        )
    """)

    # ── Appointments table (updated for multiple services) ──────────
    c.execute("PRAGMA table_info(appointments)")
    app_columns = [col[1] for col in c.fetchall()]
    
    # Check if we need to migrate
    if 'service_type' in app_columns and 'services' not in app_columns:
        print("Migrating appointments table to support multiple services...")
        
        # Create new appointments table with services as JSON
        c.execute("""
            CREATE TABLE IF NOT EXISTS appointments_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_email TEXT NOT NULL,
                pet_id INTEGER NOT NULL,
                services TEXT NOT NULL,
                appointment_date TEXT NOT NULL,
                appointment_time TEXT NOT NULL,
                notes TEXT,
                status TEXT DEFAULT 'pending',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (customer_email) REFERENCES users(email) ON DELETE CASCADE,
                FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
            )
        """)
        
        # Copy data from old table
        c.execute("""
            INSERT INTO appointments_new (id, customer_email, pet_id, services, appointment_date, appointment_time, notes, status, created_at, updated_at)
            SELECT id, customer_email, pet_id, json_array(service_type), appointment_date, appointment_time, notes, status, created_at, updated_at
            FROM appointments
        """)
        
        # Drop old table and rename new one
        c.execute("DROP TABLE appointments")
        c.execute("ALTER TABLE appointments_new RENAME TO appointments")
        
        print("Migration completed!")
    else:
        # Create fresh table if it doesn't exist
        c.execute("""
            CREATE TABLE IF NOT EXISTS appointments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_email TEXT NOT NULL,
                pet_id INTEGER NOT NULL,
                services TEXT NOT NULL,
                appointment_date TEXT NOT NULL,
                appointment_time TEXT NOT NULL,
                notes TEXT,
                status TEXT DEFAULT 'pending',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (customer_email) REFERENCES users(email) ON DELETE CASCADE,
                FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
            )
        """)

    # ── Services table ──────────────────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL,
            duration INTEGER,
            is_active INTEGER DEFAULT 1,
            created_at TEXT NOT NULL
        )
    """)

    # ── Messages table ──────────────────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_email TEXT NOT NULL,
            receiver_email TEXT NOT NULL,
            subject TEXT,
            message TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (sender_email) REFERENCES users(email) ON DELETE CASCADE,
            FOREIGN KEY (receiver_email) REFERENCES users(email) ON DELETE CASCADE
        )
    """)

    # ── Staff Availability Settings ────────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS staff_availability (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            staff_email TEXT NOT NULL,
            day_of_week INTEGER NOT NULL,
            is_available INTEGER DEFAULT 1,
            max_slots_per_day INTEGER DEFAULT 3,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (staff_email) REFERENCES users(email) ON DELETE CASCADE,
            UNIQUE(staff_email, day_of_week)
        )
    """)

    # ── Staff Time Slot Settings ──────────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS staff_time_slots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            staff_email TEXT NOT NULL,
            day_of_week INTEGER NOT NULL,
            time_slot TEXT NOT NULL,
            max_slots INTEGER DEFAULT 1,
            is_active INTEGER DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (staff_email) REFERENCES users(email) ON DELETE CASCADE,
            UNIQUE(staff_email, day_of_week, time_slot)
        )
    """)

    # ── Date Closures Table ───────────────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS date_closures (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            staff_email TEXT NOT NULL,
            closure_date TEXT NOT NULL,
            reason TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (staff_email) REFERENCES users(email) ON DELETE CASCADE,
            UNIQUE(staff_email, closure_date)
        )
    """)
    
    # ── ✨ NEW: Date Overrides Table (For specific dates max slots) ──
    c.execute("""
        CREATE TABLE IF NOT EXISTS date_overrides (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            staff_email TEXT NOT NULL,
            override_date TEXT NOT NULL,
            max_slots_per_day INTEGER DEFAULT 3,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (staff_email) REFERENCES users(email) ON DELETE CASCADE,
            UNIQUE(staff_email, override_date)
        )
    """)

    # ── Add default services ────────────────────────────────────────
    c.execute("SELECT id FROM services LIMIT 1")
    if not c.fetchone():
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        default_services = [
            ("Full Grooming", "Complete grooming service including bath, haircut, nail trim, and ear cleaning", 65.00, 90, 1, now),
            ("Bath & Brush", "Basic bath and brush service", 35.00, 45, 1, now),
            ("Nail Trim", "Professional nail trimming service", 15.00, 20, 1, now),
            ("Teeth Cleaning", "Dental cleaning for your pet", 25.00, 30, 1, now),
            ("De-shedding", "Remove loose fur to reduce shedding", 50.00, 60, 1, now),
            ("Creative Styling", "Creative grooming and styling", 85.00, 120, 1, now),
            ("Ear Cleaning", "Professional ear cleaning", 20.00, 20, 1, now),
            ("Vaccination", "Pet vaccination service", 40.00, 30, 1, now),
            ("Health Check-up", "Complete health examination", 50.00, 45, 1, now),
        ]
        for service in default_services:
            c.execute("""
                INSERT INTO services (name, description, price, duration, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, service)

    # Login attempts table
    c.execute("""
        CREATE TABLE IF NOT EXISTS login_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            attempt_time TEXT NOT NULL,
            success INTEGER NOT NULL DEFAULT 0
        )
    """)

    # Password reset tokens table
    c.execute("""
        CREATE TABLE IF NOT EXISTS reset_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            expires_at TEXT NOT NULL,
            used INTEGER NOT NULL DEFAULT 0
        )
    """)

    # ── Ensure default accounts exist ──────────────────────────────────
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Default Admin Account
    c.execute("SELECT id FROM users WHERE email='admin@petlink.com'")
    if not c.fetchone():
        salt = generate_salt()
        c.execute(
            "INSERT INTO users (email, salt, hashed_password, role, fullname, phone, address, is_verified, created_at) VALUES (?,?,?,?,?,?,?,1,?)",
            ("admin@petlink.com", salt, hash_password("Admin@1234", salt), "admin", 
             "Admin User", "09171234567", "48 B. Serrano St., Caloocan City", now)
        )
    
    # Default Staff Account
    c.execute("SELECT id FROM users WHERE email='staff@petlink.com'")
    if not c.fetchone():
        salt = generate_salt()
        c.execute(
            "INSERT INTO users (email, salt, hashed_password, role, fullname, phone, address, is_verified, created_at) VALUES (?,?,?,?,?,?,?,1,?)",
            ("staff@petlink.com", salt, hash_password("Staff@1234", salt), "staff", 
             "Staff User", "09171234568", "48 B. Serrano St., Caloocan City", now)
        )
    
    # Default Vet Account
    c.execute("SELECT id FROM users WHERE email='vet@petlink.com'")
    if not c.fetchone():
        salt = generate_salt()
        c.execute(
            "INSERT INTO users (email, salt, hashed_password, role, fullname, phone, address, is_verified, created_at) VALUES (?,?,?,?,?,?,?,1,?)",
            ("vet@petlink.com", salt, hash_password("Vet@1234", salt), "vet", 
             "Vet User", "09171234569", "48 B. Serrano St., Caloocan City", now)
        )

    # ── Set default availability for staff ──────────────────────────────
    staff_email = "staff@petlink.com"
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday
    default_days = [
        (0, 1, 3),  # Monday - available, 3 slots per day
        (1, 1, 3),  # Tuesday - available, 3 slots per day
        (2, 1, 3),  # Wednesday - available, 3 slots per day
        (3, 1, 3),  # Thursday - available, 3 slots per day
        (4, 1, 3),  # Friday - available, 3 slots per day
        (5, 1, 3),  # Saturday - available, 3 slots per day
        (6, 0, 0),  # Sunday - NOT available
    ]

    for day, available, max_slots in default_days:
        c.execute("""
            INSERT OR IGNORE INTO staff_availability 
            (staff_email, day_of_week, is_available, max_slots_per_day, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (staff_email, day, available, max_slots, now, now))

    # ── Add default time slots for each day ────────────────────────────
    default_time_slots = [
        "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
        "11:00", "11:30", "12:00", "13:00", "13:30", "14:00",
        "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
    ]

    for day in range(7):  # 0=Monday, 6=Sunday
        for time_slot in default_time_slots:
            c.execute("""
                INSERT OR IGNORE INTO staff_time_slots 
                (staff_email, day_of_week, time_slot, max_slots, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (staff_email, day, time_slot, 1, 1, now, now))

    conn.commit()
    conn.close()

# ── Crypto Helpers ────────────────────────────────────────────────────
def generate_salt():
    return os.urandom(32).hex()

def hash_password(password, salt):
    return hashlib.sha256((password + salt).encode()).hexdigest()

def is_strong_password(password):
    if len(password) < 8:
        return False, 'Password must be at least 8 characters.'
    if not re.search(r'[A-Z]', password):
        return False, 'Password must contain at least one uppercase letter.'
    if not re.search(r'[a-z]', password):
        return False, 'Password must contain at least one lowercase letter.'
    if not re.search(r'[0-9]', password):
        return False, 'Password must contain at least one number.'
    if not re.search(r'[^A-Za-z0-9]', password):
        return False, 'Password must contain at least one special character.'
    return True, ''

def is_valid_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def is_valid_phone(phone):
    if not phone:
        return True
    phone = re.sub(r'[\s\-\(\)]', '', phone)
    if re.match(r'^(09|\+639|9)\d{9}$', phone):
        return True
    if re.match(r'^[0-9]{2,8}$', phone):
        return True
    return False

# ── Login Attempt Limiter ─────────────────────────────────────────────
def record_attempt(email, success):
    conn = get_db()
    conn.execute(
        "INSERT INTO login_attempts (email, attempt_time, success) VALUES (?,?,?)",
        (email, datetime.now(timezone.utc).isoformat(), int(success))
    )
    conn.commit()
    conn.close()

def get_lockout_status(email):
    conn = get_db()
    window_start = (datetime.now(timezone.utc) - timedelta(minutes=LOCKOUT_MINUTES)).isoformat()

    row = conn.execute(
        "SELECT COUNT(*) as cnt FROM login_attempts WHERE email=? AND attempt_time>? AND success=0",
        (email, window_start)
    ).fetchone()
    failed_count = row["cnt"]

    remaining = 0
    is_locked = False
    if failed_count >= MAX_ATTEMPTS:
        nth = conn.execute(
            "SELECT attempt_time FROM login_attempts WHERE email=? AND attempt_time>? AND success=0 "
            "ORDER BY attempt_time ASC LIMIT 1 OFFSET ?",
            (email, window_start, MAX_ATTEMPTS - 1)
        ).fetchone()
        if nth:
            lock_start = datetime.fromisoformat(nth["attempt_time"])
            unlock_at = lock_start + timedelta(minutes=LOCKOUT_MINUTES)
            now = datetime.now(timezone.utc)
            if now < unlock_at:
                is_locked = True
                remaining = int((unlock_at - now).total_seconds())

    conn.close()
    return is_locked, remaining, failed_count

# ── JWT Authentication ────────────────────────────────────────────────
def generate_jwt(email, role):
    payload = {
        "sub": email,
        "role": role,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = session.get("jwt_token")
        if not token:
            return redirect(url_for("login"))
        payload = verify_jwt(token)
        if not payload:
            session.clear()
            return redirect(url_for("login"))
        request.current_user = payload
        return f(*args, **kwargs)
    return decorated

# ── Role-Based Access Control ────────────────────────────────────────
def role_required(*roles):
    def decorator(f):
        @wraps(f)
        @jwt_required
        def decorated(*args, **kwargs):
            if request.current_user.get("role") not in roles:
                return jsonify({"success": False, "message": "Access denied: insufficient permissions."}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator

# ── Email Helper Function ─────────────────────────────────────────────
def send_verification_email(email, code, fullname):
    """Send verification code email"""
    try:
        msg = Message("🔐 Verify Your PetLink Account", recipients=[email])
        
        html_body = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; background-color: #0f172a; color: #e2e8f0; margin: 0; padding: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 30px; background: #1e293b; border-radius: 16px; border: 1px solid #334155; }}
                .header {{ text-align: center; border-bottom: 1px solid #334155; padding-bottom: 20px; }}
                .header h1 {{ color: #38bdf8; font-size: 28px; margin: 0; }}
                .header .subtitle {{ color: #94a3b8; font-size: 14px; }}
                .content {{ padding: 20px 0; }}
                .content h2 {{ color: #38bdf8; font-size: 22px; margin-bottom: 10px; }}
                .content p {{ color: #94a3b8; line-height: 1.6; }}
                .code-box {{ background: #0f172a; border-radius: 12px; padding: 20px; border: 1px solid #334155; text-align: center; margin: 20px 0; }}
                .code-box .code {{ font-size: 32px; font-weight: 700; color: #38bdf8; letter-spacing: 8px; font-family: monospace; }}
                .footer {{ text-align: center; border-top: 1px solid #334155; padding-top: 20px; color: #64748b; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🐾 PetLink</h1>
                    <div class="subtitle">Canine Distemper Center</div>
                </div>
                <div class="content">
                    <h2>🔐 Verify Your Account</h2>
                    <p>Hello <strong>{fullname}</strong>,</p>
                    <p>Thank you for registering with PetLink Canine Distemper Center! To complete your registration, please enter the verification code below:</p>
                    <div class="code-box">
                        <div class="code">{code}</div>
                    </div>
                    <p>This code will expire in <strong>10 minutes</strong>.</p>
                    <p>If you did not request this, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>📍 48 B. Serrano St., Caloocan City</p>
                    <p>📞 (02) 8123 4567 | ✉️ petlink@clinic.com</p>
                    <p>© 2026 PetLink Canine Distemper Center</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.html = html_body
        mail.send(msg)
        print(f"✅ Verification email sent to {email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send verification email: {e}")
        return False

def send_email_notification(recipient, subject, body, appointment_data=None):
    """Send email notification for appointment updates with HTML formatting."""
    try:
        msg = Message(subject, recipients=[recipient])
        
        status_colors = {
            'pending': '#f59e0b',
            'confirmed': '#10b981',
            'completed': '#38bdf8',
            'cancelled': '#ef4444'
        }
        status_color = status_colors.get(appointment_data.get('status', 'pending') if appointment_data else 'pending', '#94a3b8')
        
        html_body = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; background-color: #0f172a; color: #e2e8f0; margin: 0; padding: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 30px; background: #1e293b; border-radius: 16px; border: 1px solid #334155; }}
                .header {{ text-align: center; border-bottom: 1px solid #334155; padding-bottom: 20px; }}
                .header h1 {{ color: #38bdf8; font-size: 28px; margin: 0; }}
                .header .subtitle {{ color: #94a3b8; font-size: 14px; }}
                .content {{ padding: 20px 0; }}
                .content h2 {{ color: #38bdf8; font-size: 22px; margin-bottom: 10px; }}
                .content p {{ color: #94a3b8; line-height: 1.6; }}
                .details {{ background: #0f172a; border-radius: 12px; padding: 20px; border: 1px solid #334155; margin-top: 20px; }}
                .detail {{ padding: 8px 0; border-bottom: 1px solid #1e293b; }}
                .detail:last-child {{ border-bottom: none; }}
                .detail strong {{ color: #38bdf8; }}
                .status-badge {{ display: inline-block; padding: 4px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; background: {status_color}; color: #0f172a; }}
                .footer {{ text-align: center; border-top: 1px solid #334155; padding-top: 20px; color: #64748b; font-size: 12px; }}
                .footer .address {{ color: #94a3b8; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🐾 PetLink</h1>
                    <div class="subtitle">Canine Distemper Center</div>
                </div>
                <div class="content">
                    <h2>{subject}</h2>
                    <p>{body}</p>
        """
        
        if appointment_data:
            status_label = appointment_data.get('status', 'pending').upper()
            services = appointment_data.get('service', 'N/A')
            total_price = appointment_data.get('total_price', 0)
            total_duration = appointment_data.get('total_duration', 0)
            
            html_body += f"""
                    <div class="details">
                        <h3 style="color: #38bdf8; margin-top: 0; margin-bottom: 15px;">📋 Appointment Details</h3>
                        <div class="detail"><strong>🐕 Pet:</strong> {appointment_data.get('pet_name', 'N/A')}</div>
                        <div class="detail"><strong>✂️ Services:</strong> {services}</div>
                        <div class="detail"><strong>💰 Total Price:</strong> ₱{total_price:.2f}</div>
                        <div class="detail"><strong>⏱️ Total Duration:</strong> {total_duration} min</div>
                        <div class="detail"><strong>📅 Date:</strong> {appointment_data.get('date', 'N/A')}</div>
                        <div class="detail"><strong>⏰ Time:</strong> {appointment_data.get('time', 'N/A')}</div>
                        <div class="detail"><strong>📌 Status:</strong> <span class="status-badge">{status_label}</span></div>
                        {f'<div class="detail"><strong>📝 Notes:</strong> {appointment_data.get("notes", "")}</div>' if appointment_data.get('notes') else ''}
                    </div>
            """
        
        html_body += f"""
                    <div style="text-align: center; margin-top: 20px;">
                        <p style="color: #94a3b8; font-size: 13px;">
                            💡 Need to reschedule or cancel? Contact us at <strong style="color: #38bdf8;">(02) 8123 4567</strong>
                        </p>
                    </div>
                </div>
                <div class="footer">
                    <p>📍 <span class="address">48 B. Serrano St., Caloocan City</span></p>
                    <p>📞 (02) 8123 4567 | ✉️ petlink@clinic.com</p>
                    <p style="margin-top: 10px;">© 2026 PetLink Canine Distemper Center | All Rights Reserved</p>
                    <p style="font-size: 11px; margin-top: 5px;">This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.html = html_body
        mail.send(msg)
        print(f"Email sent successfully to {recipient}")
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

# ── Appointment Email Functions ──────────────────────────────────────
def send_booking_confirmation(email, appointment_data):
    subject = "✅ Appointment Booked Successfully!"
    body = """
    Thank you for booking an appointment with PetLink Canine Distemper Center!

    Your appointment has been received and is currently pending confirmation.
    You will receive another email once our staff confirms your appointment.

    📌 Please wait for our confirmation email.
    """
    return send_email_notification(email, subject, body, appointment_data)

def send_appointment_confirmation(email, appointment_data):
    subject = "✅ Appointment Confirmed!"
    body = """
    Great news! Your appointment has been confirmed by our staff.

    Please make sure to arrive on time for your scheduled appointment.
    If you need to reschedule or cancel, please contact us immediately.
    """
    return send_email_notification(email, subject, body, appointment_data)

def send_appointment_completion(email, appointment_data):
    subject = "✅ Appointment Completed!"
    body = """
    Your appointment has been successfully completed.

    Thank you for choosing PetLink Canine Distemper Center!
    We hope to see you and your pet again soon.

    Your pet's health and happiness are our top priority.
    """
    return send_email_notification(email, subject, body, appointment_data)

def send_appointment_cancellation(email, appointment_data):
    subject = "❌ Appointment Cancelled"
    body = """
    Your appointment has been cancelled.

    If you did not request this cancellation, please contact us immediately.
    We're here to help with any questions or concerns.

    We hope to serve you and your pet in the future.
    """
    return send_email_notification(email, subject, body, appointment_data)

# ── SOCKETIO EVENTS ──────────────────────────────────────────────────
active_users = {}  # {email: sid}

@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')

@socketio.on('register_user')
def handle_register_user(data):
    email = data.get('email')
    if email:
        active_users[email] = request.sid
        join_room(email)
        print(f'User {email} registered with SID: {request.sid}')
        emit('user_registered', {'status': 'success', 'email': email})

@socketio.on('send_message')
def handle_send_message(data):
    sender = data.get('sender')
    receiver = data.get('receiver')
    message = data.get('message')
    subject = data.get('subject', '')
    timestamp = data.get('timestamp', datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    
    print(f'Message from {sender} to {receiver}: {message}')
    
    emit('new_message', {
        'sender': sender,
        'receiver': receiver,
        'message': message,
        'subject': subject,
        'timestamp': timestamp
    }, room=receiver)
    
    emit('message_sent', {
        'success': True,
        'message': 'Message sent successfully!'
    }, room=sender)

@socketio.on('typing')
def handle_typing(data):
    sender = data.get('sender')
    receiver = data.get('receiver')
    is_typing = data.get('is_typing', True)
    
    emit('user_typing', {
        'sender': sender,
        'is_typing': is_typing
    }, room=receiver)

@socketio.on('disconnect')
def handle_disconnect():
    for email, sid in list(active_users.items()):
        if sid == request.sid:
            del active_users[email]
            print(f'User {email} disconnected')
            break

# ── Routes ─────────────────────────────────────────────────────────────
@app.route('/')
def index():
    # Compute dashboard URL based on role (server-side)
    dashboard_url = '/login'
    if session.get('jwt_token'):
        role = session.get('role', 'user')
        if role == 'admin':
            dashboard_url = '/admin'
        elif role == 'staff':
            dashboard_url = '/staff'
        elif role == 'vet':
            dashboard_url = '/vet'
        else:
            dashboard_url = '/dashboard'
    
    return render_template('index.html', dashboard_url=dashboard_url)

# ── REGISTER ROUTE ────────────────────────────────────────────────────
@app.route('/register', methods=["GET", "POST"])
def register():
    if request.method == "POST":
        data = request.get_json()
        fullname = data.get("fullname", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        phone = data.get("phone", "").strip()
        address = data.get("address", "").strip()

        if not fullname or not email or not password:
            return jsonify({"success": False, "message": "Full name, email, and password are required."})
        if not is_valid_email(email):
            return jsonify({"success": False, "message": "Please enter a valid email address."})
        if phone and not is_valid_phone(phone):
            return jsonify({"success": False, "message": "Please enter a valid Philippine phone number."})
        
        ok, err = is_strong_password(password)
        if not ok:
            return jsonify({"success": False, "message": err})

        conn = get_db()
        existing = conn.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone()
        if existing:
            conn.close()
            return jsonify({"success": False, "message": "Email already registered!"})

        salt = generate_salt()
        hashed = hash_password(password, salt)
        
        # Generate verification code
        verification_code = ''.join(random.choices(string.digits, k=6))
        
        role = "user"
            
        conn.execute(
            "INSERT INTO users (email, salt, hashed_password, role, fullname, phone, address, is_verified, verification_code, created_at) VALUES (?,?,?,?,?,?,?,0,?,?)",
            (email, salt, hashed, role, fullname, phone, address, verification_code, datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        )
        conn.commit()
        conn.close()
        
        # ── Send verification email IN BACKGROUND (non-blocking) ──────
        import threading
        def send_email_async():
            try:
                send_verification_email(email, verification_code, fullname)
            except Exception as e:
                print(f"Email error (background): {e}")
        
        email_thread = threading.Thread(target=send_email_async)
        email_thread.daemon = True
        email_thread.start()
        
        # Return response AGAD — hindi nag-aantay ng email
        return jsonify({
            "success": True, 
            "message": "Registration successful! Please check your email for the verification code.",
            "requires_verification": True,
            "email": email
        })

    return render_template('register.html')

@app.route('/verification')
def verification_page():
    return render_template('verification.html')

@app.route('/api/cancel-verification', methods=["POST"])
def cancel_verification():
    """Delete unverified account when user cancels verification"""
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    
    if not email:
        return jsonify({"success": False, "message": "Email is required."})
    
    conn = get_db()
    
    # Check if user exists and is not verified
    user = conn.execute(
        "SELECT id, is_verified FROM users WHERE email = ?",
        (email,)
    ).fetchone()
    
    if not user:
        conn.close()
        return jsonify({"success": False, "message": "User not found."})
    
    if user["is_verified"] == 1:
        conn.close()
        return jsonify({"success": False, "message": "Account is already verified and cannot be cancelled."})
    
    # Delete the unverified account
    conn.execute("DELETE FROM users WHERE id = ?", (user["id"],))
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Registration cancelled successfully."})

# ── LOGIN ROUTE ───────────────────────────────────────────────────────
@app.route('/login', methods=["GET", "POST"])
def login():
    if request.method == "POST":
        data = request.get_json()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        is_locked, remaining, failed_count = get_lockout_status(email)
        if is_locked:
            mins = remaining // 60
            secs = remaining % 60
            return jsonify({
                "success": False,
                "message": f"Account locked. Try again in {mins}m {secs}s.",
                "locked": True,
                "remaining": remaining
            })

        conn = get_db()
        user = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        conn.close()

        if not user:
            record_attempt(email, False)
            return jsonify({"success": False, "message": "Invalid email or password!"})

        # ── CHECK IF VERIFIED ──────────────────────────────────────────
        if user["is_verified"] == 0:
            return jsonify({
                "success": False, 
                "message": "Please verify your email first. Check your inbox for the verification code.",
                "requires_verification": True,
                "email": email
            })

        input_hash = hash_password(password, user["salt"])
        
        if input_hash != user["hashed_password"]:
            record_attempt(email, False)
            attempts_left = MAX_ATTEMPTS - (failed_count + 1)
            msg = "Invalid email or password!"
            if attempts_left > 0:
                msg += f" {attempts_left} attempt(s) remaining."
            else:
                msg = f"Account locked for {LOCKOUT_MINUTES} minutes."
            return jsonify({"success": False, "message": msg})

        record_attempt(email, True)
        token = generate_jwt(email, user["role"])
        session["jwt_token"] = token
        session["username"] = user["email"]
        session["fullname"] = user["fullname"]
        session["role"] = user["role"]
        
        if user["role"] == "admin":
            redirect_url = "/admin"
        elif user["role"] == "staff":
            redirect_url = "/staff"
        elif user["role"] == "vet":
            redirect_url = "/vet"
        else:
            redirect_url = "/dashboard"
        
        return jsonify({
            "success": True,
            "message": "Login successful!",
            "token": token,
            "role": user["role"],
            "fullname": user["fullname"],
            "redirect_url": redirect_url
        })

    return render_template('login.html')

@app.route('/logout')
def logout():
    """Logout — clear server session, then redirect to cleanup page"""
    session.clear()
    return redirect('/logout-cleanup')


@app.route('/logout-cleanup')
def logout_cleanup():
    """Intermediate page that clears localStorage/sessionStorage then redirects to index"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Logging out...</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
        <style>
            body {
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                font-family: 'Poppins', sans-serif;
                background: linear-gradient(135deg, #eaf3e0, #c5d9b4);
                color: #5a7a3f;
            }
            .loader {
                text-align: center;
            }
            .loader i {
                font-size: 48px;
                animation: spin 1s linear infinite;
                color: #7ba05b;
            }
            .loader p {
                margin-top: 16px;
                font-size: 16px;
                font-weight: 600;
                color: #5a7a3f;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    </head>
    <body>
        <div class="loader">
            <i class="fas fa-paw"></i>
            <p>🐾 Logging out...</p>
        </div>
        <script>
            // Clear localStorage at sessionStorage
            localStorage.clear();
            sessionStorage.clear();
            
            // Clear cookies
            document.cookie.split(";").forEach(function(c) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
            
            console.log('🧹 Cleared all storage');
            
            // Redirect to homepage after 0.8 seconds
            setTimeout(function() {
                window.location.href = '/';
            }, 800);
        </script>
    </body>
    </html>
    """

# ── VERIFICATION ROUTES ──────────────────────────────────────────────
@app.route('/api/verify', methods=["POST"])
def verify_account():
    """Verify user account with code"""
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    code = data.get("code", "").strip()
    
    if not email or not code:
        return jsonify({"success": False, "message": "Email and verification code are required."})
    
    conn = get_db()
    user = conn.execute(
        "SELECT id, is_verified, verification_code FROM users WHERE email = ?",
        (email,)
    ).fetchone()
    
    if not user:
        conn.close()
        return jsonify({"success": False, "message": "User not found."})
    
    if user["is_verified"] == 1:
        conn.close()
        return jsonify({"success": True, "message": "Account is already verified."})
    
    if user["verification_code"] != code:
        conn.close()
        return jsonify({"success": False, "message": "Invalid verification code. Please try again."})
    
    # Mark as verified
    conn.execute(
        "UPDATE users SET is_verified = 1, verification_code = NULL WHERE id = ?",
        (user["id"],)
    )
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Account verified successfully! You can now login."})

@app.route('/api/resend-verification', methods=["POST"])
def resend_verification():
    """Resend verification code"""
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    
    if not email:
        return jsonify({"success": False, "message": "Email is required."})
    
    conn = get_db()
    user = conn.execute(
        "SELECT id, fullname, is_verified FROM users WHERE email = ?",
        (email,)
    ).fetchone()
    
    if not user:
        conn.close()
        return jsonify({"success": False, "message": "User not found."})
    
    if user["is_verified"] == 1:
        conn.close()
        return jsonify({"success": False, "message": "Account is already verified."})
    
    # Generate new code
    verification_code = ''.join(random.choices(string.digits, k=6))
    
    conn.execute(
        "UPDATE users SET verification_code = ? WHERE email = ?",
        (verification_code, email)
    )
    conn.commit()
    conn.close()
    
    # ── Send email IN BACKGROUND (non-blocking) ──────────────────────
    import threading
    def send_email_async():
        try:
            send_verification_email(email, verification_code, user["fullname"])
        except Exception as e:
            print(f"Email error (background): {e}")
    
    email_thread = threading.Thread(target=send_email_async)
    email_thread.daemon = True
    email_thread.start()
    
    return jsonify({"success": True, "message": "New verification code sent to your email."})

@app.route('/dashboard')
@jwt_required
def dashboard():
    user = request.current_user
    conn = get_db()
    db_user = conn.execute("SELECT fullname FROM users WHERE email=?", (user["sub"],)).fetchone()
    conn.close()
    fullname = db_user["fullname"] if db_user and db_user["fullname"] else user["sub"]
    return render_template('dashboard.html', 
                         username=fullname,
                         email=user["sub"],
                         role=user["role"])

# ── PROFILE SETTINGS ROUTE ────────────────────────────────────────────
@app.route('/profile-settings')
@jwt_required
def profile_settings():
    """Profile settings page for customers"""
    user = request.current_user
    conn = get_db()
    db_user = conn.execute(
        "SELECT email, fullname, phone, address, role, created_at, name_changed_at FROM users WHERE email=?",
        (user["sub"],)
    ).fetchone()
    conn.close()
    
    if not db_user:
        return redirect(url_for('login'))
    
    # ── Calculate name change cooldown (7 days) ────────────────────────
    name_change_available = True
    days_remaining = 0
    next_change_date = None
    
    name_changed_at_value = db_user["name_changed_at"]
    
    if name_changed_at_value:
        try:
            # ── Flexible parsing — subukan lahat ng possible formats ──
            last_change = None
            
            # Format 1: "%Y-%m-%d %H:%M:%S" (standard)
            try:
                last_change = datetime.strptime(str(name_changed_at_value), "%Y-%m-%d %H:%M:%S")
            except ValueError:
                pass
            
            # Format 2: "%Y-%m-%dT%H:%M:%S" (ISO with T)
            if not last_change:
                try:
                    last_change = datetime.strptime(str(name_changed_at_value), "%Y-%m-%dT%H:%M:%S")
                except ValueError:
                    pass
            
            # Format 3: "%Y-%m-%d %H:%M:%S.%f" (with microseconds)
            if not last_change:
                try:
                    last_change = datetime.strptime(str(name_changed_at_value), "%Y-%m-%d %H:%M:%S.%f")
                except ValueError:
                    pass
            
            # Format 4: ISO format via fromisoformat
            if not last_change:
                try:
                    last_change = datetime.fromisoformat(str(name_changed_at_value).replace('Z', ''))
                except (ValueError, AttributeError):
                    pass
            
            # Kung na-parse successfully, kalkulahin ang cooldown
            if last_change:
                now = datetime.now()
                cooldown_end = last_change + timedelta(days=7)
                
                print(f"📅 Name last changed: {last_change}")
                print(f"📅 Cooldown ends: {cooldown_end}")
                print(f"📅 Now: {now}")
                print(f"📅 Still on cooldown? {now < cooldown_end}")
                
                if now < cooldown_end:
                    name_change_available = False
                    delta = cooldown_end - now
                    days_remaining = delta.days
                    
                    # Kung less than 1 day pero may oras pa, i-show as 1
                    if days_remaining == 0 and delta.seconds > 0:
                        days_remaining = 1
                    
                    # Minimum 1 para hindi 0
                    if days_remaining < 1:
                        days_remaining = 1
                    
                    next_change_date = cooldown_end.strftime("%B %d, %Y")
                    
                    print(f"🔒 Locked! Days remaining: {days_remaining}, Next change: {next_change_date}")
            else:
                print(f"❌ Could not parse name_changed_at: {name_changed_at_value}")
                # Kung hindi ma-parse, i-allow pa rin mag-change
                name_change_available = True
                
        except Exception as e:
            print(f"❌ Error parsing name_changed_at: {e}")
            name_change_available = True
    
    return render_template('profile_settings.html',
                         email=db_user["email"],
                         fullname=db_user["fullname"] or db_user["email"],
                         phone=db_user["phone"] or "",
                         address=db_user["address"] or "",
                         role=db_user["role"],
                         created_at=db_user["created_at"] or "",
                         name_change_available=name_change_available,
                         days_remaining=days_remaining,
                         next_change_date=next_change_date)


# ── UPDATE PROFILE API ────────────────────────────────────────────────
@app.route('/api/profile/update', methods=["PUT"])
@jwt_required
def update_profile():
    """Update user profile information (with 7-day name change cooldown)"""
    data = request.get_json()
    email = request.current_user.get("sub")
    
    fullname = data.get("fullname", "").strip()
    phone = data.get("phone", "").strip()
    address = data.get("address", "").strip()
    
    if not fullname:
        return jsonify({"success": False, "message": "Full name is required."})
    
    if phone and not is_valid_phone(phone):
        return jsonify({"success": False, "message": "Please enter a valid Philippine phone number."})
    
    conn = get_db()
    
    # ── Get current user data ──────────────────────────────────────────
    user = conn.execute(
        "SELECT fullname, name_changed_at FROM users WHERE email=?",
        (email,)
    ).fetchone()
    
    if not user:
        conn.close()
        return jsonify({"success": False, "message": "User not found."})
    
    current_fullname = user["fullname"] or ""
    name_is_changing = fullname != current_fullname
    
    # ── Check name change cooldown ─────────────────────────────────────
    now = datetime.now()
    
    if name_is_changing and user["name_changed_at"]:
        try:
            last_change = datetime.strptime(user["name_changed_at"], "%Y-%m-%d %H:%M:%S")
            cooldown_end = last_change + timedelta(days=7)
            
            if now < cooldown_end:
                delta = cooldown_end - now
                days_left = delta.days
                if days_left == 0 and delta.seconds > 0:
                    days_left = 1
                
                conn.close()
                return jsonify({
                    "success": False,
                    "message": f"You cannot change your name yet. Please wait {days_left} more day(s) before changing your name again.",
                    "name_cooldown": True,
                    "days_remaining": days_left
                })
        except Exception as e:
            print(f"Error parsing name_changed_at: {e}")
    
    # ── Update user info ───────────────────────────────────────────────
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")
    
    if name_is_changing:
        # Update name AND set name_changed_at timestamp
        conn.execute(
            "UPDATE users SET fullname=?, phone=?, address=?, name_changed_at=? WHERE email=?",
            (fullname, phone, address, now_str, email)
        )
        message = "Profile updated! Your name has been changed. You can change it again after 7 days."
    else:
        # Only update phone and address (name unchanged)
        conn.execute(
            "UPDATE users SET fullname=?, phone=?, address=? WHERE email=?",
            (fullname, phone, address, email)
        )
        message = "Profile updated successfully!"
    
    conn.commit()
    conn.close()
    
    session["fullname"] = fullname
    
    return jsonify({
        "success": True, 
        "message": message,
        "name_changed": name_is_changing
    })


# ── CHANGE PASSWORD API ───────────────────────────────────────────────
@app.route('/api/profile/change-password', methods=["PUT"])
@jwt_required
def change_password():
    """Change user password"""
    data = request.get_json()
    email = request.current_user.get("sub")
    
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")
    confirm_password = data.get("confirm_password", "")
    
    if not current_password or not new_password or not confirm_password:
        return jsonify({"success": False, "message": "All password fields are required."})
    
    if new_password != confirm_password:
        return jsonify({"success": False, "message": "New passwords do not match."})
    
    # Validate strength
    ok, err = is_strong_password(new_password)
    if not ok:
        return jsonify({"success": False, "message": err})
    
    conn = get_db()
    user = conn.execute("SELECT salt, hashed_password FROM users WHERE email=?", (email,)).fetchone()
    
    if not user:
        conn.close()
        return jsonify({"success": False, "message": "User not found."})
    
    # Verify current password
    current_hash = hash_password(current_password, user["salt"])
    if current_hash != user["hashed_password"]:
        conn.close()
        return jsonify({"success": False, "message": "Current password is incorrect."})
    
    # Generate new salt and hash
    new_salt = generate_salt()
    new_hash = hash_password(new_password, new_salt)
    
    conn.execute(
        "UPDATE users SET salt=?, hashed_password=? WHERE email=?",
        (new_salt, new_hash, email)
    )
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Password changed successfully!"})

# ── ADMIN ROUTES ──────────────────────────────────────────────────────
@app.route('/admin')
@role_required("admin")
def admin_panel():
    conn = get_db()
    users = conn.execute("SELECT id, email, fullname, role, phone, address, is_verified, created_at FROM users").fetchall()
    conn.close()
    return render_template('admin.html', users=[dict(u) for u in users])

# ── ADMIN STATISTICS API ──────────────────────────────────────────────
@app.route('/api/admin/stats')
@role_required("admin")
def get_admin_stats():
    """Get all admin statistics from database"""
    conn = get_db()
    
    # ── Total Users ──────────────────────────────────────────────────
    total_users = conn.execute("SELECT COUNT(*) as count FROM users").fetchone()["count"]
    
    # ── Total Pets ──────────────────────────────────────────────────
    total_pets = conn.execute("SELECT COUNT(*) as count FROM pets").fetchone()["count"]
    
    # ── Total Appointments ──────────────────────────────────────────
    total_appointments = conn.execute("SELECT COUNT(*) as count FROM appointments").fetchone()["count"]
    
    # ── Staff Count ──────────────────────────────────────────────────
    total_staff = conn.execute("SELECT COUNT(*) as count FROM users WHERE role = 'staff'").fetchone()["count"]
    
    # ── Vet Count ────────────────────────────────────────────────────
    total_vets = conn.execute("SELECT COUNT(*) as count FROM users WHERE role = 'vet'").fetchone()["count"]
    
    # ── New Pets This Month ──────────────────────────────────────────
    current_month_start = datetime.now().strftime("%Y-%m-01 00:00:00")
    new_pets = conn.execute(
        "SELECT COUNT(*) as count FROM pets WHERE created_at >= ?",
        (current_month_start,)
    ).fetchone()["count"]
    
    # ── New Users This Month ──────────────────────────────────────────
    new_users = conn.execute(
        "SELECT COUNT(*) as count FROM users WHERE created_at >= ?",
        (current_month_start,)
    ).fetchone()["count"]
    
    # ── Appointment Completion Rate ──────────────────────────────────
    completed = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE status = 'completed'"
    ).fetchone()["count"]
    
    cancelled = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE status = 'cancelled'"
    ).fetchone()["count"]
    
    total = total_appointments if total_appointments > 0 else 1
    completion_rate = round(((completed + cancelled) / total) * 100)
    
    # ── Avg Appointments per Day (last 30 days) ──────────────────────
    thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d 00:00:00")
    appointments_30d = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE created_at >= ?",
        (thirty_days_ago,)
    ).fetchone()["count"]
    avg_per_day = round(appointments_30d / 30) if appointments_30d > 0 else 0
    
    conn.close()
    
    return jsonify({
        "success": True,
        "stats": {
            "total_users": total_users,
            "total_pets": total_pets,
            "total_appointments": total_appointments,
            "total_staff": total_staff,
            "total_vets": total_vets,
            "new_pets_this_month": new_pets,
            "new_users_this_month": new_users,
            "completion_rate": completion_rate,
            "avg_appointments_per_day": avg_per_day
        }
    })

# ── ADMIN CHART DATA API (UPDATED - ONLY ONE VERSION) ──────────────
@app.route('/api/admin/chart-data')
@role_required("admin")
def get_admin_chart_data():
    """Get all chart data from database"""
    conn = get_db()
    
    # Get week offset from query parameter (default = 0 = current week)
    week_offset = request.args.get('week_offset', 0, type=int)
    
    # ── 1. APPOINTMENT TRENDS (By Day of Week - Monday to Sunday) ──
    short_day_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    
    trends = []
    today = datetime.now().date()
    
    # Get the start of the week (Monday) with offset
    start_of_week = today - timedelta(days=today.weekday()) + timedelta(weeks=week_offset)
    
    # Store the week range for display
    week_start = start_of_week.strftime("%b %d, %Y")
    week_end = (start_of_week + timedelta(days=6)).strftime("%b %d, %Y")
    week_label = f"{week_start} - {week_end}"
    
    for i in range(7):
        target_date = start_of_week + timedelta(days=i)
        date_str = target_date.strftime("%Y-%m-%d")
        
        # Count appointments for this specific date
        count = conn.execute(
            "SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ? AND status != 'cancelled'",
            (date_str,)
        ).fetchone()["count"]
        trends.append(count)
    
    # ── 2. PET TYPES ──────────────────────────────────────────────────
    dogs = conn.execute(
        "SELECT COUNT(*) as count FROM pets WHERE pet_type = 'Dog'"
    ).fetchone()["count"]
    
    cats = conn.execute(
        "SELECT COUNT(*) as count FROM pets WHERE pet_type = 'Cat'"
    ).fetchone()["count"]
    
    # ── 3. APPOINTMENT STATUS ────────────────────────────────────────
    pending = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE status = 'pending'"
    ).fetchone()["count"]
    
    confirmed = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE status = 'confirmed'"
    ).fetchone()["count"]
    
    completed = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE status = 'completed'"
    ).fetchone()["count"]
    
    cancelled = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE status = 'cancelled'"
    ).fetchone()["count"]
    
    # ── 4. MONTHLY GROWTH (Last 12 months) ───────────────────────────
    monthly_growth = []
    for i in range(11, -1, -1):
        date = (datetime.now() - timedelta(days=i*30)).strftime("%Y-%m-01 00:00:00")
        next_month = (datetime.now() - timedelta(days=(i-1)*30 - 1)).strftime("%Y-%m-01 00:00:00")
        count = conn.execute(
            "SELECT COUNT(*) as count FROM appointments WHERE created_at >= ? AND created_at < ?",
            (date, next_month)
        ).fetchone()["count"]
        monthly_growth.append(count)
    
    # ── 5. USER GROWTH (Last 12 months) ──────────────────────────────
    user_growth = []
    for i in range(11, -1, -1):
        date = (datetime.now() - timedelta(days=i*30)).strftime("%Y-%m-01 00:00:00")
        next_month = (datetime.now() - timedelta(days=(i-1)*30 - 1)).strftime("%Y-%m-01 00:00:00")
        count = conn.execute(
            "SELECT COUNT(*) as count FROM users WHERE created_at >= ? AND created_at < ?",
            (date, next_month)
        ).fetchone()["count"]
        user_growth.append(count)
    
    conn.close()
    
    # ── Month labels ──────────────────────────────────────────────────
    months = []
    for i in range(11, -1, -1):
        month_date = datetime.now() - timedelta(days=i*30)
        months.append(month_date.strftime("%b"))
    
    return jsonify({
        "success": True,
        "data": {
            "trends": {
                "labels": short_day_names,
                "values": trends,
                "week_label": week_label,
                "week_offset": week_offset
            },
            "pet_types": {
                "labels": ["Dogs", "Cats"],
                "values": [dogs, cats]
            },
            "status": {
                "labels": ["Pending", "Confirmed", "Completed", "Cancelled"],
                "values": [pending, confirmed, completed, cancelled]
            },
            "monthly_growth": {
                "labels": months,
                "values": monthly_growth
            },
            "user_growth": {
                "labels": months,
                "values": user_growth
            }
        }
    })

# ── API USERS (UPDATED - ALLOW STAFF AND VET) ──────────────────────
@app.route('/api/users')
@role_required("admin", "staff", "vet")
def api_users():
    conn = get_db()
    users = conn.execute("SELECT id, email, fullname, role, phone, address, is_verified, created_at FROM users").fetchall()
    conn.close()
    return jsonify({"success": True, "users": [dict(u) for u in users]})

@app.route('/api/promote', methods=["POST"])
@role_required("admin")
def promote_user():
    data = request.get_json()
    target = data.get("email")
    new_role = data.get("role", "user")
    if new_role not in ("user", "admin", "staff", "vet"):
        return jsonify({"success": False, "message": "Invalid role."})
    conn = get_db()
    conn.execute("UPDATE users SET role=? WHERE email=?", (new_role, target))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": f"{target} is now a {new_role}."})

# ── STAFF PANEL ROUTE ────────────────────────────────────────────────
@app.route('/staff')
@role_required("admin", "staff")
def staff_panel():
    conn = get_db()
    
    total_customers = conn.execute(
        "SELECT COUNT(*) as count FROM users WHERE role = 'user'"
    ).fetchone()["count"]
    
    total_pets = conn.execute(
        "SELECT COUNT(*) as count FROM pets"
    ).fetchone()["count"]
    
    total_appointments = conn.execute(
        "SELECT COUNT(*) as count FROM appointments"
    ).fetchone()["count"]
    
    pending_appointments = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE status = 'pending'"
    ).fetchone()["count"]
    
    confirmed_appointments = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE status = 'confirmed'"
    ).fetchone()["count"]
    
    customers = conn.execute("""
        SELECT id, email, fullname, role, phone, address, created_at 
        FROM users 
        WHERE role = 'user'
        ORDER BY created_at DESC
    """).fetchall()
    
    conn.close()
    
    current_role = session.get("role", "user")
    
    return render_template('staff.html', 
                         customers=customers,
                         total_customers=total_customers,
                         total_pets=total_pets,
                         total_appointments=total_appointments,
                         pending_appointments=pending_appointments,
                         confirmed_appointments=confirmed_appointments,
                         role=current_role)

# ── STAFF AVAILABILITY ROUTES ────────────────────────────────────────

@app.route('/staff-availability')
@role_required("admin", "staff")
def staff_availability():
    """Staff availability management page"""
    return render_template('staff_availability.html')

@app.route('/api/staff/availability', methods=["GET"])
@role_required("admin", "staff")
def get_staff_availability():
    """Get staff availability settings for all days"""
    staff_email = request.current_user.get("sub")
    role = request.current_user.get("role")
    
    if role == "admin":
        staff_email = request.args.get("staff_email", staff_email)
    
    conn = get_db()
    availability = conn.execute("""
        SELECT * FROM staff_availability WHERE staff_email = ?
        ORDER BY day_of_week
    """, (staff_email,)).fetchall()
    conn.close()
    
    conn = get_db()
    time_slots = conn.execute("""
        SELECT * FROM staff_time_slots WHERE staff_email = ?
        ORDER BY day_of_week, time_slot
    """, (staff_email,)).fetchall()
    conn.close()
    
    return jsonify({
        "success": True,
        "availability": [dict(a) for a in availability],
        "time_slots": [dict(t) for t in time_slots]
    })

@app.route('/api/staff/availability', methods=["POST"])
@role_required("admin", "staff")
def update_staff_availability():
    """Update staff availability for a specific day"""
    data = request.get_json()
    staff_email = request.current_user.get("sub")
    role = request.current_user.get("role")
    
    if role == "admin" and data.get("staff_email"):
        staff_email = data.get("staff_email")
    
    day_of_week = data.get("day_of_week")
    is_available = data.get("is_available", 1)
    max_slots_per_day = data.get("max_slots_per_day", 3)
    
    if day_of_week is None:
        return jsonify({"success": False, "message": "Day of week is required."})
    
    conn = get_db()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    conn.execute("""
        INSERT INTO staff_availability 
        (staff_email, day_of_week, is_available, max_slots_per_day, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(staff_email, day_of_week) 
        DO UPDATE SET 
            is_available = excluded.is_available,
            max_slots_per_day = excluded.max_slots_per_day,
            updated_at = excluded.updated_at
    """, (staff_email, day_of_week, is_available, max_slots_per_day, now, now))
    
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Availability updated successfully!"})

@app.route('/api/staff/time-slots', methods=["POST"])
@role_required("admin", "staff")
def update_time_slot():
    """Update time slot settings for a specific day/time"""
    data = request.get_json()
    staff_email = request.current_user.get("sub")
    role = request.current_user.get("role")
    
    if role == "admin" and data.get("staff_email"):
        staff_email = data.get("staff_email")
    
    day_of_week = data.get("day_of_week")
    time_slot = data.get("time_slot")
    max_slots = data.get("max_slots", 1)
    is_active = data.get("is_active", 1)
    
    if day_of_week is None or not time_slot:
        return jsonify({"success": False, "message": "Day and time slot are required."})
    
    conn = get_db()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    conn.execute("""
        INSERT INTO staff_time_slots 
        (staff_email, day_of_week, time_slot, max_slots, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(staff_email, day_of_week, time_slot) 
        DO UPDATE SET 
            max_slots = excluded.max_slots,
            is_active = excluded.is_active,
            updated_at = excluded.updated_at
    """, (staff_email, day_of_week, time_slot, max_slots, is_active, now, now))
    
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Time slot updated successfully!"})

@app.route('/api/staff/time-slots/<int:slot_id>', methods=["DELETE"])
@role_required("admin", "staff")
def delete_time_slot(slot_id):
    """Delete a time slot setting"""
    conn = get_db()
    conn.execute("DELETE FROM staff_time_slots WHERE id = ?", (slot_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Time slot deleted!"})

# ── DATE CLOSURES ROUTES ──────────────────────────────────────────────

@app.route('/api/staff/date-closures', methods=["GET"])
@role_required("admin", "staff")
def get_date_closures():
    """Get all date-specific closures for the staff"""
    staff_email = request.current_user.get("sub")
    role = request.current_user.get("role")
    
    if role == "admin":
        staff_email = request.args.get("staff_email", staff_email)
    
    conn = get_db()
    closures = conn.execute("""
        SELECT * FROM date_closures 
        WHERE staff_email = ?
        ORDER BY closure_date DESC
    """, (staff_email,)).fetchall()
    conn.close()
    
    return jsonify({
        "success": True,
        "closures": [dict(c) for c in closures]
    })

@app.route('/api/staff/date-closures', methods=["POST"])
@role_required("admin", "staff")
def add_date_closure():
    """Add a date-specific closure"""
    data = request.get_json()
    staff_email = request.current_user.get("sub")
    role = request.current_user.get("role")
    
    if role == "admin" and data.get("staff_email"):
        staff_email = data.get("staff_email")
    
    closure_date = data.get("closure_date", "").strip()
    reason = data.get("reason", "").strip()
    
    if not closure_date:
        return jsonify({"success": False, "message": "Closure date is required."})
    
    conn = get_db()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    try:
        conn.execute("""
            INSERT INTO date_closures (staff_email, closure_date, reason, created_at)
            VALUES (?, ?, ?, ?)
        """, (staff_email, closure_date, reason, now))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": f"Date closure added for {closure_date}"})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"success": False, "message": "This date is already closed."})

@app.route('/api/staff/date-closures/<int:closure_id>', methods=["DELETE"])
@role_required("admin", "staff")
def delete_date_closure(closure_id):
    """Remove a date-specific closure"""
    conn = get_db()
    conn.execute("DELETE FROM date_closures WHERE id = ?", (closure_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Date closure removed."})

# ── ✨ NEW: DATE OVERRIDES ROUTES (For specific max slots) ──────────

@app.route('/api/staff/date-overrides', methods=["GET"])
@role_required("admin", "staff")
def get_date_overrides():
    """Get all date-specific overrides (max slots)"""
    staff_email = request.current_user.get("sub")
    role = request.current_user.get("role")
    
    if role == "admin":
        staff_email = request.args.get("staff_email", staff_email)
    
    conn = get_db()
    overrides = conn.execute("""
        SELECT * FROM date_overrides 
        WHERE staff_email = ?
        ORDER BY override_date DESC
    """, (staff_email,)).fetchall()
    conn.close()
    
    return jsonify({
        "success": True,
        "overrides": [dict(o) for o in overrides]
    })

@app.route('/api/staff/date-overrides', methods=["POST"])
@role_required("admin", "staff")
def add_date_override():
    """Add or update a date-specific max slots override"""
    data = request.get_json()
    staff_email = request.current_user.get("sub")
    role = request.current_user.get("role")
    
    if role == "admin" and data.get("staff_email"):
        staff_email = data.get("staff_email")
    
    override_date = data.get("override_date", "").strip()
    max_slots_per_day = data.get("max_slots_per_day", 3)
    
    if not override_date:
        return jsonify({"success": False, "message": "Date is required."})
    
    conn = get_db()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    conn.execute("""
        INSERT INTO date_overrides (staff_email, override_date, max_slots_per_day, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(staff_email, override_date) 
        DO UPDATE SET 
            max_slots_per_day = excluded.max_slots_per_day,
            updated_at = excluded.updated_at
    """, (staff_email, override_date, max_slots_per_day, now, now))
    
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": f"Date override saved for {override_date}"})

@app.route('/api/staff/date-overrides/<int:override_id>', methods=["DELETE"])
@role_required("admin", "staff")
def delete_date_override(override_id):
    """Remove a date-specific override"""
    conn = get_db()
    conn.execute("DELETE FROM date_overrides WHERE id = ?", (override_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Date override removed."})

# ── VET PANEL ROUTE ──────────────────────────────────────────────────
@app.route('/vet')
@role_required("vet")
def vet_panel():
    user = request.current_user
    conn = get_db()
    db_user = conn.execute("SELECT fullname FROM users WHERE email=?", (user["sub"],)).fetchone()
    conn.close()
    fullname = db_user["fullname"] if db_user and db_user["fullname"] else user["sub"]
    return render_template('vet.html',
                         username=fullname,
                         email=user["sub"],
                         role=user["role"])

# ── PET MANAGEMENT ROUTES ─────────────────────────────────────────────
@app.route('/api/pets')
@role_required("admin", "staff", "vet")
def get_pets():
    conn = get_db()
    pets = conn.execute("""
        SELECT p.*, u.email as owner_email, u.fullname as owner_name
        FROM pets p
        JOIN users u ON p.customer_email = u.email
        WHERE u.role = 'user'
        ORDER BY p.created_at DESC
    """).fetchall()
    conn.close()
    return jsonify({"success": True, "pets": [dict(p) for p in pets]})

@app.route('/api/all-pets')
@role_required("admin", "staff", "vet")
def get_all_pets():
    conn = get_db()
    pets = conn.execute("""
        SELECT p.*, u.email as owner_email, u.fullname as owner_name
        FROM pets p
        JOIN users u ON p.customer_email = u.email
        WHERE u.role = 'user'
        ORDER BY p.created_at DESC
    """).fetchall()
    conn.close()
    return jsonify({"success": True, "pets": [dict(p) for p in pets]})

@app.route('/api/pets/<customer_email>')
@jwt_required
def get_pets_by_customer(customer_email):
    conn = get_db()
    pets = conn.execute(
        "SELECT * FROM pets WHERE customer_email = ? ORDER BY created_at DESC",
        (customer_email,)
    ).fetchall()
    conn.close()
    return jsonify({"success": True, "pets": [dict(p) for p in pets]})

@app.route('/api/pets', methods=["POST"])
@jwt_required
def create_pet():
    data = request.get_json()
    email = request.current_user.get("sub")
    
    pet_type = data.get("pet_type", "Dog").strip()
    name = data.get("name", "").strip()
    breed = data.get("breed", "").strip()
    age = data.get("age")
    gender = data.get("gender", "").strip()
    color = data.get("color", "").strip()
    weight = data.get("weight")
    medical_history = data.get("medical_history", "").strip()
    allergies = data.get("allergies", "").strip()
    pet_image = data.get("pet_image", "").strip()
    
    if not name:
        return jsonify({"success": False, "message": "Pet name is required."})
    
    conn = get_db()
    customer = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if not customer:
        conn.close()
        return jsonify({"success": False, "message": "Customer not found."})
    
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn.execute("""
        INSERT INTO pets (customer_email, pet_type, name, breed, age, gender, color, weight, medical_history, allergies, pet_image, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (email, pet_type, name, breed, age, gender, color, weight, medical_history, allergies, pet_image, now, now))
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Pet created successfully!"})

@app.route('/api/pets/<int:pet_id>', methods=["PUT"])
@jwt_required
def update_pet(pet_id):
    data = request.get_json()
    email = request.current_user.get("sub")
    role = request.current_user.get("role")
    
    pet_type = data.get("pet_type", "Dog").strip()
    name = data.get("name", "").strip()
    breed = data.get("breed", "").strip()
    age = data.get("age")
    gender = data.get("gender", "").strip()
    color = data.get("color", "").strip()
    weight = data.get("weight")
    medical_history = data.get("medical_history", "").strip()
    allergies = data.get("allergies", "").strip()
    pet_image = data.get("pet_image", "").strip()
    
    if not name:
        return jsonify({"success": False, "message": "Pet name is required."})
    
    conn = get_db()
    
    pet = conn.execute(
        "SELECT id, customer_email FROM pets WHERE id = ?",
        (pet_id,)
    ).fetchone()
    
    if not pet:
        conn.close()
        return jsonify({"success": False, "message": "Pet not found."})
    
    if pet["customer_email"] != email and role not in ["admin", "staff"]:
        conn.close()
        return jsonify({"success": False, "message": "You are not authorized to edit this pet."})
    
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    if pet_image:
        conn.execute("""
            UPDATE pets 
            SET pet_type = ?, name = ?, breed = ?, age = ?, gender = ?, color = ?, 
                weight = ?, medical_history = ?, allergies = ?, pet_image = ?, updated_at = ?
            WHERE id = ?
        """, (pet_type, name, breed, age, gender, color, weight, medical_history, allergies, pet_image, now, pet_id))
    else:
        conn.execute("""
            UPDATE pets 
            SET pet_type = ?, name = ?, breed = ?, age = ?, gender = ?, color = ?, 
                weight = ?, medical_history = ?, allergies = ?, updated_at = ?
            WHERE id = ?
        """, (pet_type, name, breed, age, gender, color, weight, medical_history, allergies, now, pet_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Pet updated successfully!"})

@app.route('/api/pets/<int:pet_id>', methods=["DELETE"])
@jwt_required
def delete_pet(pet_id):
    email = request.current_user.get("sub")
    role = request.current_user.get("role")
    
    conn = get_db()
    
    pet = conn.execute(
        "SELECT id, customer_email FROM pets WHERE id = ?",
        (pet_id,)
    ).fetchone()
    
    if not pet:
        conn.close()
        return jsonify({"success": False, "message": "Pet not found."})
    
    if pet["customer_email"] != email and role not in ["admin", "staff"]:
        conn.close()
        return jsonify({"success": False, "message": "You are not authorized to delete this pet."})
    
    conn.execute("DELETE FROM pets WHERE id = ?", (pet_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Pet deleted successfully!"})

# ── UPDATE PET IMAGE ──────────────────────────────────────────────────
@app.route('/api/pets/<int:pet_id>/image', methods=["PUT"])
@jwt_required
def update_pet_image(pet_id):
    data = request.get_json()
    email = request.current_user.get("sub")
    pet_image = data.get("pet_image", "").strip()
    
    conn = get_db()
    pet = conn.execute(
        "SELECT id, customer_email FROM pets WHERE id = ?",
        (pet_id,)
    ).fetchone()
    
    if not pet:
        conn.close()
        return jsonify({"success": False, "message": "Pet not found."})
    
    if pet["customer_email"] != email:
        role = request.current_user.get("role")
        if role not in ["admin", "staff"]:
            conn.close()
            return jsonify({"success": False, "message": "You are not authorized to edit this pet."})
    
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn.execute(
        "UPDATE pets SET pet_image = ?, updated_at = ? WHERE id = ?",
        (pet_image, now, pet_id)
    )
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Pet image updated successfully!"})

@app.route('/api/customers')
@role_required("admin", "staff")
def get_customers():
    conn = get_db()
    customers = conn.execute(
        "SELECT email, fullname, phone, address FROM users WHERE role = 'user' ORDER BY fullname"
    ).fetchall()
    conn.close()
    return jsonify({"success": True, "customers": [dict(c) for c in customers]})

# ── MEDICAL RECORDS ROUTES ─────────────────────────────────────────────
@app.route('/api/medical-records')
@role_required("vet", "admin")
def get_medical_records():
    conn = get_db()
    records = conn.execute("""
        SELECT mr.*, p.name as pet_name, p.pet_type, u.email as vet_email
        FROM medical_records mr
        JOIN pets p ON mr.pet_id = p.id
        JOIN users u ON mr.vet_email = u.email
        ORDER BY mr.visit_date DESC
    """).fetchall()
    conn.close()
    return jsonify({"success": True, "records": [dict(r) for r in records]})

@app.route('/api/medical-records/pet/<int:pet_id>')
@role_required("vet", "admin")
def get_pet_medical_records(pet_id):
    conn = get_db()
    records = conn.execute("""
        SELECT mr.*, u.email as vet_email
        FROM medical_records mr
        JOIN users u ON mr.vet_email = u.email
        WHERE mr.pet_id = ?
        ORDER BY mr.visit_date DESC
    """, (pet_id,)).fetchall()
    conn.close()
    return jsonify({"success": True, "records": [dict(r) for r in records]})

@app.route('/api/medical-records', methods=["POST"])
@role_required("vet")
def create_medical_record():
    data = request.get_json()
    vet_email = request.current_user.get("sub")
    
    pet_id = data.get("pet_id")
    visit_date = data.get("visit_date", "").strip()
    diagnosis = data.get("diagnosis", "").strip()
    treatment = data.get("treatment", "").strip()
    prescription = data.get("prescription", "").strip()
    notes = data.get("notes", "").strip()
    
    if not pet_id or not visit_date or not diagnosis:
        return jsonify({"success": False, "message": "Pet, visit date, and diagnosis are required."})
    
    conn = get_db()
    pet = conn.execute("SELECT id FROM pets WHERE id = ?", (pet_id,)).fetchone()
    if not pet:
        conn.close()
        return jsonify({"success": False, "message": "Pet not found."})
    
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn.execute("""
        INSERT INTO medical_records (pet_id, vet_email, visit_date, diagnosis, treatment, prescription, notes, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
    """, (pet_id, vet_email, visit_date, diagnosis, treatment, prescription, notes, now, now))
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Medical record saved successfully!"})

@app.route('/api/medical-records/<int:record_id>', methods=["PUT"])
@role_required("vet")
def update_medical_record(record_id):
    data = request.get_json()
    
    diagnosis = data.get("diagnosis", "").strip()
    treatment = data.get("treatment", "").strip()
    prescription = data.get("prescription", "").strip()
    notes = data.get("notes", "").strip()
    status = data.get("status", "active").strip()
    
    if not diagnosis:
        return jsonify({"success": False, "message": "Diagnosis is required."})
    
    conn = get_db()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn.execute("""
        UPDATE medical_records 
        SET diagnosis = ?, treatment = ?, prescription = ?, notes = ?, status = ?, updated_at = ?
        WHERE id = ?
    """, (diagnosis, treatment, prescription, notes, status, now, record_id))
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Medical record updated successfully!"})

# ── ML RECOMMENDATIONS ROUTES ──────────────────────────────────────────
@app.route('/api/ml-recommendations')
@role_required("vet", "admin")
def get_ml_recommendations():
    conn = get_db()
    recommendations = conn.execute("""
        SELECT ml.*, p.name as pet_name, p.pet_type, p.breed, p.age
        FROM ml_recommendations ml
        JOIN pets p ON ml.pet_id = p.id
        WHERE ml.status = 'pending'
        ORDER BY ml.created_at DESC
    """).fetchall()
    conn.close()
    return jsonify({"success": True, "recommendations": [dict(r) for r in recommendations]})

@app.route('/api/ml-recommendations', methods=["POST"])
@role_required("vet", "admin")
def create_ml_recommendation():
    data = request.get_json()
    
    pet_id = data.get("pet_id")
    recommendation_type = data.get("recommendation_type", "").strip()
    recommendation_text = data.get("recommendation_text", "").strip()
    confidence_score = data.get("confidence_score", 0.0)
    
    if not pet_id or not recommendation_type or not recommendation_text:
        return jsonify({"success": False, "message": "All fields are required."})
    
    conn = get_db()
    pet = conn.execute("SELECT id FROM pets WHERE id = ?", (pet_id,)).fetchone()
    if not pet:
        conn.close()
        return jsonify({"success": False, "message": "Pet not found."})
    
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn.execute("""
        INSERT INTO ml_recommendations (pet_id, recommendation_type, recommendation_text, confidence_score, status, created_at)
        VALUES (?, ?, ?, ?, 'pending', ?)
    """, (pet_id, recommendation_type, recommendation_text, confidence_score, now))
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "ML recommendation created!"})

@app.route('/api/ml-recommendations/<int:rec_id>/validate', methods=["PUT"])
@role_required("vet")
def validate_ml_recommendation(rec_id):
    data = request.get_json()
    status = data.get("status", "validated").strip()
    vet_notes = data.get("vet_notes", "").strip()
    
    if status not in ["validated", "rejected"]:
        return jsonify({"success": False, "message": "Invalid status."})
    
    conn = get_db()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn.execute("""
        UPDATE ml_recommendations 
        SET status = ?, vet_notes = ?, validated_at = ?
        WHERE id = ?
    """, (status, vet_notes, now, rec_id))
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": f"ML recommendation {status}!"})

# ── APPOINTMENT ROUTES ────────────────────────────────────────────────
@app.route('/api/services')
def get_services():
    conn = get_db()
    services = conn.execute(
        "SELECT * FROM services WHERE is_active = 1 ORDER BY name"
    ).fetchall()
    conn.close()
    return jsonify({"success": True, "services": [dict(s) for s in services]})

# ── CHECK AVAILABILITY ─────────────────────────────────────────────────
@app.route('/api/appointments/check-availability', methods=["POST"])
@jwt_required
def check_availability():
    """Check if a date/time slot is available for booking"""
    data = request.get_json()
    appointment_date = data.get("appointment_date", "").strip()
    appointment_time = data.get("appointment_time", "").strip()
    
    if not appointment_date or not appointment_time:
        return jsonify({"success": False, "message": "Date and time are required."})
    
    conn = get_db()
    
    # ── CHECK DATE-SPECIFIC CLOSURE ──────────────────────────────────
    staff_email = "staff@petlink.com"
    date_closure = conn.execute("""
        SELECT reason FROM date_closures 
        WHERE staff_email = ? AND closure_date = ?
    """, (staff_email, appointment_date)).fetchone()
    
    if date_closure:
        conn.close()
        return jsonify({
            "success": False, 
            "available": False,
            "message": f"The clinic is closed on {appointment_date}. Reason: {date_closure['reason']}",
            "date_closed": True,
            "closure_reason": date_closure["reason"]
        })
    
    # ── CHECK STAFF AVAILABILITY ──────────────────────────────────────
    day_of_week = get_day_of_week_index(appointment_date)
    day_name = get_day_name(day_of_week)
    
    availability = conn.execute("""
        SELECT is_available, max_slots_per_day 
        FROM staff_availability 
        WHERE staff_email = ? AND day_of_week = ?
    """, (staff_email, day_of_week)).fetchone()
    
    if not availability or availability["is_available"] == 0:
        conn.close()
        return jsonify({
            "success": False, 
            "available": False,
            "message": f"The clinic is closed on {day_name}. Please choose another day.",
            "day_closed": True,
            "day_name": day_name
        })
    
    # ── CHECK DAILY MAX CAPACITY ──────────────────────────────────────
    daily_max = availability["max_slots_per_day"]
    
    # Check if there's a specific date override for max slots
    date_override = conn.execute("""
        SELECT max_slots_per_day FROM date_overrides 
        WHERE staff_email = ? AND override_date = ?
    """, (staff_email, appointment_date)).fetchone()
    
    if date_override:
        daily_max = date_override["max_slots_per_day"]
    
    daily_count = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ? AND status != 'cancelled'",
        (appointment_date,)
    ).fetchone()["count"]
    
    if daily_count >= daily_max:
        conn.close()
        return jsonify({
            "success": False,
            "available": False,
            "message": f"Sorry, this day is fully booked. Max {daily_max} appointments per day.",
            "daily_full": True,
            "day_name": day_name,
            "daily_booked": daily_count,
            "daily_max": daily_max
        })
    
    # ── CHECK TIME SLOT MAX CAPACITY ──────────────────────────────────
    time_slot_setting = conn.execute("""
        SELECT max_slots, is_active 
        FROM staff_time_slots 
        WHERE staff_email = ? AND day_of_week = ? AND time_slot = ?
    """, (staff_email, day_of_week, appointment_time)).fetchone()
    
    if time_slot_setting and time_slot_setting["is_active"] == 0:
        conn.close()
        return jsonify({
            "success": False,
            "available": False,
            "message": f"This time slot is not available on {day_name}. Please choose another time.",
            "time_slot_inactive": True,
            "day_name": day_name
        })
    
    max_per_slot = time_slot_setting["max_slots"] if time_slot_setting else 1
    
    # ── CHECK TIME SLOT CAPACITY ──────────────────────────────────────
    slot_count = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ? AND appointment_time = ? AND status != 'cancelled'",
        (appointment_date, appointment_time)
    ).fetchone()["count"]
    
    if slot_count >= max_per_slot:
        conn.close()
        return jsonify({
            "success": False,
            "available": False,
            "message": f"Sorry, this time slot is fully booked. Max {max_per_slot} per slot.",
            "slot_full": True,
            "day_name": day_name
        })
    
    conn.close()
    
    return jsonify({
        "success": True,
        "available": True,
        "booked": slot_count,
        "max_capacity": max_per_slot,
        "daily_booked": daily_count,
        "daily_max": daily_max,
        "day_name": day_name
    })

# ── GET BOOKED SLOTS FOR A DATE ──────────────────────────────────────
@app.route('/api/appointments/booked-slots/<date>')
@jwt_required
def get_booked_slots(date):
    """Get all booked time slots for a specific date with staff settings"""
    conn = get_db()
    
    from datetime import datetime as dt
    date_obj = dt.strptime(date, "%Y-%m-%d")
    day_of_week = date_obj.weekday()  # ✅ 0=Monday, 1=Tuesday, 2=Wednesday...
    day_name = get_day_name(day_of_week)
    
    print(f"📅 Date: {date}, Day Index: {day_of_week}, Day Name: {day_name}")
    
    staff_email = "staff@petlink.com"
    
    # ── CHECK IF SPECIFIC DATE IS CLOSED ────────────────────────────
    date_closure = conn.execute("""
        SELECT reason FROM date_closures 
        WHERE staff_email = ? AND closure_date = ?
    """, (staff_email, date)).fetchone()
    
    if date_closure:
        conn.close()
        return jsonify({
            "success": True,
            "slots": {},
            "day_available": False,
            "is_date_closed": True,
            "closure_reason": date_closure["reason"],
            "day_name": day_name,
            "message": f"Clinic is closed on {date} - {date_closure['reason']}"
        })
    
    # ── CHECK IF DAY IS AVAILABLE (regular schedule) ──────────────
    day_setting = conn.execute("""
        SELECT is_available, max_slots_per_day 
        FROM staff_availability 
        WHERE staff_email = ? AND day_of_week = ?
    """, (staff_email, day_of_week)).fetchone()
    
    day_available = day_setting and day_setting["is_available"] == 1
    daily_max = day_setting["max_slots_per_day"] if day_setting else 3
    
    # Check for date-specific max slots override
    date_override = conn.execute("""
        SELECT max_slots_per_day FROM date_overrides 
        WHERE staff_email = ? AND override_date = ?
    """, (staff_email, date)).fetchone()
    
    if date_override:
        daily_max = date_override["max_slots_per_day"]
    
    # ── GET DAILY BOOKED COUNT ──────────────────────────────────────
    daily_booked = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ? AND status != 'cancelled'",
        (date,)
    ).fetchone()["count"]
    
    is_daily_full = daily_booked >= daily_max
    
    # ── GET TIME SLOT SETTINGS ──────────────────────────────────────
    time_slot_settings = conn.execute("""
        SELECT time_slot, max_slots, is_active 
        FROM staff_time_slots 
        WHERE staff_email = ? AND day_of_week = ?
    """, (staff_email, day_of_week)).fetchall()
    
    # ── GET BOOKED SLOTS ──────────────────────────────────────────────
    booked_slots = conn.execute("""
        SELECT appointment_time, COUNT(*) as count 
        FROM appointments 
        WHERE appointment_date = ? AND status != 'cancelled'
        GROUP BY appointment_time
    """, (date,)).fetchall()
    
    conn.close()
    
    # ── BUILD RESPONSE ─────────────────────────────────────────────────
    booked_dict = {}
    for slot in booked_slots:
        booked_dict[slot["appointment_time"]] = slot["count"]
    
    # All possible time slots
    all_time_slots = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", 
                      "11:00", "11:30", "12:00", "13:00", "13:30", "14:00", 
                      "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"]
    
    result = {}
    for time_slot in all_time_slots:
        slot_setting = next((s for s in time_slot_settings if s["time_slot"] == time_slot), None)
        is_active = slot_setting["is_active"] == 1 if slot_setting else True
        max_per_slot = slot_setting["max_slots"] if slot_setting else 1
        
        booked = booked_dict.get(time_slot, 0)
        
        result[time_slot] = {
            "booked": booked,
            "max_slots": max_per_slot,
            "available": booked < max_per_slot and day_available and is_active and not is_daily_full,
            "is_active": is_active,
            "day_available": day_available,
            "daily_booked": daily_booked,
            "daily_max": daily_max,
            "is_daily_full": is_daily_full
        }
    
    return jsonify({
        "success": True, 
        "slots": result,
        "day_available": day_available,
        "daily_max": daily_max,
        "daily_booked": daily_booked,
        "is_daily_full": is_daily_full,
        "day_of_week": day_of_week,
        "day_name": day_name,
        "is_date_closed": False
    })
    
@app.route('/api/appointments')
@jwt_required
def get_appointments():
    email = request.current_user.get("sub")
    conn = get_db()
    
    appointments = conn.execute("""
        SELECT a.*, p.name as pet_name
        FROM appointments a
        JOIN pets p ON a.pet_id = p.id
        WHERE a.customer_email = ?
        ORDER BY a.appointment_date ASC, a.appointment_time ASC
    """, (email,)).fetchall()
    
    result = []
    for app in appointments:
        app_dict = dict(app)
        # Parse services JSON
        try:
            services = json.loads(app_dict['services'])
            app_dict['services'] = services
            app_dict['service_names'] = ', '.join(services)
        except:
            app_dict['services'] = []
            app_dict['service_names'] = ''
        
        # Get service details
        if app_dict['services']:
            placeholders = ','.join(['?' for _ in app_dict['services']])
            service_details = conn.execute(
                f"SELECT name, price, duration FROM services WHERE name IN ({placeholders}) AND is_active = 1",
                app_dict['services']
            ).fetchall()
            app_dict['total_price'] = sum(s["price"] for s in service_details)
            app_dict['total_duration'] = sum(s["duration"] for s in service_details)
        else:
            app_dict['total_price'] = 0
            app_dict['total_duration'] = 0
        
        result.append(app_dict)
    
    conn.close()
    return jsonify({"success": True, "appointments": result})

@app.route('/api/appointments/all')
@role_required("admin", "staff")
def get_all_appointments():
    conn = get_db()
    
    appointments = conn.execute("""
        SELECT a.*, p.name as pet_name, u.email as customer_email
        FROM appointments a
        JOIN pets p ON a.pet_id = p.id
        JOIN users u ON a.customer_email = u.email
        WHERE u.role = 'user'
        ORDER BY a.appointment_date ASC, a.appointment_time ASC
    """).fetchall()
    
    result = []
    for app in appointments:
        app_dict = dict(app)
        try:
            services = json.loads(app_dict['services'])
            app_dict['services'] = services
            app_dict['service_names'] = ', '.join(services)
        except:
            app_dict['services'] = []
            app_dict['service_names'] = ''
        result.append(app_dict)
    
    conn.close()
    return jsonify({"success": True, "appointments": result})

@app.route('/api/appointments', methods=["POST"])
@jwt_required
def create_appointment():
    data = request.get_json()
    email = request.current_user.get("sub")
    
    pet_id = data.get("pet_id")
    services = data.get("services", [])  # Array of service names
    appointment_date = data.get("appointment_date", "").strip()
    appointment_time = data.get("appointment_time", "").strip()
    notes = data.get("notes", "").strip()
    
    if not pet_id or not services or len(services) == 0 or not appointment_date or not appointment_time:
        return jsonify({"success": False, "message": "Pet, at least one service, date, and time are required."})
    
    conn = get_db()
    
    # ── CHECK DATE-SPECIFIC CLOSURE ──────────────────────────────────
    staff_email = "staff@petlink.com"
    date_closure = conn.execute("""
        SELECT reason FROM date_closures 
        WHERE staff_email = ? AND closure_date = ?
    """, (staff_email, appointment_date)).fetchone()
    
    if date_closure:
        conn.close()
        return jsonify({
            "success": False, 
            "message": f"The clinic is closed on {appointment_date}. Reason: {date_closure['reason']}",
            "date_closed": True,
            "closure_reason": date_closure["reason"]
        })
    
    # ── CHECK STAFF AVAILABILITY ──────────────────────────────────────
    day_of_week = get_day_of_week_index(appointment_date)
    day_name = get_day_name(day_of_week)
    
    # Check if day is available
    day_setting = conn.execute("""
        SELECT is_available, max_slots_per_day 
        FROM staff_availability 
        WHERE staff_email = ? AND day_of_week = ?
    """, (staff_email, day_of_week)).fetchone()
    
    if not day_setting or day_setting["is_available"] == 0:
        conn.close()
        return jsonify({
            "success": False, 
            "message": f"The clinic is closed on {day_name}. Please choose another day.",
            "day_closed": True,
            "day_name": day_name
        })
    
    # ── CHECK DAILY CAPACITY ──────────────────────────────────────────
    daily_max = day_setting["max_slots_per_day"]
    
    # Check for date-specific max slots override
    date_override = conn.execute("""
        SELECT max_slots_per_day FROM date_overrides 
        WHERE staff_email = ? AND override_date = ?
    """, (staff_email, appointment_date)).fetchone()
    
    if date_override:
        daily_max = date_override["max_slots_per_day"]
    
    daily_count = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ? AND status != 'cancelled'",
        (appointment_date,)
    ).fetchone()["count"]
    
    if daily_count >= daily_max:
        conn.close()
        return jsonify({
            "success": False,
            "message": f"Sorry, this day is fully booked. Max {daily_max} appointments per day.",
            "daily_full": True,
            "day_name": day_name
        })
    
    # ── CHECK TIME SLOT CAPACITY ──────────────────────────────────────
    time_slot_setting = conn.execute("""
        SELECT max_slots, is_active 
        FROM staff_time_slots 
        WHERE staff_email = ? AND day_of_week = ? AND time_slot = ?
    """, (staff_email, day_of_week, appointment_time)).fetchone()
    
    if time_slot_setting and time_slot_setting["is_active"] == 0:
        conn.close()
        return jsonify({
            "success": False,
            "message": f"This time slot is not available on {day_name}. Please choose another time.",
            "time_slot_inactive": True,
            "day_name": day_name
        })
    
    max_per_slot = time_slot_setting["max_slots"] if time_slot_setting else 1
    
    slot_count = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ? AND appointment_time = ? AND status != 'cancelled'",
        (appointment_date, appointment_time)
    ).fetchone()["count"]
    
    if slot_count >= max_per_slot:
        conn.close()
        return jsonify({
            "success": False, 
            "message": f"Sorry, this time slot is fully booked. Max {max_per_slot} per slot.",
            "slot_full": True,
            "day_name": day_name
        })
    
    # ── GET PET WITH NAME ──────────────────────────────────────────────
    pet = conn.execute(
        "SELECT id, name FROM pets WHERE id = ? AND customer_email = ?",
        (pet_id, email)
    ).fetchone()
    if not pet:
        conn.close()
        return jsonify({"success": False, "message": "Pet not found or does not belong to you."})
    
    # ── VALIDATE SERVICES ─────────────────────────────────────────────
    placeholders = ','.join(['?' for _ in services])
    valid_services = conn.execute(
        f"SELECT name, price, duration FROM services WHERE name IN ({placeholders}) AND is_active = 1",
        services
    ).fetchall()
    
    valid_service_names = [s["name"] for s in valid_services]
    if len(valid_service_names) != len(services):
        conn.close()
        return jsonify({"success": False, "message": "One or more services are not available."})
    
    # ── CALCULATE TOTAL PRICE AND DURATION ────────────────────────────
    total_price = sum(s["price"] for s in valid_services)
    total_duration = sum(s["duration"] for s in valid_services)
    
    # ── SAVE AS JSON ──────────────────────────────────────────────────
    services_json = json.dumps(services)
    
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO appointments (customer_email, pet_id, services, appointment_date, appointment_time, notes, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    """, (email, pet_id, services_json, appointment_date, appointment_time, notes, now, now))
    
    appointment_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    service_names = ', '.join(services)
    appointment_data = {
        'pet_name': pet['name'],
        'service': service_names,
        'date': appointment_date,
        'time': appointment_time,
        'status': 'pending',
        'notes': notes,
        'total_price': total_price,
        'total_duration': total_duration
    }
    
    try:
        send_booking_confirmation(email, appointment_data)
    except Exception as e:
        print(f"Email sending error (non-critical): {e}")
    
    return jsonify({
        "success": True, 
        "message": "Appointment booked successfully! Please wait for confirmation.",
        "appointment_id": appointment_id,
        "services": services,
        "total_price": total_price,
        "total_duration": total_duration
    })

@app.route('/api/appointments/<int:appointment_id>/status', methods=["PUT"])
@role_required("admin", "staff")
def update_appointment_status(appointment_id):
    data = request.get_json()
    status = data.get("status", "").strip()
    
    if status not in ["pending", "confirmed", "completed", "cancelled"]:
        return jsonify({"success": False, "message": "Invalid status."})
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT a.*, p.name as pet_name, u.email as customer_email
            FROM appointments a
            JOIN pets p ON a.pet_id = p.id
            JOIN users u ON a.customer_email = u.email
            WHERE a.id = ?
        """, (appointment_id,))
        appointment = cursor.fetchone()
        
        if not appointment:
            conn.close()
            return jsonify({"success": False, "message": "Appointment not found."})
        
        # Parse services
        try:
            services = json.loads(appointment["services"])
            service_names = ', '.join(services)
        except:
            service_names = appointment["services"]
        
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute(
            "UPDATE appointments SET status = ?, updated_at = ? WHERE id = ?",
            (status, now, appointment_id)
        )
        conn.commit()
        
        appointment_data = {
            'pet_name': appointment["pet_name"],
            'service': service_names,
            'date': appointment["appointment_date"],
            'time': appointment["appointment_time"],
            'status': status,
            'notes': appointment["notes"]
        }
        
        email_sent = False
        
        if status == "confirmed":
            email_sent = send_appointment_confirmation(appointment["customer_email"], appointment_data)
        elif status == "completed":
            email_sent = send_appointment_completion(appointment["customer_email"], appointment_data)
        elif status == "cancelled":
            email_sent = send_appointment_cancellation(appointment["customer_email"], appointment_data)
        
        if email_sent:
            message = f"Appointment {status}! Email notification sent to customer."
        else:
            message = f"Appointment {status}! (Note: Email could not be sent. Please verify email configuration.)"
        
    except Exception as e:
        conn.rollback()
        print(f"Error updating appointment: {e}")
        conn.close()
        return jsonify({"success": False, "message": "An error occurred."})
    
    conn.close()
    return jsonify({"success": True, "message": message})

@app.route('/api/appointments/<int:appointment_id>/cancel', methods=["PUT"])
@jwt_required
def cancel_appointment(appointment_id):
    email = request.current_user.get("sub")
    
    conn = get_db()
    appointment = conn.execute(
        "SELECT status FROM appointments WHERE id = ? AND customer_email = ?",
        (appointment_id, email)
    ).fetchone()
    
    if not appointment:
        conn.close()
        return jsonify({"success": False, "message": "Appointment not found."})
    
    if appointment["status"] == "completed":
        conn.close()
        return jsonify({"success": False, "message": "Cannot cancel a completed appointment."})
    
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn.execute(
        "UPDATE appointments SET status = 'cancelled', updated_at = ? WHERE id = ?",
        (now, appointment_id)
    )
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Appointment cancelled successfully."})

@app.route('/api/appointments/<int:appointment_id>', methods=["DELETE"])
@role_required("admin")
def delete_appointment(appointment_id):
    conn = get_db()
    conn.execute("DELETE FROM appointments WHERE id = ?", (appointment_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Appointment deleted successfully."})

# ── MESSAGE ROUTES ─────────────────────────────────────────────────────

@app.route('/api/messages', methods=["POST"])
@jwt_required
def send_message():
    data = request.get_json()
    sender_email = request.current_user.get("sub")
    role = request.current_user.get("role")
    subject = data.get("subject", "").strip()
    message = data.get("message", "").strip()
    receiver = data.get("receiver", "").strip()
    image_data = data.get("image_data", "").strip()
    image_name = data.get("image_name", "").strip()
    image_type = data.get("image_type", "").strip()
    
    if not message and not image_data:
        return jsonify({"success": False, "message": "Message or image is required."})
    
    conn = get_db()
    
    if receiver:
        receiver_user = conn.execute(
            "SELECT email, role FROM users WHERE email = ?", 
            (receiver,)
        ).fetchone()
        
        if receiver_user:
            receiver_email = receiver
        else:
            conn.close()
            return jsonify({"success": False, "message": "Recipient not found."})
    else:
        staff = conn.execute(
            "SELECT email FROM users WHERE role = 'staff' ORDER BY role LIMIT 1"
        ).fetchone()
        if not staff:
            conn.close()
            return jsonify({"success": False, "message": "No staff available."})
        receiver_email = staff["email"]
    
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # ── FIX: Store message without duplicating image data ──────────────
    import re
    
    if image_data:
        # Clean the message first - remove any existing [IMAGE:...] blocks
        clean_message = re.sub(r'\[IMAGE:[^\]]+\]', '', message).strip()
        clean_message = re.sub(r'^Image:\s*', '', clean_message).strip()
        clean_message = re.sub(r'^📷\s*Image:\s*', '', clean_message).strip()
        clean_message = re.sub(r'^Screenshot.*\.png\s*', '', clean_message).strip()
        
        # Only add [IMAGE:...] if there's actual image data
        if clean_message:
            full_message = f"{clean_message}\n[IMAGE:{image_data}]"
        else:
            full_message = f"[IMAGE:{image_data}]"
    else:
        full_message = message
    
    conn.execute("""
        INSERT INTO messages (sender_email, receiver_email, subject, message, is_read, created_at)
        VALUES (?, ?, ?, ?, 0, ?)
    """, (sender_email, receiver_email, subject, full_message, now))
    conn.commit()
    conn.close()
    
    # Emit socket event with image data separately
    socketio.emit('new_message', {
        'sender': sender_email,
        'receiver': receiver_email,
        'message': full_message,
        'subject': subject,
        'timestamp': now,
        'image_data': image_data if image_data else None,
        'image_name': image_name if image_name else None,
        'image_type': image_type if image_type else None
    }, room=receiver_email)
    
    socketio.emit('message_sent', {
        'success': True,
        'message': 'Message sent successfully!'
    }, room=sender_email)
    
    return jsonify({"success": True, "message": "Message sent successfully!"})

@app.route('/api/messages')
@jwt_required
def get_messages():
    email = request.current_user.get("sub")
    role = request.current_user.get("role")
    
    conn = get_db()
    
    if role in ["staff", "admin"]:
        messages = conn.execute("""
            SELECT m.*, 
                   u.email as sender_email,
                   u.fullname as sender_name,
                   u.phone as sender_phone
            FROM messages m
            JOIN users u ON m.sender_email = u.email
            WHERE m.receiver_email = ?
            ORDER BY m.created_at DESC
        """, (email,)).fetchall()
        
        senders = conn.execute("""
            SELECT DISTINCT 
                   u.email, 
                   u.fullname,
                   u.phone,
                   (SELECT COUNT(*) FROM messages 
                    WHERE sender_email = u.email 
                    AND receiver_email = ? 
                    AND is_read = 0) as unread_count
            FROM messages m
            JOIN users u ON m.sender_email = u.email
            WHERE m.receiver_email = ?
              AND u.role = 'user'
            ORDER BY m.created_at DESC
        """, (email, email)).fetchall()
        
        conn.close()
        return jsonify({
            "success": True, 
            "messages": [dict(m) for m in messages],
            "senders": [dict(s) for s in senders]
        })
    else:
        messages = conn.execute("""
            SELECT m.*, 
                   u1.email as sender_email,
                   u2.email as receiver_email,
                   CASE 
                       WHEN m.sender_email = ? THEN 'sent'
                       ELSE 'received'
                   END as direction,
                   u2.fullname as receiver_name,
                   u1.fullname as sender_name
            FROM messages m
            JOIN users u1 ON m.sender_email = u1.email
            JOIN users u2 ON m.receiver_email = u2.email
            WHERE m.sender_email = ? OR m.receiver_email = ?
            ORDER BY m.created_at DESC
        """, (email, email, email)).fetchall()
        
        conn.close()
        return jsonify({"success": True, "messages": [dict(m) for m in messages]})

@app.route('/api/messages/received-only')
@jwt_required
def get_received_messages_only():
    """Get ONLY messages received by the current staff/admin user"""
    email = request.current_user.get("sub")
    role = request.current_user.get("role")
    
    if role not in ["staff", "admin"]:
        return jsonify({"success": False, "message": "Access denied"})
    
    conn = get_db()
    
    senders = conn.execute("""
        SELECT DISTINCT 
               u.email, 
               u.fullname,
               u.phone,
               (SELECT COUNT(*) FROM messages 
                WHERE sender_email = u.email 
                AND receiver_email = ? 
                AND is_read = 0) as unread_count,
               (SELECT MAX(created_at) FROM messages 
                WHERE sender_email = u.email 
                AND receiver_email = ?) as last_message_at
        FROM messages m
        JOIN users u ON m.sender_email = u.email
        WHERE m.receiver_email = ?
          AND u.role = 'user'
        ORDER BY last_message_at DESC
    """, (email, email, email)).fetchall()
    
    conn.close()
    return jsonify({"success": True, "senders": [dict(s) for s in senders]})

@app.route('/api/messages/<sender_email>')
@jwt_required
def get_conversation(sender_email):
    staff_email = request.current_user.get("sub")
    role = request.current_user.get("role")
    
    if role not in ["staff", "admin"]:
        return jsonify({"success": False, "message": "Access denied."})
    
    conn = get_db()
    messages = conn.execute("""
        SELECT * FROM messages 
        WHERE (sender_email = ? AND receiver_email = ?) 
           OR (sender_email = ? AND receiver_email = ?)
        ORDER BY created_at ASC
    """, (sender_email, staff_email, staff_email, sender_email)).fetchall()
    
    conn.execute("""
        UPDATE messages SET is_read = 1 
        WHERE sender_email = ? AND receiver_email = ? AND is_read = 0
    """, (sender_email, staff_email))
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "messages": [dict(m) for m in messages]})

@app.route('/api/messages/customer/<staff_email>')
@jwt_required
def get_customer_conversation(staff_email):
    customer_email = request.current_user.get("sub")
    role = request.current_user.get("role")
    
    if role not in ["user"]:
        return jsonify({"success": False, "message": "Access denied."})
    
    conn = get_db()
    messages = conn.execute("""
        SELECT * FROM messages 
        WHERE (sender_email = ? AND receiver_email = ?) 
           OR (sender_email = ? AND receiver_email = ?)
        ORDER BY created_at ASC
    """, (customer_email, staff_email, staff_email, customer_email)).fetchall()
    
    conn.execute("""
        UPDATE messages SET is_read = 1 
        WHERE sender_email = ? AND receiver_email = ? AND is_read = 0
    """, (staff_email, customer_email))
    conn.commit()
    
    conn.close()
    
    return jsonify({"success": True, "messages": [dict(m) for m in messages]})

@app.route('/api/messages/<int:message_id>/read', methods=["PUT"])
@jwt_required
def mark_message_read(message_id):
    email = request.current_user.get("sub")
    
    conn = get_db()
    conn.execute("""
        UPDATE messages SET is_read = 1 
        WHERE id = ? AND receiver_email = ?
    """, (message_id, email))
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Message marked as read."})

@app.route('/api/messages/unread-count')
@jwt_required
def get_unread_count():
    email = request.current_user.get("sub")
    
    conn = get_db()
    count = conn.execute(
        "SELECT COUNT(*) as count FROM messages WHERE receiver_email = ? AND is_read = 0",
        (email,)
    ).fetchone()["count"]
    conn.close()
    
    return jsonify({"success": True, "count": count})

@app.route('/api/messages/mark-read', methods=["POST"])
@jwt_required
def mark_messages_read():
    """Mark all messages from a sender to the current user as read."""
    data = request.get_json()
    sender = data.get("sender")
    receiver = request.current_user.get("sub")
    
    if not sender:
        return jsonify({"success": False, "message": "Sender email is required."})
    
    conn = get_db()
    conn.execute("""
        UPDATE messages SET is_read = 1 
        WHERE sender_email = ? AND receiver_email = ? AND is_read = 0
    """, (sender, receiver))
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Messages marked as read."})

# ── APPOINTMENT COUNT ENDPOINTS ──────────────────────────────────────
@app.route('/api/appointments/count')
@role_required("admin", "staff")
def get_appointments_count():
    conn = get_db()
    count = conn.execute(
        "SELECT COUNT(*) as count FROM appointments"
    ).fetchone()["count"]
    conn.close()
    return jsonify({"success": True, "count": count})

@app.route('/api/appointments/pending-count')
@role_required("admin", "staff")
def get_pending_appointments_count():
    conn = get_db()
    count = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE status = 'pending'"
    ).fetchone()["count"]
    conn.close()
    return jsonify({"success": True, "count": count})

@app.route('/api/appointments/confirmed-count')
@role_required("admin", "staff")
def get_confirmed_appointments_count():
    conn = get_db()
    count = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE status = 'confirmed'"
    ).fetchone()["count"]
    conn.close()
    return jsonify({"success": True, "count": count})

# ── CANCELLED APPOINTMENTS COUNT ──────────────────────────────────────
@app.route('/api/appointments/cancelled-count')
@role_required("admin", "staff")
def get_cancelled_appointments_count():
    conn = get_db()
    count = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE status = 'cancelled'"
    ).fetchone()["count"]
    conn.close()
    return jsonify({"success": True, "count": count})

@app.route('/forgot-password', methods=["GET", "POST"])
def forgot_password():
    if request.method == "POST":
        data = request.get_json()
        email = data.get("email", "").strip().lower()

        conn = get_db()
        user = conn.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone()

        if user:
            token = secrets.token_urlsafe(32)
            expires_at = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
            conn.execute(
                "INSERT INTO reset_tokens (email, token, expires_at, used) VALUES (?,?,?,0)",
                (email, token, expires_at)
            )
            conn.commit()
            conn.close()
            
            # ── Build reset link dynamically based on environment ─────
            # Sa production (Render), gagamitin ang actual domain
            # Sa local, gagamitin ang localhost
            base_url = request.host_url.rstrip('/')
            reset_link = f"{base_url}/reset-password?token={token}"
            
            # ── Send reset email IN BACKGROUND (non-blocking) ─────────
            # (Kung may email sending function ka para sa reset password,
            #  i-uncomment ito at idagdag ang function call)
            # import threading
            # def send_email_async():
            #     try:
            #         send_password_reset_email(email, reset_link)
            #     except Exception as e:
            #         print(f"Email error (background): {e}")
            # 
            # email_thread = threading.Thread(target=send_email_async)
            # email_thread.daemon = True
            # email_thread.start()
            
            return jsonify({
                "success": True,
                "message": "If that email exists, a reset link has been generated.",
                "reset_link": reset_link
            })
        conn.close()
        return jsonify({"success": True, "message": "If that email exists, a reset link has been generated."})

    return render_template('forgot_password.html')

@app.route('/reset-password', methods=["GET", "POST"])
def reset_password():
    if request.method == "GET":
        token = request.args.get("token", "")
        return render_template('reset_password.html', token=token)

    data = request.get_json()
    token = data.get("token", "")
    new_password = data.get("password", "")

    ok, err = is_strong_password(new_password)
    if not ok:
        return jsonify({"success": False, "message": err})

    conn = get_db()
    record = conn.execute(
        "SELECT * FROM reset_tokens WHERE token=? AND used=0", (token,)
    ).fetchone()

    if not record:
        conn.close()
        return jsonify({"success": False, "message": "Invalid or already-used reset token."})

    expires_at = datetime.fromisoformat(record["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        conn.close()
        return jsonify({"success": False, "message": "Reset token has expired. Please request a new one."})

    salt = generate_salt()
    hashed = hash_password(new_password, salt)
    conn.execute("UPDATE users SET salt=?, hashed_password=? WHERE email=?",
                 (salt, hashed, record["email"]))
    conn.execute("UPDATE reset_tokens SET used=1 WHERE token=?", (token,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Password reset successful! You can now sign in."})

@app.route('/api/verify-token', methods=["POST"])
def verify_token():
    data = request.get_json()
    token = data.get("token", "")
    payload = verify_jwt(token)
    if payload:
        return jsonify({"success": True, "payload": payload})
    return jsonify({"success": False, "message": "Invalid or expired token."})

# ── STAFF STATISTICS API ──────────────────────────────────────────────
@app.route('/api/staff/stats')
@role_required("admin", "staff")
def get_staff_stats():
    """Get all staff statistics from database"""
    conn = get_db()
    
    # ── Total Customers ──────────────────────────────────────────────
    total_customers = conn.execute(
        "SELECT COUNT(*) as count FROM users WHERE role = 'user'"
    ).fetchone()["count"]
    
    # ── Total Pets ──────────────────────────────────────────────────
    total_pets = conn.execute("SELECT COUNT(*) as count FROM pets").fetchone()["count"]
    
    # ── Total Appointments ──────────────────────────────────────────
    total_appointments = conn.execute("SELECT COUNT(*) as count FROM appointments").fetchone()["count"]
    
    # ── Pending Appointments ────────────────────────────────────────
    pending = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE status = 'pending'"
    ).fetchone()["count"]
    
    # ── Confirmed Appointments ──────────────────────────────────────
    confirmed = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE status = 'confirmed'"
    ).fetchone()["count"]
    
    # ── Completed Appointments ──────────────────────────────────────
    completed = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE status = 'completed'"
    ).fetchone()["count"]
    
    # ── Cancelled Appointments ──────────────────────────────────────
    cancelled = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE status = 'cancelled'"
    ).fetchone()["count"]
    
    # ── New Pets This Month ──────────────────────────────────────────
    current_month_start = datetime.now().strftime("%Y-%m-01 00:00:00")
    new_pets = conn.execute(
        "SELECT COUNT(*) as count FROM pets WHERE created_at >= ?",
        (current_month_start,)
    ).fetchone()["count"]
    
    # ── New Customers This Month ────────────────────────────────────
    new_customers = conn.execute(
        "SELECT COUNT(*) as count FROM users WHERE role = 'user' AND created_at >= ?",
        (current_month_start,)
    ).fetchone()["count"]
    
    # ── Appointment Completion Rate ──────────────────────────────────
    total = total_appointments if total_appointments > 0 else 1
    completion_rate = round(((completed + cancelled) / total) * 100)
    
    # ── Avg Appointments per Day (last 30 days) ──────────────────────
    thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d 00:00:00")
    appointments_30d = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE created_at >= ?",
        (thirty_days_ago,)
    ).fetchone()["count"]
    avg_per_day = round(appointments_30d / 30) if appointments_30d > 0 else 0
    
    conn.close()
    
    return jsonify({
        "success": True,
        "stats": {
            "total_customers": total_customers,
            "total_pets": total_pets,
            "total_appointments": total_appointments,
            "pending": pending,
            "confirmed": confirmed,
            "completed": completed,
            "cancelled": cancelled,
            "new_pets_this_month": new_pets,
            "new_customers_this_month": new_customers,
            "completion_rate": completion_rate,
            "avg_appointments_per_day": avg_per_day
        }
    })

# ── STAFF CHART DATA API ──────────────────────────────────────────────
@app.route('/api/staff/chart-data')
@role_required("admin", "staff")
def get_staff_chart_data():
    """Get all chart data from database for staff panel"""
    conn = get_db()
    
    # Get week offset from query parameter (default = 0 = current week)
    week_offset = request.args.get('week_offset', 0, type=int)
    
    # ── 1. APPOINTMENT TRENDS (By Day of Week - Monday to Sunday) ──
    short_day_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    
    trends = []
    today = datetime.now().date()
    
    # Get the start of the week (Monday) with offset
    start_of_week = today - timedelta(days=today.weekday()) + timedelta(weeks=week_offset)
    
    # Store the week range for display
    week_start = start_of_week.strftime("%b %d, %Y")
    week_end = (start_of_week + timedelta(days=6)).strftime("%b %d, %Y")
    week_label = f"{week_start} - {week_end}"
    
    for i in range(7):
        target_date = start_of_week + timedelta(days=i)
        date_str = target_date.strftime("%Y-%m-%d")
        
        # Count appointments for this specific date
        count = conn.execute(
            "SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ? AND status != 'cancelled'",
            (date_str,)
        ).fetchone()["count"]
        trends.append(count)
    
    # ── 2. PET TYPES ──────────────────────────────────────────────────
    dogs = conn.execute(
        "SELECT COUNT(*) as count FROM pets WHERE pet_type = 'Dog'"
    ).fetchone()["count"]
    
    cats = conn.execute(
        "SELECT COUNT(*) as count FROM pets WHERE pet_type = 'Cat'"
    ).fetchone()["count"]
    
    # ── 3. APPOINTMENT STATUS ────────────────────────────────────────
    pending = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE status = 'pending'"
    ).fetchone()["count"]
    
    confirmed = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE status = 'confirmed'"
    ).fetchone()["count"]
    
    completed = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE status = 'completed'"
    ).fetchone()["count"]
    
    cancelled = conn.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE status = 'cancelled'"
    ).fetchone()["count"]
    
    # ── 4. MONTHLY GROWTH (Last 12 months) ───────────────────────────
    monthly_growth = []
    for i in range(11, -1, -1):
        date = (datetime.now() - timedelta(days=i*30)).strftime("%Y-%m-01 00:00:00")
        next_month = (datetime.now() - timedelta(days=(i-1)*30 - 1)).strftime("%Y-%m-01 00:00:00")
        count = conn.execute(
            "SELECT COUNT(*) as count FROM appointments WHERE created_at >= ? AND created_at < ?",
            (date, next_month)
        ).fetchone()["count"]
        monthly_growth.append(count)
    
    conn.close()
    
    # ── Month labels ──────────────────────────────────────────────────
    months = []
    for i in range(11, -1, -1):
        month_date = datetime.now() - timedelta(days=i*30)
        months.append(month_date.strftime("%b"))
    
    return jsonify({
        "success": True,
        "data": {
            "trends": {
                "labels": short_day_names,
                "values": trends,
                "week_label": week_label,
                "week_offset": week_offset
            },
            "pet_types": {
                "labels": ["Dogs", "Cats"],
                "values": [dogs, cats]
            },
            "status": {
                "labels": ["Pending", "Confirmed", "Completed", "Cancelled"],
                "values": [pending, confirmed, completed, cancelled]
            },
            "monthly_growth": {
                "labels": months,
                "values": monthly_growth
            }
        }
    })

init_db()

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    socketio.run(app, debug=debug_mode, host='0.0.0.0', port=port, use_reloader=False)