const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "ds0005217@gmail.com",
        pass: "gtow qrem zahw nxvl"  // Gmail App Password
    }
});

// OTP store (simple in-memory, production → DB)
const otpStore = {};

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
}

// Send OTP endpoint
app.post("/send-otp", (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).send({ error: "Email required" });

    const otp = generateOTP();
    otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 }; // 5 min expiry

    const mailOptions = {
        from: "ds0005217@gmail.com",
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP is: ${otp} (valid for 5 minutes)`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) return res.status(500).send({ error: "Email send failed" });
        res.send({ message: "OTP sent successfully" });
    });
});

// Verify OTP endpoint
app.post("/verify-otp", (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).send({ error: "Email & OTP required" });

    const record = otpStore[email];
    if (!record) return res.status(400).send({ error: "No OTP sent to this email" });
    if (record.expires < Date.now()) return res.status(400).send({ error: "OTP expired" });
    if (record.otp != otp) return res.status(400).send({ error: "Invalid OTP" });

    delete otpStore[email]; // OTP used
    res.send({ message: "OTP verified successfully" });
});

app.listen(3000, () => console.log("Server running on port 3000"));

