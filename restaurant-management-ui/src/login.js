import React, { useState } from "react";
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      }

      if (loginResponse.data.restaurantName) {
        localStorage.setItem("restaurantName", loginResponse.data.restaurantName);
      }

      // Navigate to home page
      navigate("/restaurant-home");
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      
      if (error.response && error.response.data) {
        setMessage(error.response.data.message || "Login failed. Please try again.");
      } else {
        setMessage("Login failed. Network error or server unavailable.");
      }
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
        <h2 style={{ textAlign: "center" }}>User Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              border: "1px solid #ccc",
              borderRadius: "5px",
            }}
            required
            disabled={isLoading}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              border: "1px solid #ccc",
              borderRadius: "5px",
            }}
            required
            disabled={isLoading}
          />
          <button
            type="submit"
            style={{
              width: "100%",
              background: isLoading ? "#cccccc" : "#007bff",
              color: "white",
              padding: "10px",
              border: "none",
              borderRadius: "5px",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        {message && (
          <p style={{ marginTop: "10px", textAlign: "center", color: "red" }}>
            {message}
          </p>
        )}
        <p style={{ textAlign: "center", marginTop: "10px" }}>
          Don't have an account? <Link to="/home">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default UserLogin;