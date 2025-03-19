import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const MarkAttendance = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [restaurantName, setRestaurantName] = useState("My Restaurant");
  const [markAllAs, setMarkAllAs] = useState("");
  const [remarks, setRemarks] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Function to handle API errors and display them properly
  const getErrorMessage = (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return `Server error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`;
    } else if (error.request) {
      // The request was made but no response was received
      return "No response from server. Please check your connection.";
    } else {
      // Something happened in setting up the request that triggered an Error
      return `Error: ${error.message}`;
    }
  };

  useEffect(() => {
    // Check for token and restaurant ID
    const token = localStorage.getItem("token");
    const restaurantId = localStorage.getItem("restaurantId");
    const storedRestaurantName = localStorage.getItem("restaurantName");

    if (!token || !restaurantId) {
      navigate("/");
      return;
    }

    if (storedRestaurantName) {
      setRestaurantName(storedRestaurantName);
    }

    // Check if attendance exists for today
    const checkAttendance = async () => {
      try {
        const attendanceResponse = await axios.get(
          `http://localhost:5000/employees/attendance/${restaurantId}/${date}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        if (attendanceResponse.data.success && attendanceResponse.data.attendance.length > 0) {
          setSubmitSuccess(true);
          setTimeout(() => {
            setSubmitSuccess(false);
          }, 3000);
        }
      } catch (err) {
        console.error("Error checking attendance:", err);
        // Don't set error here, just log it
      }
    };

    // Define fetchEmployees inside useEffect to avoid dependency issues
    const fetchEmployees = async () => {
      try {
        // API endpoint to get employees
        const response = await axios.get(
          `http://localhost:5000/employees/${restaurantId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        // Check if response data is an array
        const employeeData = Array.isArray(response.data) ? response.data : [];
        
        // Initialize attendance status for all employees as "present"
        const employeesWithAttendance = employeeData.map(emp => ({
          ...emp,
          attendanceStatus: "present"
        }));
        
        setEmployees(employeesWithAttendance);
        setLoading(false);
        
        // Check if attendance exists for today
        checkAttendance();
      } catch (err) {
        console.error("Error fetching employees:", err);
        setError(`Failed to load employees: ${getErrorMessage(err)}`);
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [navigate, date]); // Added date to dependency array to refresh when date changes

  const handleAttendanceChange = (employeeId, status) => {
    setEmployees(employees.map(emp => 
      emp.id === employeeId ? { ...emp, attendanceStatus: status } : emp
    ));
  };

  const handleRemarkChange = (employeeId, value) => {
    setRemarks({
      ...remarks,
      [employeeId]: value
    });
  };

  const handleMarkAll = (status) => {
    if (!status) return;
    
    setEmployees(employees.map(emp => ({
      ...emp,
      attendanceStatus: status
    })));
    
    setMarkAllAs("");
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(""); // Clear any previous errors
      
      const token = localStorage.getItem("token");
      const restaurantId = localStorage.getItem("restaurantId");
      
      if (!token || !restaurantId) {
        navigate("/");
        return;
      }
      
      const attendanceData = employees.map(emp => ({
        employeeId: emp.id,
        employeeName: emp.name,
        employeeRole: emp.role || "staff", // Ensure role is never null/undefined
        date: date,
        status: emp.attendanceStatus,
        remarks: remarks[emp.id] || ""
      }));
      
      // Submit attendance data - make sure this matches the backend route
      await axios.post(
        `http://localhost:5000/employees/attendance/${restaurantId}`,
        { attendanceData },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setSubmitSuccess(true);
      setSubmitting(false);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Error submitting attendance:", err);
      setError(`Failed to submit attendance: ${getErrorMessage(err)}`);
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate("/attendance/attendance_home");
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
          <p style={{ color: "#495057", fontWeight: "500" }}>Loading employees...</p>
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
      minHeight: "100vh",
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
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px"
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
              padding: "0"
            }}
          >
            ←
          </button>
          <h1 style={{ 
            margin: "0",
            fontSize: "20px",
            fontWeight: "600",
            color: "#212529"
          }}>
            Mark Attendance - {restaurantName}
          </h1>
        </div>
        
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "15px"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <label htmlFor="date" style={{ fontSize: "14px", color: "#495057" }}>Date:</label>
            <input 
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                padding: "6px 10px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                fontSize: "14px"
              }}
            />
          </div>
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
        
        {/* Success message */}
        {submitSuccess && (
          <div style={{
            backgroundColor: "#d4edda",
            color: "#155724",
            padding: "12px 20px",
            marginBottom: "20px",
            borderRadius: "4px",
            textAlign: "center",
            fontWeight: "500"
          }}>
            Attendance marked successfully!
          </div>
        )}

        {/* Bulk actions */}
        <div style={{
          backgroundColor: "#ffffff",
          padding: "15px 20px",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h2 style={{ 
              margin: "0",
              fontSize: "16px", 
              fontWeight: "600",
              color: "#343a40" 
            }}>
              Employees: {employees.length}
            </h2>
          </div>
          
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <label htmlFor="markAll" style={{ fontSize: "14px", color: "#495057" }}>Mark all as:</label>
            <select
              id="markAll"
              value={markAllAs}
              onChange={(e) => handleMarkAll(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                backgroundColor: "white",
                fontSize: "14px",
                cursor: "pointer"
              }}
            >
              <option value="">Select...</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="leave">On Leave</option>
              <option value="halfday">Half Day</option>
            </select>
          </div>
        </div>

        {/* Employee list */}
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          overflow: "hidden"
        }}>
          {/* Table header */}
          <div style={{
            padding: "15px 20px",
            borderBottom: "1px solid #e9ecef",
            display: "grid",
            gridTemplateColumns: "50px 1fr 120px 200px 150px 1fr",
            gap: "15px",
            fontWeight: "600",
            color: "#495057"
          }}>
            <div>S.No</div>
            <div>Employee Name</div>
            <div>Role</div>
            <div>Email</div>
            <div>Status</div>
            <div>Remarks</div>
          </div>

          {/* Employee rows */}
          {employees.length === 0 ? (
            <div style={{
              padding: "30px 20px",
              textAlign: "center",
              color: "#6c757d"
            }}>
              No employees found
            </div>
          ) : (
            employees.map((employee, index) => (
              <div key={employee.id} style={{
                padding: "15px 20px",
                borderBottom: "1px solid #e9ecef",
                display: "grid",
                gridTemplateColumns: "50px 1fr 120px 200px 150px 1fr",
                gap: "15px",
                backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa"
              }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {index + 1}
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {employee.name}
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {employee.role || "staff"}
                </div>
                <div style={{ display: "flex", alignItems: "center", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {employee.email}
                </div>
                <div>
                  <select
                    value={employee.attendanceStatus}
                    onChange={(e) => handleAttendanceChange(employee.id, e.target.value)}
                    style={{
                        padding: "8px 12px",
                        border: "1px solid #ced4da",
                        borderRadius: "4px",
                        backgroundColor: "white",
                        fontSize: "14px",
                        width: "100%"
                      }}
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="leave">On Leave</option>
                      <option value="halfday">Half Day</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Add remarks"
                      value={remarks[employee.id] || ""}
                      onChange={(e) => handleRemarkChange(employee.id, e.target.value)}
                      style={{
                        padding: "8px 12px",
                        border: "1px solid #ced4da",
                        borderRadius: "4px",
                        width: "100%",
                        fontSize: "14px"
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={{
  display: "flex",
  justifyContent: "center",
  marginTop: "20px",
  marginBottom: "20px"
}}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              backgroundColor: "#0d6efd",
              color: "white",
              border: "none",
              borderRadius: "4px",
              padding: "10px 20px",
              fontWeight: "500",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? "0.7" : "1",
              transition: "background-color 0.2s",
            }}
          >
            {submitting ? "Submitting..." : "Submit Attendance"}
          </button>
          </div>
        </main>
  
        {/* Footer/Submit button */}
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
  
  export default MarkAttendance;