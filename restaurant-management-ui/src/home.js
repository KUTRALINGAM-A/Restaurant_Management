import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "#f3f3f3"
    }}>
      <h1>Welcome to Restaurant Management System</h1>
      <button
        onClick={() => navigate("/restaurant-register")}
        style={buttonStyle}
      >
        Restaurant Registration
      </button>
      <button
        onClick={() => navigate("/user-register")}
        style={buttonStyle}
      >
        User Registration
      </button>
    </div>
  );
};

const buttonStyle = {
  width: "250px",
  padding: "15px",
  margin: "10px",
  fontSize: "16px",
  border: "none",
  borderRadius: "5px",
  backgroundColor: "#007bff",
  color: "white",
  cursor: "pointer",
  textAlign: "center"
};

export default Home;
