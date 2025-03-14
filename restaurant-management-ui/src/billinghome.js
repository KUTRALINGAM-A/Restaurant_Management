import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BillingHome = () => {
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = React.useState("My Restaurant");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = React.useState("User");
  const [error, setError] = React.useState("");
  const [logoUrl, setLogoUrl] = React.useState(null);
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
        backgroundColor: "#f8f9fa",
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "15px"
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #3498db",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}></div>
          <p style={{ color: "#495057", fontWeight: "500" }}>Loading dashboard...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
}

  const handleBackToDashboard = () => {
    navigate("/restaurant-home");
  };
  

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      backgroundColor: "#f8f9fa",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    }}>
        
      {/* Header */}
      <header style={{
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
        padding: "15px 25px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        {/* Logo and Restaurant Name */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "15px"
        }}>
          <div style={{
            width: "60px",
            height: "60px",
            borderRadius: "8px",
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#f8f9fa",
            border: "1px solid #e9ecef"
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
                color: "#6c757d",
                fontSize: "12px",
                textAlign: "center",
                padding: "5px"
              }}>
                No logo
              </div>
            )}
          </div>
          <h1 style={{ 
            margin: "0",
            fontSize: "22px",
            fontWeight: "600",
            color: "#212529"
          }}>
            {restaurantName}
          </h1>
        </div>

        {/* User welcome and logout */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "20px"
        }}>
          <div style={{
            textAlign: "right"
          }}>
            <p style={{
              margin: "0",
              fontSize: "14px",
              color: "#6c757d"
            }}>
              Welcome,
            </p>
            <p style={{
              margin: "0",
              fontWeight: "500",
              color: "#212529"
            }}>
              {userName}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "transparent",
              color: "#dc3545",
              border: "1px solid #dc3545",
              borderRadius: "4px",
              padding: "8px 16px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease"
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#dc3545";
              e.target.style.color = "white";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = "#dc3545";
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Error notification */}
      {error && (
        <div style={{
          backgroundColor: "#f8d7da",
          color: "#721c24",
          padding: "12px 20px",
          margin: "15px auto",
          borderRadius: "4px",
          width: "80%",
          maxWidth: "800px",
          textAlign: "center",
          fontWeight: "500",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          {error}
        </div>
      )}

      {/* Main content */}
      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px"
      }}>
        <div style={{
          width: "100%",
          maxWidth: "900px"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px"
          }}>
            <button
              onClick={handleBackToDashboard}
              style={{
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "8px 16px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = "#5a6268";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "#6c757d";
              }}
            >
              <span>←</span> Back to Dashboard
            </button>
            
            <h2 style={{
              fontSize: "24px",
              color: "#343a40",
              margin: "0",
              fontWeight: "600"
            }}>
              Billing Management
            </h2>
            
            <div style={{ width: "120px" }}></div> {/* Empty div for spacing */}
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "25px",
            marginBottom: "30px"
          }}>
            {/* Menu Management Card */}
            <BillingCard 
              title="Menu Management"
              description="Add, remove or update menu items for billing"
              icon="🍽️"
              color="#0d6efd"
              actionText="Manage Menu"
              onClick={() => navigate("/billing/CURD_menu")}
            />

            {/* New Bill Card */}
            <BillingCard 
              title="New Bill"
              description="Create a new bill for customer orders"
              icon="📝"
              color="#198754"
              actionText="Create Bill"
              onClick={() => navigate("/billing/new-bill")}
            />

            {/* Bill Reports Card */}
            <BillingCard 
              title="Bill Reports"
              description="View and analyze bills date-wise"
              icon="📊"
              color="#fd7e14"
              actionText="View Reports"
              onClick={() => navigate("/billing/reports")}
            />
          </div>

         
        </div>
      </main>

      {/* Footer */}
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
  );
};

// Billing Card Component for main options
const BillingCard = ({ title, description, icon, color, actionText, onClick }) => {
  return (
    <div 
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        padding: "30px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        cursor: "pointer",
        border: "1px solid transparent",
        height: "100%"
      }}
      onClick={onClick}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.12)";
        e.currentTarget.style.borderColor = color;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)";
        e.currentTarget.style.borderColor = "transparent";
      }}
    >
      <div style={{
        width: "60px",
        height: "60px",
        borderRadius: "12px",
        backgroundColor: `${color}15`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "28px"
      }}>
        {icon}
      </div>
      <div>
        <h3 style={{
          margin: "0 0 10px 0",
          color: "#212529",
          fontSize: "20px",
          fontWeight: "600"
        }}>
          {title}
        </h3>
        <p style={{
          margin: "0",
          color: "#6c757d",
          fontSize: "15px",
          lineHeight: "1.5"
        }}>
          {description}
        </p>
      </div>
      <div style={{
        marginTop: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <span style={{
          color: color,
          fontSize: "15px",
          fontWeight: "600"
        }}>
          {actionText}
        </span>
        <span style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          backgroundColor: `${color}15`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: color,
          fontSize: "16px"
        }}>
          →
        </span>
      </div>
    </div>
  );
};

// Stat Card Component for quick stats


export default BillingHome;