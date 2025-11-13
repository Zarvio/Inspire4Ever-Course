from flask import Flask, request, jsonify, send_from_directory
from instagrapi import Client
import os

app = Flask(__name__, static_folder='.', static_url_path='')

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/api/login', methods=['POST'])
def login_user():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON received'}), 400

        username = data.get('username')
        password = data.get('password')
        target_user = data.get('target')

        if not username or not password:
            return jsonify({'error': 'Missing username or password'}), 400

        print(f"📩 Received login request for: {username}")

        cl = Client()

        # Optional device settings (helpful for login)
        cl.set_device({
            "app_version": "289.0.0.20.75",
            "android_version": "28",
            "android_release": "9.0",
            "dpi": "420dpi",
            "resolution": "1080x1920",
            "manufacturer": "OnePlus",
            "device": "ONEPLUS A6000",
            "model": "ONEPLUS A6000",
            "cpu": "qcom",
            "version_code": "289000020"
        })

        cl.login(username, password)
        print("✅ Login successful")

        if target_user:
            target_id = cl.user_id_from_username(target_user)
            cl.user_follow(target_id)
            print(f"🤝 Followed {target_user}")
            return jsonify({
                'ok': True,
                'message': f'Login successful for {username}. Followed {target_user}!'
            })

        return jsonify({'ok': True, 'message': f'Login successful for {username}! No follow target.'})

    except Exception as e:
        print("❌ Error occurred:", str(e))
        return jsonify({'error': f'Login failed: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(debug=True)
