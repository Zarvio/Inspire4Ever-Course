from flask import Flask, request, jsonify, render_template
from openai import OpenAI
from flask_cors import CORS

app = Flask(__name__, template_folder='.')
CORS(app)

client = OpenAI(api_key="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")  # ← अपनी API key डालो

@app.route("/")
def index():
    return render_template("index.html")  # serve HTML

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_msg = data.get("message", "").strip().lower()

    # List of custom trigger phrases
    trigger_phrases = [
        "tumko kisne bnaya",
        "aapke nirmata kon hai",
        "aapka malik kon hai",
        "aapko kisne viksit kiya",
        "tumhara creator kaun hai",
        "aapka developer kaun hai",
        "who created you",
        "who is your creator",
        "who made you",
        "who developed you",
        "who owns you"
    ]

    # Check if user message contains any trigger phrase
    if any(phrase in user_msg for phrase in trigger_phrases):
        return jsonify({
            "reply": "Main ek AI model hoon jo Inspire4Ever dwara vikasit kiya gaya hai. "
                     "Mera uddeshya aapki madad karna aur prashnon ke uttar dena hai. "
                     "Aapko kis vishay mein madad chahiye?"
        })

    # Normal ChatGPT API call
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a friendly assistant."},
            {"role": "user", "content": user_msg},
        ],
        max_tokens=300,
    )

    reply = completion.choices[0].message.content
    return jsonify({"reply": reply})



if __name__ == "__main__":
    app.run(port=5000, debug=True)
