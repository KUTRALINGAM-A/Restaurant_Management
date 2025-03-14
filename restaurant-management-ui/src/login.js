import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const UserLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Simulated animation effect
  useEffect(() => {
    const timer = setTimeout(() => {
      document.getElementById("login-container").style.opacity = "1";
      document.getElementById("login-container").style.transform = "translateY(0)";
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    
    try {
      // Attempt login
      const loginResponse = await axios.post("http://localhost:5000/users/login", formData);
      
      console.log("LOGIN RESPONSE DATA:", loginResponse.data);
      
      // Store token and user data
      localStorage.setItem("token", loginResponse.data.token);
      localStorage.setItem("email", formData.email);
      
      // IMPORTANT: Force store a name regardless of API structure
      // First try to get it from the response in different possible locations
      let userName = "User"; // Default fallback
      
      if (loginResponse.data.name) {
        userName = loginResponse.data.name;
      } else if (loginResponse.data.user && loginResponse.data.user.name) {
        userName = loginResponse.data.user.name;
      } else if (loginResponse.data.userName) {
        userName = loginResponse.data.userName;
      } else if (loginResponse.data.user && loginResponse.data.user.userName) {
        userName = loginResponse.data.user.userName;
      }
      
      console.log("STORING USER NAME:", userName);
      localStorage.setItem("name", userName);
      
      // Store restaurant info if available
      if (loginResponse.data.restaurantId) {
        localStorage.setItem("restaurantId", loginResponse.data.restaurantId);
      } else if (loginResponse.data.restaurant && loginResponse.data.restaurant.id) {
        localStorage.setItem("restaurantId", loginResponse.data.restaurant.id);
      }

      if (loginResponse.data.restaurantName) {
        localStorage.setItem("restaurantName", loginResponse.data.restaurantName);
      } else if (loginResponse.data.restaurant && loginResponse.data.restaurant.name) {
        localStorage.setItem("restaurantName", loginResponse.data.restaurant.name);
      }

      // Navigate to home page
      navigate("/restaurant-home");
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      
      // Check if the error is due to user not existing
      if (error.response && error.response.status === 404) {
        // User doesn't exist, redirect to home page
        console.log("User doesn't exist, redirecting to home page");
        navigate("/home");
      } else if (error.response && error.response.data) {
        setMessage(error.response.data.message || "Login failed. Please try again.");
        setIsLoading(false);
      } else {
        setMessage("Login failed. Network error or server unavailable.");
        setIsLoading(false);
      }
    }
  };

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
              User Login
            </h1>
          </div>
          <p style={{
            
            fontSize: "15px",
            color: "#6c757d",
            maxWidth: "320px",
            margin: "0 auto",
          }}>
            Access your restaurant management account
          </p>
        </div>

        {/* Form section with animation */}
        <div 
          id="login-container" 
          style={{ 
            padding: "30px 35px",
            opacity: "0",
            transform: "translateY(20px)",
            transition: "all 0.6s ease",
          }}
        >
          <form onSubmit={handleSubmit}>
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
                Email Address
              </label>
              <div style={{
                position: "relative",
              }}>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
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
                  ✉️
                </div>
              </div>
            </div>

            <div style={{
              marginBottom: "10px",
            }}>
              <label style={{
                display: "block",
                marginBottom: "8px", 
                fontSize: "14px",
                fontWeight: "500",
                color: "#343a40",
              }}>
                Password
              </label>
              <div style={{
                position: "relative",
              }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
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
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "25px",
              marginTop: "15px",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
              }}>
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  style={{
                    marginRight: "8px",
                  }}
                />
                <label
                  htmlFor="remember-me"
                  style={{
                    fontSize: "14px",
                    color: "#6c757d",
                    cursor: "pointer",
                  }}
                >
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: "14px",
                  color: "#0a58ca",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                Forgot password?
              </Link>
            </div>

            {message && (
              <div style={{
                padding: "12px 15px",
                marginBottom: "20px",
                borderRadius: "8px",
                backgroundColor: "#f8d7da",
                color: "#721c24",
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
              {isLoading ? "Logging in..." : "Login to Account"}
            </button>
          </form>

          <div style={{
            textAlign: "center",
            marginTop: "15px",
          }}>
            <p style={{
              margin: "0 0 5px 0",
              fontSize: "14px",
              color: "#6c757d",
            }}>
              Don't have an account?
            </p>
            <button
              onClick={() => navigate("/home")}
              style={{
                fontSize: "14px",
                color: "#0a58ca",
                textDecoration: "none",
                fontWeight: "500",
                padding: "8px 16px",
                borderRadius: "6px",
                backgroundColor: "#e9ecef",
                border: "none",
                cursor: "pointer",
                transition: "background-color 0.2s ease",
              }}
            >
              Register
            </button>
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

export default UserLogin;