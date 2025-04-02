const express = require('express');
const router = express.Router();
const pool = require('../db'); // Import the pool directly // Import the pool from the main server file
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const axios = require('axios');
// Firebase Admin SDK for verifying tokens from Firebase Authentication
const firebase = require('firebase-admin');

// Initialize Firebase Admin if not already initialized elsewhere
if (!firebase.apps.length) {
  firebase.initializeApp({
    credential: firebase.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
}

// Configure mail transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Store OTPs temporarily (in production, consider using Redis)
const otpStore = new Map();

// Generate random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send email with OTP
const sendEmailOTP = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Verification Code - Flamingoes Restaurant',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9ecef; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #0a58ca;">Flamingoes Restaurant</h2>
          <p style="color: #6c757d;">Password Reset Verification</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p>Hello,</p>
          <p>We received a request to reset your password. Please use the verification code below to continue:</p>
          <div style="background-color: #e9ecef; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 15px 0; border-radius: 5px;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email or contact support if you have concerns.</p>
        </div>
        <div style="text-align: center; font-size: 12px; color: #6c757d;">
          <p>&copy; Flamingoes 2025. All Rights Reserved.</p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

// Initiate password reset flow
router.post('/forgot-password', async (req, res) => {
  const { email, phone, type } = req.body;

  try {
    if (type !== 'email' && type !== 'sms') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification type. Please use either "email" or "sms".' 
      });
    }

    // For email verification
    if (type === 'email') {
      // Check if user exists
      const userQuery = 'SELECT id FROM users WHERE email = $1';
      const userResult = await pool.query(userQuery, [email]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'No account found with this email address' 
        });
      }

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

      // Store OTP with timestamp
      otpStore.set(email, {
        otp,
        expiresAt,
        attempts: 0
      });

      // Send OTP via email
      await sendEmailOTP(email, otp);

      // Return success with OTP for development environments only
      if (process.env.NODE_ENV === 'development') {
        return res.json({ 
          success: true, 
          message: 'Verification code sent to your email',
          otp: otp // Only include in development
        });
      }

      return res.json({ 
        success: true, 
        message: 'Verification code sent to your email' 
      });
    }
    
    // For SMS verification - Just generate a verification session ID
    // The actual SMS is sent by Firebase on the client-side
    if (type === 'sms') {
      // Check if user exists with this phone number
      const userQuery = 'SELECT id FROM users WHERE phone = $1';
      const userResult = await pool.query(userQuery, [phone]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'No account found with this phone number' 
        });
      }

      // For SMS we don't send the message ourselves - Firebase handles it
      // We just return a success so the client can proceed with Firebase phone auth
      res.json({ 
        success: true, 
        message: 'Please proceed with phone verification',
        verificationMode: 'firebase'
      });
    }
  } catch (error) {
    console.error('FORGOT PASSWORD ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process your request. Please try again later.' 
    });
  }
});

// Resend OTP (email only - Firebase handles SMS resend)
router.post('/resend-otp', async (req, res) => {
  const { email, type } = req.body;

  try {
    if (type !== 'email') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only email type is supported through this endpoint. For SMS, use Firebase directly.' 
      });
    }

    // Check if user exists
    const userQuery = 'SELECT id FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No account found with this email address' 
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

    // Store new OTP
    otpStore.set(email, {
      otp,
      expiresAt,
      attempts: 0
    });

    // Send OTP via email
    await sendEmailOTP(email, otp);

    // Return success with OTP for development environments only
    if (process.env.NODE_ENV === 'development') {
      return res.json({ 
        success: true, 
        message: 'Verification code resent to your email',
        otp: otp // Only include in development
      });
    }

    res.json({ 
      success: true, 
      message: 'Verification code resent to your email' 
    });
  } catch (error) {
    console.error('RESEND OTP ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to resend verification code. Please try again later.' 
    });
  }
});

// Verify OTP (for email verification)
router.post('/verify-otp', async (req, res) => {
  const { email, otp, type } = req.body;

  try {
    if (type !== 'email') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only email type is supported through this endpoint' 
      });
    }

    // Check if OTP exists for this email
    if (!otpStore.has(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'No verification code found. Please request a new one.' 
      });
    }

    const otpData = otpStore.get(email);

    // Check if OTP has expired
    if (new Date() > otpData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ 
        success: false, 
        message: 'Verification code has expired. Please request a new one.' 
      });
    }

    // Check if max attempts reached
    if (otpData.attempts >= 5) {
      otpStore.delete(email);
      return res.status(400).json({ 
        success: false, 
        message: 'Too many invalid attempts. Please request a new verification code.' 
      });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      // Increment attempts counter
      otpData.attempts += 1;
      otpStore.set(email, otpData);
      
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code. Please try again.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Store token in database with expiry of 10 minutes
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 10);
    
    const updateQuery = `
      UPDATE users 
      SET reset_token = $1, reset_token_expires = $2 
      WHERE email = $3
      RETURNING id
    `;
    await pool.query(updateQuery, [tokenHash, expiryTime, email]);

    // Remove OTP from store once verified
    otpStore.delete(email);

    res.json({ 
      success: true, 
      message: 'Verification successful!', 
      resetToken 
    });
  } catch (error) {
    console.error('VERIFY OTP ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify code. Please try again later.' 
    });
  }
});

// Handle phone verification with Firebase
router.post('/verify-phone-auth', async (req, res) => {
  const { phone, firebaseToken } = req.body;

  try {
    // Verify Firebase token using Firebase Admin SDK
    const decodedToken = await firebase.auth().verifyIdToken(firebaseToken);
    
    // Ensure the phone number in the token matches the one in the request
    if (!decodedToken.phone_number || decodedToken.phone_number !== phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number verification failed'
      });
    }
    
    // Check if user exists with this phone number
    const userQuery = 'SELECT id FROM users WHERE phone = $1';
    const userResult = await pool.query(userQuery, [phone]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No account found with this phone number' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Store token in database with expiry of 10 minutes
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 10);
    
    const updateQuery = `
      UPDATE users 
      SET reset_token = $1, reset_token_expires = $2 
      WHERE phone = $3
      RETURNING id
    `;
    await pool.query(updateQuery, [tokenHash, expiryTime, phone]);

    res.json({ 
      success: true, 
      message: 'Phone verification successful!', 
      resetToken 
    });
  } catch (error) {
    console.error('PHONE VERIFICATION ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify phone. Please try again later.' 
    });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    // Hash the token from the request
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Check if token exists and is not expired
    const tokenQuery = `
      SELECT id, email, phone 
      FROM users 
      WHERE reset_token = $1 AND reset_token_expires > NOW()
    `;
    const tokenResult = await pool.query(tokenQuery, [tokenHash]);

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset link. Please try again.' 
      });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update user's password and clear reset token
    const updateQuery = `
      UPDATE users 
      SET password = $1, reset_token = NULL, reset_token_expires = NULL 
      WHERE id = $2
    `;
    await pool.query(updateQuery, [hashedPassword, tokenResult.rows[0].id]);

    // If user has email, send password change notification
    if (tokenResult.rows[0].email) {
      const notificationEmail = {
        from: process.env.EMAIL_USER,
        to: tokenResult.rows[0].email,
        subject: 'Your Password Has Been Reset - Flamingoes Restaurant',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9ecef; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #0a58ca;">Flamingoes Restaurant</h2>
              <p style="color: #6c757d;">Security Notification</p>
            </div>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <p>Hello,</p>
              <p>This is a confirmation that your password for your Flamingoes Restaurant account has been changed successfully.</p>
              <p>If you did not make this change, please contact our support team immediately.</p>
            </div>
            <div style="text-align: center; font-size: 12px; color: #6c757d;">
              <p>&copy; Flamingoes 2025. All Rights Reserved.</p>
            </div>
          </div>
        `
      };

      transporter.sendMail(notificationEmail).catch(err => 
        console.error('Failed to send password change notification email:', err)
      );
    }

    res.json({ 
      success: true, 
      message: 'Password reset successfully!' 
    });
  } catch (error) {
    console.error('PASSWORD RESET ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reset password. Please try again later.' 
    });
  }
});

module.exports = router;