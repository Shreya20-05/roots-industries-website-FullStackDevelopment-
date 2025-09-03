import os
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import mysql.connector
from mysql.connector import Error
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import datetime

app = Flask(__name__)
app.secret_key = os.urandom(24)

DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'database': 'roots_industries_db',
    'user': 'root',
    'password': 'shreya@2005',
    'autocommit': False,
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci',
    'raise_on_warnings': True
}

def get_db_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        if conn.is_connected():
            return conn
        return None
    except mysql.connector.Error:
        return None
    except Exception:
        return None

def execute_query(query, params=None, fetch=False):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        if not conn:
            return None, "Database connection failed"
        cursor = conn.cursor(dictionary=True if fetch else False)
        cursor.execute(query, params or ())
        if fetch:
            result = cursor.fetchall() if fetch == 'all' else cursor.fetchone()
            return result, None
        else:
            conn.commit()
            return cursor.lastrowid, None
    except Error as e:
        if conn:
            conn.rollback()
        return None, str(e)
    except Exception as e:
        if conn:
            conn.rollback()
        return None, str(e)
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

@app.route('/')
def home_or_login():
    if 'user_id' in session:
        return redirect(url_for('index'))
    return render_template('login.html')

@app.route('/index.html')
def index():
    username = session.get('username', None)
    return render_template('index.html', username=username)

@app.route('/about.html')
def about():
    return render_template('about.html')

@app.route('/products.html')
def products():
    return render_template('products.html')

@app.route('/careers.html')
def careers():
    return render_template('careers.html')

@app.route('/contact.html')
def contact():
    return render_template('contact.html')

@app.route('/apply-now.html')
def apply_now_page():
    return render_template('application_request.html')

@app.route('/api/contact', methods=['POST'])
def handle_contact_form():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    data = request.get_json()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    message = data.get('message', '').strip()
    if not all([name, email, message]):
        return jsonify({"error": "All fields (name, email, message) are required"}), 400
    if len(name) > 255 or len(email) > 255:
        return jsonify({"error": "Name and email must be less than 255 characters"}), 400
    query = "INSERT INTO contacts (name, email, message) VALUES (%s, %s, %s)"
    result, error = execute_query(query, (name, email, message))
    if error:
        return jsonify({"error": "Failed to submit contact form", "details": error}), 500
    return jsonify({"message": "Contact form submitted successfully!", "id": result}), 200

@app.route('/api/apply', methods=['POST'])
def handle_application_form():
    name = request.form.get('full_name', '').strip()
    email = request.form.get('email', '').strip()
    phone = request.form.get('phone', '').strip()
    position = request.form.get('position_applied', '').strip()
    cover_letter = request.form.get('cover_letter', '').strip()
    dob = request.form.get('dob', '').strip()
    address = request.form.get('address', '').strip()
    city = request.form.get('city', '').strip()
    pincode = request.form.get('pincode', '').strip()
    state_ut = request.form.get('state_ut', '').strip()
    required_fields = [name, email, position, dob, address, city, pincode, state_ut]
    if not all(required_fields):
        return jsonify({"error": "All required fields must be filled"}), 400
    resume_path = None
    resume_file = request.files.get('resume')
    if resume_file and resume_file.filename:
        upload_folder = 'uploads'
        os.makedirs(upload_folder, exist_ok=True)
        filename = secure_filename(resume_file.filename)
        unique_filename = f"{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}_{filename}"
        resume_path = os.path.join(upload_folder, unique_filename)
        resume_file.save(resume_path)
    query = """
    INSERT INTO applications (name, email, phone, position, cover_letter, dob, address, city, pincode, state_ut, resume_path)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    params = (name, email, phone, position, cover_letter, dob, address, city, pincode, state_ut, resume_path)
    result, error = execute_query(query, params)
    if error:
        return jsonify({"error": "Failed to submit application", "details": error}), 500
    return jsonify({"message": "Application submitted successfully!", "id": result}), 200

@app.route('/submit_quote', methods=['POST'])
def submit_quote_form():
    try:
        name = request.form.get('name', '').strip()
        phone = request.form.get('phone', '').strip()
        email = request.form.get('email', '').strip()
        city = request.form.get('city', '').strip()
        pincode = request.form.get('pincode', '').strip()
        state_ut = request.form.get('state_ut', '').strip()
        customer_type = request.form.get('customer_type', '').strip()
        customer_segment = request.form.get('customer_segment', '').strip()
        message = request.form.get('message', '').strip()
        required_fields = [name, phone, email, city, pincode, state_ut, customer_type, customer_segment]
        if not all(required_fields):
            return jsonify({"error": "Missing required fields"}), 400
        captcha_answer = request.form.get('captcha_answer')
        if captcha_answer:
            try:
                if int(captcha_answer) != 8:
                    return jsonify({"error": "Incorrect captcha answer"}), 400
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid captcha format"}), 400
        query = """
        INSERT INTO quote_requests (name, phone, email, city, pincode, state_ut, customer_type, customer_segment, message)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (name, phone, email, city, pincode, state_ut, customer_type, customer_segment, message)
        result, error = execute_query(query, params)
        if error:
            return jsonify({"error": "Failed to submit quote request", "details": error}), 500
        return jsonify({"message": "Quote request submitted successfully!", "id": result}), 200
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred", "details": str(e)}), 500

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    if not all([username, email, password]):
        return jsonify({'message': 'All fields are required.'}), 400
    if len(password) < 6:
        return jsonify({'message': 'Password must be at least 6 characters long.'}), 400
    check_query = "SELECT id FROM login WHERE username = %s OR email = %s"
    existing_user, error = execute_query(check_query, (username, email), fetch='one')
    if error:
        return jsonify({'message': 'Database error during registration.'}), 500
    if existing_user:
        return jsonify({'message': 'Username or Email already exists.'}), 409
    hashed_password = generate_password_hash(password)
    insert_query = "INSERT INTO login (username, email, password) VALUES (%s, %s, %s)"
    result, error = execute_query(insert_query, (username, email, hashed_password))
    if error:
        return jsonify({'message': 'Registration failed.', 'details': error}), 500
    return jsonify({'message': 'Registration successful!'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    if not all([username, password]):
        return jsonify({'message': 'Username and password are required.'}), 400
    query = "SELECT id, username, password FROM login WHERE username = %s"
    user, error = execute_query(query, (username,), fetch='one')
    if error:
        return jsonify({'message': 'Database error during login.'}), 500
    if user and check_password_hash(user['password'], password):
        session['user_id'] = user['id']
        session['username'] = user['username']
        update_query = "UPDATE login SET last_login = NOW() WHERE id = %s"
        execute_query(update_query, (user['id'],))
        return jsonify({'message': 'Login successful!'}), 200
    else:
        return jsonify({'message': 'Invalid username or password.'}), 401

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('home_or_login'))
    return redirect(url_for('index'))

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home_or_login'))

@app.route('/test-db')
def test_db():
    conn = get_db_connection()
    if not conn:
        return jsonify({"status": "error", "message": "Failed to connect to database"}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT 1 as test")
        test_result = cursor.fetchone()
        stats = {}
        tables = ['contacts', 'applications', 'quote_requests', 'login']
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
            result = cursor.fetchone()
            stats[table] = result['count']
        cursor.close()
        conn.close()
        return jsonify({
            "status": "success",
            "message": "Database connection successful!",
            "test_result": test_result,
            "table_statistics": stats,
            "database": DB_CONFIG['database']
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": f"Database query failed: {str(e)}"}), 500

@app.route('/admin/stats')
def admin_stats():
    if 'user_id' not in session:
        return jsonify({"error": "Authentication required"}), 401
    try:
        stats = {}
        queries = {
            'recent_contacts': "SELECT COUNT(*) as count FROM contacts WHERE submission_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
            'recent_applications': "SELECT COUNT(*) as count FROM applications WHERE submission_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
            'recent_quotes': "SELECT COUNT(*) as count FROM quote_requests WHERE submission_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
            'total_users': "SELECT COUNT(*) as count FROM login"
        }
        for key, query in queries.items():
            result, error = execute_query(query, fetch='one')
            stats[key] = result['count'] if not error else 0
        return jsonify({"status": "success", "stats": stats}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    os.makedirs('static/dist', exist_ok=True)
    os.makedirs('uploads', exist_ok=True)
    app.run(debug=True, host='127.0.0.1', port=5000)
