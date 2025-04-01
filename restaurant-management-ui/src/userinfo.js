import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Edit, 
  Mail, 
  Phone, 
  Briefcase, 
  Shield,
  CheckCircle,
  XCircle
} from 'lucide-react';

const UserProfile = () => {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    restaurant_id: ''
  });

  const [contextData, setContextData] = useState({
    restaurantName: '',
    lastLogin: '',
    accountStatus: '',
    profileCompleteness: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get('http://localhost:5000/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const { userData, contextData } = response.data;

        setUserData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          role: userData.role || '',
          restaurant_id: userData.restaurant_id || ''
        });

        setContextData({
          restaurantName: contextData.restaurantName || 'Unassigned',
          lastLogin: contextData.lastLogin || new Date().toISOString(),
          accountStatus: contextData.accountStatus || 'pending',
          profileCompleteness: contextData.profileCompleteness || 0
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Full profile fetch error:', err);
        setError({
          message: err.response?.data?.message || err.message || 'Unknown error',
          status: err.response?.status
        });
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleEditProfile = () => {
    console.log('Edit profile clicked');
    // Implement edit profile navigation or modal
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid #0a58ca',
          borderTop: '4px solid #20c997',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        padding: "20px"
      }}>
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
          width: "90%",
          maxWidth: "600px",
          padding: "30px",
          textAlign: "center"
        }}>
          <h2 style={{color: "#dc3545", marginBottom: "20px"}}>Error Loading Profile</h2>
          <p style={{
            color: "#6c757d",
            marginBottom: "20px"
          }}>
            {error.message}
          </p>
          {error.status === 401 && (
            <button 
              onClick={handleLogout}
              style={{
                width: "100%",
                backgroundColor: "#dc3545",
                color: "white",
                padding: "14px",
                border: "none",
                borderRadius: "8px",
                fontWeight: "500",
                fontSize: "15px",
                transition: "background-color 0.2s ease"
              }}
            >
              Go to Login
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#f8f9fa",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: "20px"
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
        width: "90%",
        maxWidth: "1000px", // Increased max-width
        minHeight: "80vh", // Minimum height of 80% of the viewport
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}>
        {/* Header section */}
        <div style={{
          padding: "25px 30px",
          borderBottom: "1px solid #e9ecef",
          backgroundColor: "#0a58ca",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h1 style={{ 
              margin: "0",
              fontSize: "24px",
              fontWeight: "600"
            }}>
              User Profile
            </h1>
            <p style={{
              margin: "8px 0 0 0",
              opacity: 0.8,
              fontSize: "14px"
            }}>
              {userData.name} | {userData.role}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              onClick={handleEditProfile}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "white",
                padding: "10px 15px",
                border: "none",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer"
              }}
            >
              <Edit size={18} /> Edit
            </button>
            <button 
              onClick={handleLogout}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "white",
                padding: "10px 15px",
                border: "none",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer"
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Profile Details Section */}
        <div style={{ 
          padding: "25px 30px", 
          flex: 1 // This ensures the content takes up remaining space
        }}>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", 
            gap: "30px" 
          }}>
            {/* Contact Information */}
            <div>
              <h2 style={{
                marginBottom: "20px",
                borderBottom: "1px solid #e9ecef",
                paddingBottom: "10px",
                color: "#343a40"
              }}>
                Contact Information
              </h2>
              <ProfileDetailCard 
                icon={<Mail color="#0a58ca" />}
                label="Email Address"
                value={userData.email}
              />
              <ProfileDetailCard 
                icon={<Phone color="#20c997" />}
                label="Phone Number"
                value={userData.phone || 'Not provided'}
              />
            </div>

            {/* Professional Details */}
            <div>
              <h2 style={{
                marginBottom: "20px",
                borderBottom: "1px solid #e9ecef",
                paddingBottom: "10px",
                color: "#343a40"
              }}>
                Professional Details
              </h2>
              <ProfileDetailCard 
                icon={<Shield color="#0a58ca" />}
                label="User Role"
                value={userData.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'Unassigned'}
              />
              <ProfileDetailCard 
                icon={<Briefcase color="#20c997" />}
                label="Restaurant"
                value={contextData.restaurantName}
              />
            </div>
          </div>

          {/* Additional Information */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
            marginTop: "30px"
          }}>
            <div style={{
              backgroundColor: "#f8f9fa",
              padding: "20px",
              borderRadius: "8px",
              textAlign: "center"
            }}>
              <h3 style={{
                marginBottom: "15px",
                color: "#343a40",
                fontSize: "16px"
              }}>
                Account Status
              </h3>
              <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px"
              }}>
                {contextData.accountStatus === 'active' ? (
                  <CheckCircle color="#20c997" />
                ) : (
                  <XCircle color="#dc3545" />
                )}
                <span style={{
                  textTransform: "capitalize",
                  color: "#6c757d",
                  fontWeight: "500"
                }}>
                  {contextData.accountStatus}
                </span>
              </div>
            </div>

            <div style={{
              backgroundColor: "#f8f9fa",
              padding: "20px",
              borderRadius: "8px",
              textAlign: "center"
            }}>
              <h3 style={{
                marginBottom: "15px",
                color: "#343a40",
                fontSize: "16px"
              }}>
                Profile Completeness
              </h3>
              <div style={{
                width: "100%",
                height: "10px",
                backgroundColor: "rgba(32, 201, 151, 0.2)",
                borderRadius: "5px",
                overflow: "hidden",
                marginBottom: "10px"
              }}>
                <div style={{
                  height: "100%",
                  width: `${contextData.profileCompleteness}%`,
                  backgroundColor: "#20c997"
                }}></div>
              </div>
              <p style={{
                color: "#6c757d",
                fontWeight: "500"
              }}>
                {contextData.profileCompleteness}% Complete
              </p>
            </div>

            <div style={{
              backgroundColor: "#f8f9fa",
              padding: "20px",
              borderRadius: "8px",
              textAlign: "center"
            }}>
              <h3 style={{
                marginBottom: "15px",
                color: "#343a40",
                fontSize: "16px"
              }}>
                Last Login
              </h3>
              <p style={{
                color: "#6c757d",
                fontWeight: "500"
              }}>
                {new Date(contextData.lastLogin).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

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
    </div>
  );
};

// Helper Component for Profile Details
const ProfileDetailCard = ({ icon, label, value }) => (
  <div style={{
    backgroundColor: "#f8f9fa",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "15px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    transition: "transform 0.2s ease"
  }}>
    <div style={{
      backgroundColor: "rgba(10, 88, 202, 0.1)",
      padding: "10px",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center"
    }}>
      {icon}
    </div>
    <div>
      <p style={{
        margin: "0 0 5px 0",
        color: "#6c757d",
        fontSize: "12px",
        textTransform: "uppercase"
      }}>
        {label}
      </p>
      <p style={{
        margin: 0,
        color: "#343a40",
        fontWeight: "500"
      }}>
        {value}
      </p>
    </div>
  </div>
);

export default UserProfile;