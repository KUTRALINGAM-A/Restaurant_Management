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
          maxWidth: "800px"
        }}>
          <h2 style={{
            fontSize: "20px",
            color: "#343a40",
            margin: "0 0 25px 0",
            textAlign: "center",
            fontWeight: "600"
          }}>
            Restaurant Management Dashboard
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
            marginBottom: "30px"
          }}>
            {/* Action Cards - Interactive cards that serve as buttons */}
            <ActionCard 
              title="Attendance Summary"
              description="Track and manage employee time records"
              icon="👥"
              color="#0a58ca"
              onClick={() => console.log("Attendance clicked")}
            />

            <ActionCard 
              title="Billing"
              description="Generate and manage customer bills"
              icon="💰"
              color="#198754"
              onClick={() => console.log("Billing clicked")}
            />

            <ActionCard 
              title="Reports"
              description="View business analytics and reports"
              icon="📊"
              color="#fd7e14"
              onClick={() => console.log("Reports clicked")}
            />
          </div>

          {/* Additional quick actions section */}
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            padding: "25px",
            marginTop: "30px"
          }}>
            <h3 style={{
              fontSize: "16px",
              color: "#343a40",
              margin: "0 0 20px 0",
              fontWeight: "600"
            }}>
              Quick Actions
            </h3>
            
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "15px"
            }}>
              <QuickActionButton
                icon="✓"
                text="Mark Attendance"
                color="#0a58ca"
                onClick={() => console.log("Quick attendance clicked")}
              />
              
              <QuickActionButton
                icon="$"
                text="New Bill"
                color="#198754"
                onClick={() => console.log("Quick billing clicked")}
              />
              
              <QuickActionButton
                icon="↻"
                text="Refresh Data"
                color="#6c757d"
                onClick={() => console.log("Refresh clicked")}
              />
            </div>
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

// Action Card Component - Cards that function as primary actions
const ActionCard = ({ title, description, icon, color, onClick }) => {
  return (
    <div 
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        padding: "25px",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        cursor: "pointer",
        border: "1px solid transparent",
      }}
      onClick={onClick}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
        e.currentTarget.style.borderColor = color;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
        e.currentTarget.style.borderColor = "transparent";
      }}
    >
      <div style={{
        width: "50px",
        height: "50px",
        borderRadius: "10px",
        backgroundColor: `${color}15`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "24px"
      }}>
        {icon}
      </div>
      <h3 style={{
        margin: "0",
        color: "#212529",
        fontSize: "18px",
        fontWeight: "600"
      }}>
        {title}
      </h3>
      <p style={{
        margin: "0",
        color: "#6c757d",
        fontSize: "14px"
      }}>
        {description}
      </p>
      <div style={{
        marginTop: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <span style={{
          color: color,
          fontSize: "14px",
          fontWeight: "500"
        }}>
          Open
        </span>
        <span style={{
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          backgroundColor: `${color}15`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: color,
          fontSize: "14px"
        }}>
          →
        </span>
      </div>
    </div>
  );
};

// Quick Action Button Component - For secondary actions
const QuickActionButton = ({ icon, text, color, onClick }) => {
  return (
    <button 
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        backgroundColor: "white",
        border: `1px solid ${color}30`,
        borderRadius: "8px",
        padding: "12px 15px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        color: "#495057",
        fontWeight: "500",
        fontSize: "14px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = color;
        e.currentTarget.style.color = "white";
        e.currentTarget.style.boxShadow = "0 3px 6px rgba(0,0,0,0.1)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = "white";
        e.currentTarget.style.color = "#495057";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
      }}
    >
      <span style={{
        width: "24px",
        height: "24px",
        borderRadius: "50%",
        backgroundColor: `${color}20`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: color
      }}>
        {icon}
      </span>
      {text}
    </button>
  );
};

export default RestaurantHome;