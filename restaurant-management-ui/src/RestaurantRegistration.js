import React, { useState } from "react";
import axios from "axios";

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
    } catch (error) {
      setMessage(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f3f3f3",
        padding: "20px 40px",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
          width: "400px",
          paddingRight: "30px",
        }}
      >
        <h2 style={{ textAlign: "center" }}>Restaurant Registration</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="restaurant_name"
            placeholder="Restaurant Name"
            value={formData.restaurant_name}
            onChange={handleChange}
            style={inputStyle}
            required
          />
          <input
            type="text"
            name="name"
            placeholder="Owner Name"
            value={formData.name}
            onChange={handleChange}
            style={inputStyle}
            required
          />
          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            style={inputStyle}
            required
          />
          <input
            type="text"
            name="restaurant_district"
            placeholder="District"
            value={formData.restaurant_district}
            onChange={handleChange}
            style={inputStyle}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            style={inputStyle}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            style={inputStyle}
            required
          />
          <input
            type="text"
            name="secret_code"
            placeholder="Secret Code"
            value={formData.secret_code}
            onChange={handleChange}
            style={inputStyle}
            required
          />
          
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Restaurant Logo:
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              style={{ ...inputStyle, padding: "8px" }}
            />
            {logoPreview && (
              <div style={{ textAlign: "center", marginTop: "10px" }}>
                <img 
                  src={logoPreview} 
                  alt="Logo Preview" 
                  style={{ 
                    maxWidth: "100%", 
                    maxHeight: "150px", 
                    borderRadius: "5px" 
                  }} 
                />
              </div>
            )}
          </div>
          
          <button type="submit" style={buttonStyle}>Register</button>
        </form>
        {message && (
          <p style={{ marginTop: "10px", textAlign: "center", color: "green" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
  border: "1px solid #ccc",
  borderRadius: "5px",
};

const buttonStyle = {
  width: "100%",
  background: "#007bff",
  color: "white",
  padding: "10px",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

export default RestaurantRegistration;