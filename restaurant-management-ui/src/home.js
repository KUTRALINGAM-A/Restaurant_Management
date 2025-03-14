import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [activeOption, setActiveOption] = useState(null);

  // Simulated animation effect
  useEffect(() => {
    const timer = setTimeout(() => {
      document.getElementById("content-container").style.opacity = "1";
      document.getElementById("content-container").style.transform = "translateY(0)";
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
          width: "100%",
          maxWidth: "520px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Improved header section */}
        <div style={{
          padding: "30px 35px",
          textAlign: "center",
          background: "#ffffff",
          position: "relative",
          borderBottom: "1px solid #e9ecef",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "12px",
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #0a58ca 0%, #0d6efd 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "18px",
              fontWeight: "bold",
              boxShadow: "0 4px 6px rgba(10, 88, 202, 0.2)",
              marginRight: "12px",
            }}>
              R
            </div>
            <h1 style={{ 
              margin: "0",
              fontSize: "24px",
              fontWeight: "600",
              color: "#212529",
              letterSpacing: "0.5px",
            }}>
              Restaurant Management
            </h1>
          </div>
          <p style={{
            
            fontSize: "15px",
            color: "#6c757d",
            maxWidth: "320px",
            margin: "0 auto",
          }}>
            The complete solution for streamlining your restaurant operations
          </p>
        </div>

        {/* Content section with animation */}
        <div id="content-container" style={{ 
          padding: "30px 35px",
          opacity: "0",
          transform: "translateY(20px)",
          transition: "all 0.6s ease",
        }}>
          <div style={{
            textAlign: "center",
            marginBottom: "25px",
          }}>
            <h2 style={{
              fontSize: "18px",
              fontWeight: "500",
              color: "#343a40",
              margin: "0",
            }}>
              Welcome to Flamingoes Restaurant Portal
            </h2>
            <p style={{
              margin: "8px 0 0 0",
              fontSize: "14px",
              color: "#6c757d",
              lineHeight: "1.5",
            }}>
              Select an option below to get started
            </p>
          </div>
          
          {/* Registration options with hover effects */}
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "16px",
            marginBottom: "30px",
          }}>
            <div 
              style={{
                border: "1px solid #e9ecef",
                borderRadius: "10px",
                padding: "20px 25px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: activeOption === "restaurant" ? "0 6px 12px rgba(10, 88, 202, 0.1)" : "0 2px 4px rgba(0, 0, 0, 0.04)",
                backgroundColor: activeOption === "restaurant" ? "#f8f9ff" : "#ffffff",
                borderColor: activeOption === "restaurant" ? "#0a58ca" : "#e9ecef",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
              onClick={() => navigate("/restaurant-register")}
              onMouseEnter={() => setActiveOption("restaurant")}
              onMouseLeave={() => setActiveOption(null)}
            >
              <div>
                <h3 style={{
                  margin: "0 0 6px 0",
                  fontSize: "17px",
                  fontWeight: "600",
                  color: "#212529",
                }}>
                  Restaurant Registration
                </h3>
                <p style={{
                  margin: "0",
                  fontSize: "14px",
                  color: "#6c757d",
                  lineHeight: "1.4",
                }}>
                  Create and manage your restaurant account
                </p>
              </div>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: activeOption === "restaurant" ? "#0a58ca" : "#f8f9fa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: activeOption === "restaurant" ? "white" : "#6c757d",
                transition: "all 0.2s ease",
              }}>
                <span style={{ fontSize: "18px" }}>→</span>
              </div>
            </div>
            
            <div 
              style={{
                border: "1px solid #e9ecef",
                borderRadius: "10px",
                padding: "20px 25px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: activeOption === "user" ? "0 6px 12px rgba(10, 88, 202, 0.1)" : "0 2px 4px rgba(0, 0, 0, 0.04)",
                backgroundColor: activeOption === "user" ? "#f8f9ff" : "#ffffff",
                borderColor: activeOption === "user" ? "#0a58ca" : "#e9ecef",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
              onClick={() => navigate("/user-register")}
              onMouseEnter={() => setActiveOption("user")}
              onMouseLeave={() => setActiveOption(null)}
            >
              <div>
                <h3 style={{
                  margin: "0 0 6px 0",
                  fontSize: "17px",
                  fontWeight: "600",
                  color: "#212529",
                }}>
                  User Registration
                </h3>
                <p style={{
                  margin: "0",
                  fontSize: "14px",
                  color: "#6c757d",
                  lineHeight: "1.4",
                }}>
                  Join as a new user in the system
                </p>
              </div>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: activeOption === "user" ? "#0a58ca" : "#f8f9fa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: activeOption === "user" ? "white" : "#6c757d",
                transition: "all 0.2s ease",
              }}>
                <span style={{ fontSize: "18px" }}>→</span>
              </div>
            </div>
          </div>
          
          {/* Login button with hover effect */}
          <div style={{
            marginBottom: "30px",
          }}>
            <button
              onClick={() => navigate("/")}
              style={{
                width: "100%",
                padding: "15px",
                backgroundColor: "#0a58ca",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontWeight: "500",
                fontSize: "16px",
                cursor: "pointer",
                transition: "background-color 0.2s ease",
                boxShadow: "0 4px 6px rgba(10, 88, 202, 0.2)",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#094db1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#0a58ca";
              }}
            >
              Login to Your Account
            </button>
          </div>
          
          {/* Support section */}
          <div style={{
            marginTop: "10px",
            textAlign: "center",
            padding: "18px",
            borderRadius: "10px",
            backgroundColor: "#f8f9fa",
            border: "1px solid #e9ecef",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "8px",
            }}>
              <div style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                backgroundColor: "#0a58ca",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "12px",
                fontWeight: "bold",
              }}>
                ?
              </div>
              <p style={{
                margin: "0",
                fontSize: "15px",
                color: "#343a40",
                fontWeight: "500",
              }}>
                Need assistance?
              </p>
            </div>
            <p style={{
              margin: "5px 0 0 0",
              fontSize: "14px",
              color: "#6c757d",
              lineHeight: "1.5",
            }}>
              Our support team is available at{" "}
              <span style={{ 
                color: "#0a58ca", 
                fontWeight: "500",
                textDecoration: "none",
                borderBottom: "1px dashed #0a58ca",
                paddingBottom: "1px",
              }}>
                support@flamingoes.com
              </span>
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <footer style={{
          backgroundColor: "#f8f9fa",
          borderTop: "1px solid #e9ecef",
          padding: "20px 0",
          textAlign: "center",
          color: "#6c757d",
        }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "5px",
          }}>
            <p style={{ 
              margin: 0,
              fontSize: "14px",
              fontWeight: "500",
            }}>
              A product of Flamingoes
            </p>
            <p style={{ 
              margin: 0, 
              fontSize: "12px",
              color: "#adb5bd",
            }}>
              © Flamingoes 2025. All Rights Reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;