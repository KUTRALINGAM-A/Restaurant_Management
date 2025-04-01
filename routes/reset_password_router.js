const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db"); // PostgreSQL connection
require("dotenv").config();
const router = express.Router();
// Add this to the top with other imports - needed for Firebase authentication
const admin = require("firebase-admin");
// Initialize Firebase Admin if not already done
// You'll need to download your service account JSON from Firebase console
// IMPORTANT: In production, don't hardcode this path. Use environment variables.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      "type": "service_account",
  "project_id": "flamingoes-restaurant-manager",
  "private_key_id": "7d9577ef8c99738500ba618dd6039c4dd039a566",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC/Z6Aays8dKmfk\nEhd2it/rn1lsu57px3cuaEIjDuYmnhYZjj8VeVYy+OGI+K4RyqERokExxLn6wvW9\neaIaCLx6TWGWbbIu+tVLzSlJzBSVIyG88mkpdS1J5PJnpl2QRAOAxwTIIYoQtQ/u\n0f1KVkKt0lOeLxoz2RerPW036meIvKUeN7cgDLQfJ4Vo/HP/l81YAkMoXnGzHVOa\nzbaFHl51qoL/3YJkVFocXSoCURSvbJJVNZKbIiSemjcD6o8XF2cTzPFiuiKHh4gg\niQWuvFQmgAYiNHhXwrKHeGh/rfFbtmjyEYXF7Cr7isCWFMFSozIXR40noMX6E+16\niVPXObEBAgMBAAECggEAAzIEyCQfoT7rShe+0+6AmEuD1ivE40xxrtD0KoERElvF\n4BPx9XbqzshwSqjM9L4U9bLncyAm8xepiGONJosdZM6BTqrl9FPUSlySXMmIt6He\nnWvPzQhIQvlAAYv5xUx++uAXsj5t5bzoF0mvkiI7h1eODtBLF/3lUvYGqnRocxQ2\nJM3WIRvfkDJTLvrewrcpqD2vyfp9rjLCsB+VxorMEdhmu7UoTW+Phwb+WyQoMtFm\nOu3Ilgh5SFADhE1oX0OG2gvzERdCxj3aZDhyw4k1oDUwkpL7M4GrtMLtjJd/rjJw\n4yMJO+LUyDsDK3NNsJB7qUOgE9GJkVCy/GIVDZW5GQKBgQDvVvSM/4PQR+L4hpVW\nym7xSZ0kDE9YrDZ5L5lfk7Ll49TU2ON+Y0CdkJNwsH/gX0QMqJ8VmzL9V47gjBIT\nXrJ6qOQSMFMAytfQAGYnGampN7Y23WI08xb0+LIR67GrjahyMcqVzocELTIn3eFd\nhj5i+yHEj4ZwWJVcaJEcXnTLtQKBgQDMunfZfHc7GZTDnJfj0K6iNwcHvjCjFDqr\nOnLoH2dZoJUVMinE4JvmPpeh19DYFUnybCtYJMW8I+aqdsl3s9TzWYZEwlegfBPV\nH0Lbxzi438NVO20SWnnOQattgPOTNQxsWxMGBpa3aoHS/WVD9gCQpidLcz9IlfGF\nm/TWwE2XnQKBgQCxEd4fqrJ0l5qeT8OQ0He/37x4fPr/GXm7srF/+p/yYNqHFmdI\njFmzuNC8IHibISARVXdM3uOcdvjnu/lrhzX4dZc2tbXS8j80TfdFmkDhRqxybttH\nXUlwt8XWaE+sIkOrKJc+ues99coToJ4pOTZSuIVFDQJjf8YQ9fPVzzQNuQKBgQC6\nrcFBKFRUKJRU9gIuMog61DBt6AfTfEuu/MHwVUpZGKs4Q6CArEqb3TFI21DM6ESg\nb+/qFMXVM2tOvrgglXM1XsmnAwsCBIHVEQdW/kcDlM45dtGTLbrpz0mwtSflcDbe\nywECuplNsCmnKXXgTX3gaBFmpDTtTASKT1YnR/y4pQKBgQCjQGbIDHx4pBUY2Fba\nJ/3kFeY1KhtkJDfhMLCHGKT/CLQF+pt7XZ75Bvofb8vYIAc1luLQSxlc5XlSbOzm\nk9l0UxEWH6DEeGpKwBJgLnOcaY6nXACxQFn5pLT2gJLerSFKArjJbtTkq5kRDUC+\nCx4Db29R1QeVIJgbChWZVv+C9Q==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@flamingoes-restaurant-manager.iam.gserviceaccount.com",
  "client_id": "104478366544568280488",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40flamingoes-restaurant-manager.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
    })
  });
}

// Forgot Password - Send OTP (Email or Mobile)
router.post("/forgot-password", async (req, res) => {
    try {
        const { contactInfo, contactType } = req.body;
        
        // Check if user exists
        const user = await pool.query(
            "SELECT * FROM users WHERE " + (contactType === "email" ? "email = $1" : "phone = $1"),
            [contactInfo]
        );
        if (user.rows.length === 0) {
            return res.status(404).json({ 
                message: `No account found with this ${contactType === "email" ? "email address" : "phone number"}` 
            });
        }
        
        // Only continue with OTP generation for email - mobile will use Firebase
        if (contactType === "email") {
            // Generate a 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            
            // OTP expiration time (15 minutes from now)
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 15);
            
            // Store OTP in database (create reset_tokens table if not exists)
            await pool.query(`
                CREATE TABLE IF NOT EXISTS reset_tokens (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    token VARCHAR(255) NOT NULL,
                    otp VARCHAR(6),
                    type VARCHAR(10) NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    used BOOLEAN DEFAULT FALSE
                )
            `);
            
            // Generate a JWT token for security
            const resetToken = jwt.sign(
                { userId: user.rows[0].id, type: contactType },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );
            
            // Delete any existing tokens for this user
            await pool.query(
                "DELETE FROM reset_tokens WHERE user_id = $1",
                [user.rows[0].id]
            );
            
            // Insert new token
            await pool.query(
                "INSERT INTO reset_tokens (user_id, token, otp, type, expires_at) VALUES ($1, $2, $3, $4, $5)",
                [user.rows[0].id, resetToken, otp, contactType, expiresAt]
            );
            
            // TODO: In production, send email with OTP
            // For now, just return it for development purposes
            console.log(`Password reset OTP for ${contactInfo}: ${otp}`);
            
            return res.status(200).json({
                message: "Verification code sent to your email address",
                otp: process.env.NODE_ENV === 'development' ? otp : undefined,
                success: true
            });
        } else {
            // For mobile, we'll use Firebase authentication
            // The actual SMS sending is handled by Firebase on the frontend
            return res.status(200).json({
                message: "Please proceed with mobile verification",
                success: true
            });
        }
    } catch (error) {
        console.error("FORGOT PASSWORD ERROR:", error);
        return res.status(500).json({ message: "Server error. Please try again later." });
    }
});

// Resend OTP
router.post("/resend-otp", async (req, res) => {
    try {
        const { contactInfo, contactType } = req.body;
        
        // Check if user exists
        const user = await pool.query(
            "SELECT * FROM users WHERE " + (contactType === "email" ? "email = $1" : "phone = $1"),
            [contactInfo]
        );
        
        if (user.rows.length === 0) {
            return res.status(404).json({ 
                message: `No account found with this ${contactType === "email" ? "email address" : "phone number"}`
            });
        }
        
        // Only handle email OTP resending - mobile is handled by Firebase on frontend
        if (contactType === "email") {
            // Generate a new 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            
            // OTP expiration time (15 minutes from now)
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 15);
            
            // Generate a new JWT token
            const resetToken = jwt.sign(
                { userId: user.rows[0].id, type: contactType },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );
            
            // Update existing token or create new one
            const existingToken = await pool.query(
                "SELECT * FROM reset_tokens WHERE user_id = $1 AND used = FALSE",
                [user.rows[0].id]
            );
            
            if (existingToken.rows.length > 0) {
                // Update existing token
                await pool.query(
                    "UPDATE reset_tokens SET otp = $1, token = $2, expires_at = $3 WHERE user_id = $4 AND used = FALSE",
                    [otp, resetToken, expiresAt, user.rows[0].id]
                );
            } else {
                // Insert new token
                await pool.query(
                    "INSERT INTO reset_tokens (user_id, token, otp, type, expires_at) VALUES ($1, $2, $3, $4, $5)",
                    [user.rows[0].id, resetToken, otp, contactType, expiresAt]
                );
            }
            
            // TODO: In production, send email with OTP
            // For now, just return it for development purposes
            console.log(`Password reset OTP resent for ${contactInfo}: ${otp}`);
            
            return res.status(200).json({
                message: "Verification code resent to your email address",
                otp: process.env.NODE_ENV === 'development' ? otp : undefined,
                success: true
            });
        } else {
            // For mobile, resending is handled by Firebase on the frontend
            return res.status(200).json({
                message: "Please proceed with mobile verification",
                success: true
            });
        }
    } catch (error) {
        console.error("RESEND OTP ERROR:", error);
        return res.status(500).json({ message: "Server error. Please try again later." });
    }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
    try {
        const { contactInfo, contactType, otp } = req.body;
        
        // Verify email OTP
        if (contactType === "email") {
            // Get user
            const user = await pool.query(
                "SELECT * FROM users WHERE email = $1",
                [contactInfo]
            );
            
            if (user.rows.length === 0) {
                return res.status(404).json({ message: "User not found" });
            }
            
            // Get token
            const tokenRecord = await pool.query(
                "SELECT * FROM reset_tokens WHERE user_id = $1 AND used = FALSE AND type = $2",
                [user.rows[0].id, contactType]
            );
            
            if (tokenRecord.rows.length === 0) {
                return res.status(400).json({ message: "Invalid or expired verification code" });
            }
            
            const storedOtp = tokenRecord.rows[0].otp;
            const expiresAt = new Date(tokenRecord.rows[0].expires_at);
            
            // Check if OTP is expired
            if (expiresAt < new Date()) {
                return res.status(400).json({ message: "Verification code has expired" });
            }
            
            // Check if OTP matches
            if (otp !== storedOtp) {
                return res.status(400).json({ message: "Invalid verification code" });
            }
            
            // Generate a new token for password reset
            const resetToken = jwt.sign(
                { userId: user.rows[0].id, type: contactType },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );
            
            return res.status(200).json({
                message: "Verification successful",
                resetToken,
                success: true
            });
        } else {
            // For mobile OTP, verification is handled in separate endpoint
            return res.status(400).json({ 
                message: "Invalid request. Mobile verification should use Firebase authentication." 
            });
        }
    } catch (error) {
        console.error("VERIFY OTP ERROR:", error);
        return res.status(500).json({ message: "Server error. Please try again later." });
    }
});

// Verify Firebase phone authentication
router.post("/verify-phone-auth", async (req, res) => {
    try {
        const { phone, firebaseToken } = req.body;
        
        // Verify Firebase token
        const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
        
        if (!decodedToken) {
            return res.status(401).json({ message: "Invalid authentication" });
        }
        
        // Get user from database
        const user = await pool.query(
            "SELECT * FROM users WHERE phone = $1",
            [phone]
        );
        
        if (user.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Generate a JWT token for password reset
        const resetToken = jwt.sign(
            { userId: user.rows[0].id, type: "mobile" },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );
        
        // Store token in database
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        
        await pool.query(
            "INSERT INTO reset_tokens (user_id, token, type, expires_at) VALUES ($1, $2, $3, $4)",
            [user.rows[0].id, resetToken, "mobile", expiresAt]
        );
        
        return res.status(200).json({
            message: "Mobile verification successful",
            resetToken,
            success: true
        });
    } catch (error) {
        console.error("VERIFY PHONE AUTH ERROR:", error);
        return res.status(500).json({ message: "Invalid authentication or server error" });
    }
});

// Reset password
router.post("/reset-password", async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;
        
        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).json({ message: "Invalid or expired reset token" });
        }
        
        // Check if token exists in database
        const tokenRecord = await pool.query(
            "SELECT * FROM reset_tokens WHERE token = $1 AND used = FALSE",
            [resetToken]
        );
        
        if (tokenRecord.rows.length === 0) {
            return res.status(401).json({ message: "Invalid or expired reset token" });
        }
        
        // Check token expiration
        const expiresAt = new Date(tokenRecord.rows[0].expires_at);
        if (expiresAt < new Date()) {
            return res.status(401).json({ message: "Reset token has expired" });
        }
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update user password
        await pool.query(
            "UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
            [hashedPassword, decoded.userId]
        );
        
        // Mark token as used
        await pool.query(
            "UPDATE reset_tokens SET used = TRUE WHERE token = $1",
            [resetToken]
        );
        
        return res.status(200).json({
            message: "Password has been reset successfully",
            success: true
        });
    } catch (error) {
        console.error("RESET PASSWORD ERROR:", error);
        return res.status(500).json({ message: "Server error. Please try again later." });
    }
});

module.exports = router;