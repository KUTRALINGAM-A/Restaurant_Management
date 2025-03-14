import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const RestaurantRegistration = () => {
  const [formData, setFormData] = useState({
    name: "",
    owner_name: "",
    phone: "",
    restaurant_district: "",
    email: "",
    password: "",
    secret_code: "",
  });
  
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageType, setMessageType] = useState("success"); // success or error

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    
    // Create FormData object to send both text and binary data
    const registrationData = new FormData();
    
    // Add all text fields
    Object.keys(formData).forEach(key => {
      registrationData.append(key, formData[key]);
    });
    
    // Add role and logo
    registrationData.append("role", "owner");
    if (logo) {
      registrationData.append("logo", logo);
    }
    
    try {
      const response = await axios.post(
        "http://localhost:5000/users/register", 
        registrationData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
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
            Restaurant Registration
          </h1>
          <p style={{
            margin: "8px 0 0 0",
            color: "#6c757d",
            fontSize: "14px"
          }}>
            Create a new restaurant account
          </p>
        </div>

        {/* Form section */}
        <div style={{ padding: "25px 30px" }}>
          <form onSubmit={handleSubmit}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Restaurant Name</label>
              <input
                type="text"
                name="restaurant_name"
                value={formData.restaurant_name}
                onChange={handleChange}
                style={inputStyle}
                placeholder="Enter your restaurant name"
                required
                disabled={isLoading}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Owner Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={inputStyle}
                placeholder="Enter owner's full name"
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
                <label style={labelStyle}>District</label>
                <input
                  type="text"
                  name="restaurant_district"
                  value={formData.restaurant_district}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Restaurant location"
                  required
                  disabled={isLoading}
                />
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
            
            <div style={formGroupStyle}>
              <label style={labelStyle}>Restaurant Logo</label>
              <div style={{
                border: "1px dashed #ced4da",
                borderRadius: "8px",
                padding: "20px",
                textAlign: "center",
                backgroundColor: "#f8f9fa",
                cursor: isLoading ? "not-allowed" : "pointer",
                position: "relative",
              }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  disabled={isLoading}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    cursor: isLoading ? "not-allowed" : "pointer",
                  }}
                />
                {logoPreview ? (
                  <div>
                    <img 
                      src={logoPreview} 
                      alt="Logo Preview" 
                      style={{ 
                        maxWidth: "100%", 
                        maxHeight: "150px", 
                        borderRadius: "5px",
                        marginBottom: "10px"
                      }} 
                    />
                    <p style={{
                      margin: "0",
                      fontSize: "13px",
                      color: "#6c757d"
                    }}>
                      Click to change logo
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{
                      margin: "0 0 8px 0",
                      color: "#495057",
                      fontWeight: "500"
                    }}>
                      Upload Restaurant Logo
                    </p>
                    <p style={{
                      margin: "0",
                      fontSize: "13px",
                      color: "#6c757d"
                    }}>
                      Click to browse files (PNG, JPG)
                    </p>
                  </div>
                )}
              </div>
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
              {isLoading ? "Registering..." : "Register Restaurant"}
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

export default RestaurantRegistration;