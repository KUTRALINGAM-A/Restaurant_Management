import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ViewAttendance = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [restaurantName, setRestaurantName] = useState("My Restaurant");
  const [userName, setUserName] = useState("User");
  const [logoUrl, setLogoUrl] = useState(null);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Function to handle API errors and display them properly
  const getErrorMessage = (error) => {
    if (error.response) {
      return `Server error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`;
    } else if (error.request) {
      return "No response from server. Please check your connection.";
    } else {
      return `Error: ${error.message}`;
    }
  };

  // Get days in month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get day of week the month starts on (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  useEffect(() => {
    // Check for token and restaurant ID
    const token = localStorage.getItem("token");
    const restaurantId = localStorage.getItem("restaurantId");
    const storedRestaurantName = localStorage.getItem("restaurantName");
    const storedName = localStorage.getItem("name");

    if (!token || !restaurantId) {
      navigate("/");
      return;
    }

    if (storedRestaurantName) {
      setRestaurantName(storedRestaurantName);
    }

    if (storedName) {
      setUserName(storedName);
    }

    // Fetch restaurant logo
    if (restaurantId && token) {
      fetchRestaurantLogo(restaurantId, token);
    }

    // Fetch employees
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/employees/${restaurantId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        const employeeData = Array.isArray(response.data) ? response.data : [];
        setEmployees(employeeData);
        
        // If we have employees, select the first one by default
        if (employeeData.length > 0) {
          setSelectedEmployee(employeeData[0].id);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching employees:", err);
        setError(`Failed to load employees: ${getErrorMessage(err)}`);
        setLoading(false);
      }
    };

    fetchEmployees();
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
    } catch (error) {
      console.error("Error fetching logo:", error);
    }
  };

  // Fetch attendance data when employee, month, or year changes
  useEffect(() => {
    if (!selectedEmployee) return;

    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const restaurantId = localStorage.getItem("restaurantId");

        if (!token || !restaurantId) {
          navigate("/");
          return;
        }

        // Format the date range for the API
        const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(getDaysInMonth(month, year)).padStart(2, '0')}`;

        // FIXED: Updated API endpoint to match the backend route structure
        const response = await axios.get(
          `http://localhost:5000/employees/employees/attendance/${restaurantId}/employee/${selectedEmployee}`,
          {
            params: { startDate, endDate },
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        // Process the attendance data into a format that's easy to use in the calendar
        const processedData = {};
        if (response.data && Array.isArray(response.data)) {
          response.data.forEach(record => {
            const dateKey = new Date(record.date).getDate();
            processedData[dateKey] = {
              status: record.status,
              remarks: record.remarks || ""
            };
          });
        }

        setAttendanceData(processedData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching attendance data:", err);
        setError(`Failed to load attendance data: ${getErrorMessage(err)}`);
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [selectedEmployee, month, year, navigate]);

  const handleEmployeeChange = (e) => {
    setSelectedEmployee(e.target.value);
  };

  const handleMonthChange = (e) => {
    setMonth(parseInt(e.target.value));
  };

  const handleYearChange = (e) => {
    setYear(parseInt(e.target.value));
  };

  const handlePreviousMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleBack = () => {
    navigate("/attendance/attendance_home");
  };

  const getAttendanceStatusColor = (dayNumber) => {
    const attendance = attendanceData[dayNumber];
    if (!attendance) return "#f8f9fa"; // Default background for no data

    switch (attendance.status) {
      case "present":
        return "#d4edda"; // Green background for present
      case "absent":
      case "leave":
        return "#f8d7da"; // Red background for absent/leave
      case "halfday":
      case "permission":
        return "#cce5ff"; // Blue background for halfday/permission
      default:
        return "#f8f9fa"; // Default background
    }
  };

  const getAttendanceStatusText = (dayNumber) => {
    const attendance = attendanceData[dayNumber];
    if (!attendance) return "";

    switch (attendance.status) {
      case "present":
        return "Present";
      case "absent":
        return "Absent";
      case "leave":
        return "On Leave";
      case "halfday":
        return "Half Day";
      case "permission":
        return "Permission";
      default:
        return "";
    }
  };

  if (loading && !employees.length) {
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
          <p style={{ color: "#495057", fontWeight: "500" }}>Loading data...</p>
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

  // Generate calendar days
  const daysInMonth = getDaysInMonth(month, year);
  const firstDayOfMonth = getFirstDayOfMonth(month, year);
  const calendarDays = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} style={{ backgroundColor: "#f8f9fa" }}></div>);
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const statusColor = getAttendanceStatusColor(day);
    const statusText = getAttendanceStatusText(day);
    const remarks = attendanceData[day]?.remarks || "";

    calendarDays.push(
      <div 
        key={`day-${day}`} 
        style={{
          backgroundColor: statusColor,
          padding: "10px",
          height: "100px",
          borderRadius: "4px",
          display: "flex",
          flexDirection: "column",
          position: "relative"
        }}
      >
        <div style={{
          fontWeight: "bold",
          marginBottom: "5px",
          fontSize: "16px"
        }}>
          {day}
        </div>
        {statusText && (
          <div style={{
            fontSize: "12px",
            fontWeight: "500"
          }}>
            {statusText}
          </div>
        )}
        {remarks && (
          <div style={{
            fontSize: "11px",
            marginTop: "5px",
            color: "#6c757d",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: "3",
            WebkitBoxOrient: "vertical"
          }}>
            {remarks}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      backgroundColor: "#f8f9fa",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    }}>
      {/* Header - Updated to match RestaurantHome */}
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
          <button
            onClick={handleBack}
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: "#0a58ca",
              cursor: "pointer",
              fontSize: "24px",
              display: "flex",
              alignItems: "center",
              padding: "0",
              marginRight: "10px"
            }}
          >
            ←
          </button>
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
            View Attendance - {restaurantName}
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

      {/* Main content */}
      <main style={{
        flex: 1,
        padding: "25px",
        maxWidth: "1200px",
        margin: "0 auto",
        width: "100%"
      }}>
        {/* Error message */}
        {error && (
          <div style={{
            backgroundColor: "#f8d7da",
            color: "#721c24",
            padding: "12px 20px",
            marginBottom: "20px",
            borderRadius: "4px",
            textAlign: "center",
            fontWeight: "500"
          }}>
            {error}
          </div>
        )}

        {/* Controls */}
        <div style={{
          backgroundColor: "#ffffff",
          padding: "15px 20px",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <label htmlFor="employee" style={{ fontSize: "14px", color: "#495057" }}>Employee:</label>
            <select
              id="employee"
              value={selectedEmployee}
              onChange={handleEmployeeChange}
              style={{
                padding: "8px 12px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                backgroundColor: "white",
                fontSize: "14px",
                minWidth: "200px"
              }}
            >
              {employees.length === 0 ? (
                <option value="">No employees found</option>
              ) : (
                employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role || "staff"})
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <button
              onClick={handlePreviousMonth}
              style={{
                backgroundColor: "#e9ecef",
                border: "none",
                borderRadius: "4px",
                padding: "8px 12px",
                cursor: "pointer"
              }}
            >
              &lt;
            </button>
            
            <select
              value={month}
              onChange={handleMonthChange}
              style={{
                padding: "8px 12px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                backgroundColor: "white",
                fontSize: "14px"
              }}
            >
              {monthNames.map((name, index) => (
                <option key={name} value={index}>{name}</option>
              ))}
            </select>
            
            <select
              value={year}
              onChange={handleYearChange}
              style={{
                padding: "8px 12px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                backgroundColor: "white",
                fontSize: "14px"
              }}
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            
            <button
              onClick={handleNextMonth}
              style={{
                backgroundColor: "#e9ecef",
                border: "none",
                borderRadius: "4px",
                padding: "8px 12px",
                cursor: "pointer"
              }}
            >
              &gt;
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{
          backgroundColor: "#ffffff",
          padding: "15px 20px",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: "20px",
          display: "flex",
          gap: "20px",
          flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "20px", height: "20px", backgroundColor: "#d4edda", borderRadius: "4px" }}></div>
            <span style={{ fontSize: "14px" }}>Present</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "20px", height: "20px", backgroundColor: "#f8d7da", borderRadius: "4px" }}></div>
            <span style={{ fontSize: "14px" }}>Absent/Leave</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "20px", height: "20px", backgroundColor: "#cce5ff", borderRadius: "4px" }}></div>
            <span style={{ fontSize: "14px" }}>Half Day/Permission</span>
          </div>
        </div>

        {/* Calendar */}
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          overflow: "hidden",
          padding: "20px"
        }}>
          {loading ? (
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "300px"
            }}>
              <div style={{
                width: "30px",
                height: "30px",
                border: "3px solid #f3f3f3",
                borderTop: "3px solid #3498db",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }}></div>
            </div>
          ) : (
            <>
              {/* Days of week header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "10px",
                textAlign: "center",
                fontWeight: "bold",
                marginBottom: "10px",
                color: "#495057"
              }}>
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>
              
              {/* Calendar grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "10px"
              }}>
                {calendarDays}
              </div>
            </>
          )}
        </div>
      </main>
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

export default ViewAttendance;