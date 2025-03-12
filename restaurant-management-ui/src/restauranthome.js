import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const RestaurantHome = () => {
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = useState("My Restaurant");
  const [userName, setUserName] = useState("User");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    try {
      // Check for token
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }
      
      // Get user name directly from localStorage
      const storedName = localStorage.getItem("name");
      if (storedName) {
        setUserName(storedName);
      }
      
      // Get restaurant name
      const storedRestaurantName = localStorage.getItem("restaurantName");
      if (storedRestaurantName) {
        setRestaurantName(storedRestaurantName);
      }
      
      // Fetch restaurant logo
      const restaurantId = localStorage.getItem("restaurantId");
      
      if (restaurantId) {
        fetchRestaurantLogo(restaurantId, token);
      } else {
        setLoading(false);
      }
    } catch (error) {
      setError("Error loading dashboard");
      setLoading(false);
    }
  }, [navigate]);

  const fetchRestaurantLogo = async (restaurantId, token) => {
    try {
      const response = await axios.get(`http://localhost:5000/users/restaurant-logo/${restaurantId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      });
      
      // Create a blob URL from the response data
      const logoBlob = new Blob([response.data], { type: response.headers['content-type'] || 'image/png' });
      const url = URL.createObjectURL(logoBlob);
      setLogoUrl(url);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      height: "100vh",
      backgroundColor: "#f0f2f5",
      padding: "20px 0",
      position: "relative",
    }}>
      {error && (
        <div style={{
          position: "absolute",
          top: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#f8d7da",
          color: "#721c24",
          padding: "10px 15px",
          borderRadius: "5px",
          zIndex: 1000
        }}>
          {error}
        </div>
      )}
      
      {/* Restaurant name and welcome message positioned at top right */}
      <div style={{
        position: "absolute",
        top: "20px",
        right: "20px",
        textAlign: "right",
        backgroundColor: "white",
        padding: "10px 15px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}>
        <h1 style={{ 
          color: "#007bff",
          margin: "0",
          fontSize: "18px"
        }}>
          {restaurantName}'s Dashboard
        </h1>
        <p style={{
          margin: "5px 0 0 0",
          color: "#6c757d",
          fontSize: "14px"
        }}>
          Welcome {userName}
        </p>
      </div>

      {/* Restaurant Logo */}
      <div style={{
        position: "absolute",
        top: "20px",
        left: "20px",
        backgroundColor: "white",
        padding: "10px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        width: "120px",
        height: "120px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden"
      }}>
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt={`${restaurantName} Logo`} 
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain"
            }} 
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
            backgroundColor: "#f0f2f5",
            color: "#6c757d",
            fontSize: "14px",
            textAlign: "center"
          }}>
            No logo available
          </div>
        )}
      </div>

      {/* Centered buttons container */}
      <div style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        width: "80%",
        maxWidth: "600px",
        margin: "auto",
        marginTop: "80px"
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          alignItems: "center",
        }}>
          <button
            style={{
              width: "100%",
              padding: "15px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            Employee Attendance
          </button>

          <button
            style={{
              width: "100%",
              padding: "15px",
              backgroundColor: "#ffc107",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            Billing
          </button>

          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "15px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            Logout
          </button>
        </div>
        
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