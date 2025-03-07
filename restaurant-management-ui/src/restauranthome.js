import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const RestaurantHome = () => {
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Retrieve restaurant name and user name from local storage
    const storedRestaurantName = localStorage.getItem("restaurantName");
    const storedUserName = localStorage.getItem("name");
    const storedEmail = localStorage.getItem("email");
    
    setRestaurantName(storedRestaurantName || "My Restaurant");
    setUserName(storedUserName || storedEmail || "User");
  }, []);

  const handleLogout = () => {
    // Clear local storage
    localStorage.clear();
    
    // Redirect to login page
    navigate("/");
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      height: "100vh",
      backgroundColor: "#f0f2f5",
      padding: "20px 0",
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        width: "80%",
        maxWidth: "600px",
      }}>
        <div style={{
          textAlign: "left",
          marginBottom: "20px"
        }}>
          <h1 style={{ 
            color: "#007bff",
            margin: "0"
          }}>
            {restaurantName}'s Dashboard
          </h1>
          <p style={{
            margin: "5px 0 0 0",
            color: "#6c757d"
          }}>
            Welcome {userName}
          </p>
        </div>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "20px",
        }}>
          <button
            style={{
              flex: 1,
              padding: "15px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Employee Attendance
          </button>

          <button
            style={{
              flex: 1,
              padding: "15px",
              backgroundColor: "#ffc107",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Billing
          </button>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            marginTop: "20px",
            padding: "10px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
        
        <div style={{
          textAlign: "center",
          marginTop: "20px",
          fontSize: "14px",
          color: "#6c757d"
        }}>
          A product of Flamingoes
        </div>
      </div>
      
      <footer style={{
        width: "100%",
        textAlign: "center",
        padding: "10px 0",
        color: "#6c757d",
        fontSize: "12px"
      }}>
        © Flamingoes 2025 All Rights Reserved 
      </footer>
    </div>
  );
};

export default RestaurantHome;