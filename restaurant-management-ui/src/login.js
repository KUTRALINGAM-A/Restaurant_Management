import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const UserLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/users/login", formData);
      setMessage(response.data.message);
      localStorage.setItem("token", response.data.token);
    } catch (error) {
      if (error.response && error.response.data) {
        setMessage(error.response.data.message || "Login failed. Server error.");
      } else {
        setMessage("Login failed. Network error or server unavailable.");
        console.error("Login error:", error);
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
          />
          <button
            type="submit"
            style={{
              width: "100%",
              background: "#007bff",
              color: "white",
              padding: "10px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Login
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
