from flask import Flask, request, jsonify
from flask_cors import CORS
from email.message import EmailMessage
import smtplib
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables (from this file's directory)
load_dotenv(dotenv_path=Path(__file__).with_name('.env'))

app = Flask(__name__)
ALLOWED_ORIGINS = [
    "https://infinityinfra.netlify.app",
    "http://127.0.0.1:8081",
    "http://localhost:8081",
]

CORS(
    app,
    resources={r"/api/*": {"origins": ALLOWED_ORIGINS}},
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
OWNER_EMAIL = os.getenv("OWNER_EMAIL")
DISABLE_EMAIL = os.getenv("DISABLE_EMAIL", "0") == "1"


def send_owner_email(name, email, subject, message):
    msg = EmailMessage()
    msg["From"] = EMAIL_USER
    msg["To"] = OWNER_EMAIL
    msg["Subject"] = f"New Contact Form: {subject}"
    msg.set_content(
        f"Name: {name}\n"
        f"Email: {email}\n"
        f"Subject: {subject}\n\n"
        f"Message:\n{message}"
    )

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(EMAIL_USER, EMAIL_PASS)
        server.send_message(msg)


def send_user_autoreply(name, email):
    msg = EmailMessage()
    msg["From"] = EMAIL_USER
    msg["To"] = email
    msg["Subject"] = "We received your message – Infinity Infrastructure"
    msg.set_content(
        f"Hi {name},\n\n"
        "Thank you for contacting Infinity Infrastructure.\n"
        "We have received your message and will get back to you within 24 hours.\n\n"
        "Regards,\nInfinity Infrastructure Team"
    )

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(EMAIL_USER, EMAIL_PASS)
        server.send_message(msg)


@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "status": "ok",
        "service": "Infinity Infrastructure API",
        "endpoints": {
            "health": "/health",
            "contact": "/api/contact (POST)"
        }
    }), 200


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


@app.route("/api/contact", methods=["GET", "POST", "OPTIONS"])
def contact():
    if request.method == "GET":
        return jsonify({
            "success": False,
            "message": "Use POST /api/contact with JSON: {name, email, subject, message}"
        }), 200

    data = request.get_json()

    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    subject = data.get("subject", "").strip()
    message = data.get("message", "").strip()

    if not name or not email or not message:
        return jsonify({"success": False, "message": "All fields required"}), 400

    if DISABLE_EMAIL:
        return jsonify({
            "success": True,
            "message": "Message received (email sending disabled)"
        }), 200

    try:
        send_owner_email(name, email, subject, message)
        send_user_autoreply(name, email)

        return jsonify({
            "success": True,
            "message": "Message sent successfully"
        }), 200

    except Exception as e:
        print("Email error:", e)
        return jsonify({
            "success": False,
            "message": "Failed to send message"
        }), 500


if __name__ == "__main__":
    app.run(debug=True)
