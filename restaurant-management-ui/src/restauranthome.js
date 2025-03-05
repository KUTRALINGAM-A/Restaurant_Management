import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const RestaurantHome = () => {
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = useState("");

  useEffect(() => {
    // Retrieve restaurant name from local storage
    const storedRestaurantName = localStorage.getItem("restaurantName");
    setRestaurantName(storedRestaurantName || "My Restaurant");
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
      justifyContent: "center",
      height: "100vh",
      backgroundColor: "#f0f2f5",
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        width: "80%",
        maxWidth: "600px",
      }}>
        <h1 style={{ 
          textAlign: "center", 
          color: "#007bff",
          marginBottom: "20px"
        }}>
          {restaurantName} Dashboard
        </h1>

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
      </div>
    </div>
  );
};

export default RestaurantHome;