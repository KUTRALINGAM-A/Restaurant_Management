import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const UserRegistration = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "staff",
    restaurant_id: "",
    secret_code: "",
  });

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageType, setMessageType] = useState("success"); // success or error

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    
    try {
      const response = await axios.post(
        "http://localhost:5000/users/register",
        formData
      );
      setMessage(response.data.message);
      setMessageType("success");
    } catch (error) {
      setMessage(error.response?.data?.message || "Registration failed");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
          width: "100%",
          maxWidth: "500px",
          overflow: "hidden",
        }}
      >
        {/* Header section */}
        <div style={{
          padding: "25px 30px",
          borderBottom: "1px solid #e9ecef",
          textAlign: "center"
        }}>
          <h1 style={{ 
            margin: "0",
            fontSize: "24px",
            fontWeight: "600",
            color: "#212529" 
          }}>
            User Registration
          </h1>
          <p style={{
            margin: "8px 0 0 0",
            color: "#6c757d",
            fontSize: "14px"
          }}>
            Create a new staff or manager account
          </p>
        </div>

        {/* Form section */}
        <div style={{ padding: "25px 30px" }}>
          <form onSubmit={handleSubmit}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={inputStyle}
                placeholder="Enter your full name"
                required
                disabled={isLoading}
              />
            </div>

            <div style={{ display: "flex", gap: "15px" }}>
              <div style={{ ...formGroupStyle, flex: 1 }}>
                <label style={labelStyle}>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Contact number"
                  required
                  disabled={isLoading}
                />
              </div>
              <div style={{ ...formGroupStyle, flex: 1 }}>
                <label style={labelStyle}>Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    appearance: "auto",
                    backgroundColor: "white"
                  }}
                  required
                  disabled={isLoading}
                >
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={inputStyle}
                placeholder="Contact email address"
                required
                disabled={isLoading}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={inputStyle}
                placeholder="Create a secure password"
                required
                disabled={isLoading}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Restaurant ID</label>
              <input
                type="text"
                name="restaurant_id"
                value={formData.restaurant_id}
                onChange={handleChange}
                style={inputStyle}
                placeholder="Enter your restaurant ID"
                required
                disabled={isLoading}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Secret Code</label>
              <input
                type="text"
                name="secret_code"
                value={formData.secret_code}
                onChange={handleChange}
                style={inputStyle}
                placeholder="Enter your secret code"
                required
                disabled={isLoading}
              />
            </div>
            
            {message && (
              <div style={{
                padding: "12px 15px",
                marginBottom: "20px",
                borderRadius: "6px",
                backgroundColor: messageType === "success" ? "#d1e7dd" : "#f8d7da",
                color: messageType === "success" ? "#0f5132" : "#721c24",
                fontSize: "14px",
                fontWeight: "500"
              }}>
                {message}
              </div>
            )}
            
            <button 
              type="submit" 
              style={{
                ...buttonStyle,
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
              disabled={isLoading}
            >
              {isLoading ? "Registering..." : "Register Account"}
            </button>
          </form>

          <div style={{
            textAlign: "center",
            marginTop: "25px",
            fontSize: "14px",
            color: "#6c757d"
          }}>
            Already have an account? <Link to="/" style={{
              color: "#0a58ca",
              textDecoration: "none",
              fontWeight: "500"
            }}>Login here</Link>
          </div>
        </div>
        
        <footer style={{
          backgroundColor: "#ffffff",
          borderTop: "1px solid #e9ecef",
          padding: "15px 0",
          textAlign: "center",
          color: "#6c757d",
          fontSize: "14px"
        }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "5px"
          }}>
            <p style={{ margin: 0 }}>A product of Flamingoes</p>
            <p style={{ margin: 0, fontSize: "12px" }}>© Flamingoes 2025. All Rights Reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

const formGroupStyle = {
  marginBottom: "20px",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "500",
  fontSize: "14px",
  color: "#343a40",
};

const inputStyle = {
  width: "100%",
  padding: "12px 15px",
  fontSize: "14px",
  border: "1px solid #ced4da",
  borderRadius: "8px",
  transition: "border-color 0.2s ease",
  outline: "none",
  boxSizing: "border-box",
};

const buttonStyle = {
  width: "100%",
  backgroundColor: "#0a58ca",
  color: "white",
  padding: "14px",
  border: "none",
  borderRadius: "8px",
  fontWeight: "500",
  fontSize: "15px",
  transition: "background-color 0.2s ease",
  marginTop: "10px",
};

export default UserRegistration;