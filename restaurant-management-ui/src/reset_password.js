import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios"; // Make sure to install axios

// Keep Firebase only for phone verification if needed
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAqOc-hIf6RX2XSSCchEauZ0T6SvVz10pk",
  authDomain: "flamingoes-restaurant-manager.firebaseapp.com",
  projectId: "flamingoes-restaurant-manager",
  storageBucket: "flamingoes-restaurant-manager.firebasestorage.app",
  messagingSenderId: "60186990296",
  appId: "1:60186990296:web:4b1b3b9f8825ded61e29ad",
  measurementId: "G-R01VTB0S8G"
};

// Initialize Firebase (only needed for recaptcha)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// API base URL - replace with your actual backend URL
const API_BASE_URL = "http://localhost:5000"; // Adjust to your backend URL

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Step 1: Enter email/mobile, Step 2: Enter OTP, Step 3: New password
  const [contactInfo, setContactInfo] = useState("");
  const [contactType, setContactType] = useState("email"); // 'email' or 'mobile'
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [timer, setTimer] = useState(0);
  const [resetToken, setResetToken] = useState("");
  const [verificationId, setVerificationId] = useState("");

  // Simulated animation effect
  useEffect(() => {
    const animTimer = setTimeout(() => {
      const container = document.getElementById("forgot-password-container");
      if (container) {
        container.style.opacity = "1";
        container.style.transform = "translateY(0)";
      }
    }, 100);
    return () => clearTimeout(animTimer);
  }, []);

  // Set up recaptcha verifier for phone authentication
  useEffect(() => {
    if (contactType === "mobile" && step === 1) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved, allow sending verification code
        }
      });
    }
  }, [contactType, step]);

  // OTP countdown timer
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleContactTypeChange = (type) => {
    setContactType(type);
    setContactInfo("");
    setMessage("");
  };

  const validateContactInfo = () => {
    if (contactType === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(contactInfo);
    } else {
      // Basic validation for mobile (can be enhanced based on country format)
      const mobileRegex = /^\+[0-9]{10,15}$/;
      return mobileRegex.test(contactInfo);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    if (!validateContactInfo()) {
      setMessage(`Please enter a valid ${contactType === "email" ? "email address" : "mobile number with country code (e.g. +1234567890)"}`);
      setIsLoading(false);
      return;
    }

    try {
      if (contactType === "email") {
        // Use your custom backend endpoint for email OTP
        const response = await axios.post(`${API_BASE_URL}/forgot-password`, {
          contactInfo: contactInfo,
          contactType: contactType
        });
        
        setMessage(response.data.message);
        
        // For development testing only - remove in production
        if (response.data.otp) {
          console.log("OTP for testing:", response.data.otp);
          // You can show this on screen during development
          setMessage(`Verification code sent to your email. For testing, OTP is: ${response.data.otp}`);
        }
        
        // Move to next step and start timer
        setStep(2);
        setTimer(120); // 2 minutes countdown
      } else {
        // Use Firebase for phone authentication
        const phoneNumber = contactInfo; // Make sure this is in international format (e.g. +1234567890)
        const appVerifier = window.recaptchaVerifier;
        
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        window.confirmationResult = confirmationResult;
        
        setMessage("Verification code sent to your mobile number");
        setStep(2);
        setTimer(120); // 2 minutes countdown
      }
    } catch (error) {
      console.error("SEND OTP ERROR:", error);
      setMessage(error.response?.data?.message || error.message || "Failed to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      if (contactType === "email") {
        // Use your custom backend endpoint to resend OTP
        const response = await axios.post(`${API_BASE_URL}/resend-otp`, {
          contactInfo: contactInfo,
          contactType: contactType
        });

        setMessage(response.data.message);
        
        // For development testing only - remove in production
        if (response.data.otp) {
          console.log("OTP for testing:", response.data.otp);
          // You can show this on screen during development
          setMessage(`Verification code resent to your email. For testing, OTP is: ${response.data.otp}`);
        }
      } else {
        // Use Firebase for phone authentication resend
        // First, reset the recaptcha
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible'
        });
        
        // Send the verification code again
        const appVerifier = window.recaptchaVerifier;
        const confirmationResult = await signInWithPhoneNumber(auth, contactInfo, appVerifier);
        window.confirmationResult = confirmationResult;
        
        setMessage("Verification code resent to your mobile number");
      }
      
      setTimer(120); // Reset timer
    } catch (error) {
      console.error("RESEND OTP ERROR:", error);
      setMessage(error.response?.data?.message || error.message || "Failed to resend verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      if (contactType === "email") {
        // Use your custom backend endpoint to verify email OTP
        const response = await axios.post(`${API_BASE_URL}/verify-otp`, {
          contactInfo: contactInfo,
          contactType: contactType,
          otp: otp
        });

        setMessage("Verification successful!");
        setResetToken(response.data.resetToken);
        setStep(3);
      } else {
        // Verify Firebase phone OTP
        const confirmationResult = window.confirmationResult;
        const result = await confirmationResult.confirm(otp);
        
        // User is signed in with phone. You can use this to verify on backend
        const user = result.user;
        const idToken = await user.getIdToken();
        
        // Now send this token to your backend for validation
        const response = await axios.post(`${API_BASE_URL}/verify-phone-auth`, {
          verificationId: verificationId,
          code: otp,
          phone: contactInfo,
          firebaseToken: idToken
        });

        setMessage("Verification successful!");
        setResetToken(response.data.resetToken);
        setStep(3);
      }
    } catch (error) {
      console.error("OTP VERIFICATION ERROR:", error);
      setMessage(error.response?.data?.message || error.message || "Invalid verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      // Use your custom backend endpoint to reset password
      const response = await axios.post(`${API_BASE_URL}/reset-password`, {
        resetToken: resetToken,
        newPassword: newPassword
      });

      setMessage("Password reset successfully! Redirecting to login...");
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("PASSWORD RESET ERROR:", error);
      setMessage(error.response?.data?.message || error.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Rest of your component remains the same...
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
          width: "100%",
          maxWidth: "420px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Hidden reCAPTCHA container */}
        <div id="recaptcha-container"></div>
        
        {/* Header section */}
        <div style={{
          padding: "30px 35px",
          textAlign: "center",
          background: "#ffffff",
          position: "relative",
          borderBottom: "1px solid #e9ecef",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "12px",
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #0a58ca 0%, #0d6efd 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "18px",
              fontWeight: "bold",
              boxShadow: "0 4px 6px rgba(10, 88, 202, 0.2)",
              marginRight: "12px",
            }}>
              R
            </div>
            <h1 style={{ 
              margin: "0",
              fontSize: "24px",
              fontWeight: "600",
              color: "#212529",
              letterSpacing: "0.5px",
            }}>
              Forgot Password
            </h1>
          </div>
          <p style={{
            fontSize: "15px",
            color: "#6c757d",
            maxWidth: "320px",
            margin: "0 auto",
          }}>
            {step === 1 && "Reset your password with email or mobile verification"}
            {step === 2 && "Enter the verification code sent to you"}
            {step === 3 && "Create your new password"}
          </p>
        </div>

        {/* Content section with animation */}
        <div 
          id="forgot-password-container" 
          style={{ 
            padding: "30px 35px",
            opacity: "0",
            transform: "translateY(20px)",
            transition: "all 0.6s ease",
          }}
        >
          {/* Step 1: Enter Email/Mobile */}
          {step === 1 && (
            <form onSubmit={handleSendOTP}>
              <div style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "20px",
                borderRadius: "10px",
                border: "1px solid #e9ecef",
                overflow: "hidden",
              }}>
                <button
                  type="button"
                  onClick={() => handleContactTypeChange("email")}
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: "none",
                    background: contactType === "email" ? "#0a58ca" : "#f8f9fa",
                    color: contactType === "email" ? "white" : "#6c757d",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => handleContactTypeChange("mobile")}
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: "none",
                    background: contactType === "mobile" ? "#0a58ca" : "#f8f9fa",
                    color: contactType === "mobile" ? "white" : "#6c757d",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                >
                  Mobile
                </button>
              </div>

              <div style={{
                marginBottom: "25px",
              }}>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#343a40",
                }}>
                  {contactType === "email" ? "Email Address" : "Mobile Number"}
                </label>
                <div style={{
                  position: "relative",
                }}>
                  <input
                    type={contactType === "email" ? "email" : "tel"}
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder={contactType === "email" ? "Enter your email" : "Enter your mobile number with country code"}
                    required
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      fontSize: "15px",
                      borderRadius: "10px",
                      border: "1px solid #ced4da",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s ease",
                      backgroundColor: "#ffffff",
                    }}
                  />
                  <div style={{
                    position: "absolute",
                    top: "50%",
                    right: "16px",
                    transform: "translateY(-50%)",
                    color: "#6c757d",
                    fontSize: "16px",
                  }}>
                    {contactType === "email" ? "✉️" : "📱"}
                  </div>
                </div>
                {contactType === "mobile" && (
                  <small style={{
                    display: "block",
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "#6c757d",
                  }}>
                    Include country code (e.g., +1 for US, +44 for UK)
                  </small>
                )}
              </div>

              {message && (
                <div style={{
                  padding: "12px 15px",
                  marginBottom: "20px",
                  borderRadius: "8px",
                  backgroundColor: message.includes("success") || message.includes("sent") ? "#d4edda" : "#f8d7da",
                  color: message.includes("success") || message.includes("sent") ? "#155724" : "#721c24",
                  fontSize: "14px",
                  fontWeight: "500",
                }}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "15px",
                  backgroundColor: isLoading ? "#6c757d" : "#0a58ca",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "500",
                  fontSize: "16px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s ease",
                  boxShadow: "0 4px 6px rgba(10, 88, 202, 0.2)",
                  marginBottom: "20px",
                }}
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Verification Code"}
              </button>
            </form>
          )}

          {/* Step 2: Enter OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP}>
              <div style={{
                marginBottom: "10px",
                textAlign: "center",
              }}>
                <div style={{
                  backgroundColor: "#e9ecef",
                  borderRadius: "8px",
                  padding: "12px 15px",
                  marginBottom: "20px",
                }}>
                  <p style={{
                    margin: "0",
                    fontSize: "14px",
                    color: "#495057",
                  }}>
                    {contactType === "email" 
                      ? "We've sent a verification code to your email. Please check your inbox and enter the code below."
                      : "We've sent a verification code to your phone number."
                    }
                    <br />
                    <strong>
                      {contactType === "email" 
                        ? contactInfo 
                        : contactInfo.substring(0, 3) + "****" + contactInfo.substring(contactInfo.length - 3)}
                    </strong>
                  </p>
                </div>
              </div>

              <div style={{
                marginBottom: "25px",
              }}>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#343a40",
                }}>
                  Verification Code
                </label>
                <div style={{
                  position: "relative",
                }}>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter verification code"
                    required
                    maxLength="6"
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      fontSize: "15px",
                      borderRadius: "10px",
                      border: "1px solid #ced4da",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s ease",
                      backgroundColor: "#ffffff",
                      letterSpacing: "0.5em",
                      textAlign: "center",
                    }}
                  />
                </div>
              </div>

              <div style={{
                textAlign: "center",
                marginBottom: "20px",
              }}>
                {timer > 0 ? (
                  <p style={{ fontSize: "14px", color: "#6c757d" }}>
                    Resend code in {formatTime(timer)}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#0a58ca",
                      fontSize: "14px",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      fontWeight: "500",
                      textDecoration: "underline",
                    }}
                  >
                    Resend verification code
                  </button>
                )}
              </div>

              {message && (
                <div style={{
                  padding: "12px 15px",
                  marginBottom: "20px",
                  borderRadius: "8px",
                  backgroundColor: message.includes("success") ? "#d4edda" : "#f8d7da",
                  color: message.includes("success") ? "#155724" : "#721c24",
                  fontSize: "14px",
                  fontWeight: "500",
                }}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "15px",
                  backgroundColor: isLoading ? "#6c757d" : "#0a58ca",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "500",
                  fontSize: "16px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s ease",
                  boxShadow: "0 4px 6px rgba(10, 88, 202, 0.2)",
                  marginBottom: "10px",
                }}
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </button>
            </form>
          )}

          {/* Step 3: Create New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <div style={{
                marginBottom: "20px",
              }}>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#343a40",
                }}>
                  New Password
                </label>
                <div style={{
                  position: "relative",
                }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength="8"
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      fontSize: "15px",
                      borderRadius: "10px",
                      border: "1px solid #ced4da",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s ease",
                      backgroundColor: "#ffffff",
                    }}
                  />
                  <div 
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: "16px",
                      transform: "translateY(-50%)",
                      color: "#6c757d",
                      fontSize: "16px",
                      cursor: "pointer",
                    }}
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </div>
                </div>
              </div>

              <div style={{
                marginBottom: "25px",
              }}>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#343a40",
                }}>
                  Confirm New Password
                </label>
                <div style={{
                  position: "relative",
                }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength="8"
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      fontSize: "15px",
                      borderRadius: "10px",
                      border: "1px solid #ced4da",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s ease",
                      backgroundColor: "#ffffff",
                    }}
                  />
                </div>
              </div>

              {message && (
                <div style={{
                  padding: "12px 15px",
                  marginBottom: "20px",
                  borderRadius: "8px",
                  backgroundColor: message.includes("success") ? "#d4edda" : "#f8d7da",
                  color: message.includes("success") ? "#155724" : "#721c24",
                  fontSize: "14px",
                  fontWeight: "500",
                }}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "15px",
                  backgroundColor: isLoading ? "#6c757d" : "#0a58ca",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "500",
                  fontSize: "16px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s ease",
                  boxShadow: "0 4px 6px rgba(10, 88, 202, 0.2)",
                  marginBottom: "20px",
                }}
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          <div style={{
            textAlign: "center",
            marginTop: "15px",
          }}>
            <Link
              to="/login"
              style={{
                display: "inline-block",
                fontSize: "14px",
                color: "#0a58ca",
                textDecoration: "none",
                fontWeight: "500",
                padding: "8px 16px",
                borderRadius: "6px",
                backgroundColor: "#e9ecef",
                transition: "background-color 0.2s ease",
              }}
            >
              Back to Login
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer style={{
          backgroundColor: "#f8f9fa",
          borderTop: "1px solid #e9ecef",
          padding: "20px 0",
          textAlign: "center",
          color: "#6c757d",
          marginTop: "20px",
        }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "5px",
          }}>
            <p style={{ 
              margin: 0,
              fontSize: "14px",
              fontWeight: "500",
            }}>
              A product of Flamingoes
            </p>
            <p style={{ 
              margin: 0, 
              fontSize: "12px",
              color: "#adb5bd",
            }}>
              © Flamingoes 2025. All Rights Reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ForgotPassword;