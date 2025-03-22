import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Chart components
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const BillReports = () => {
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = useState("My Restaurant");
  const [userName, setUserName] = useState("User");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logoUrl, setLogoUrl] = useState(null);
  
  // Report data states
  const [timeSpan, setTimeSpan] = useState("monthly");
  const [itemQuantities, setItemQuantities] = useState([]);
  const [itemRevenues, setItemRevenues] = useState([]);
  const [categoryRevenues, setCategoryRevenues] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [performingCategories, setPerformingCategories] = useState({
    highest: { name: "", revenue: 0 },
    lowest: { name: "", revenue: 0 }
  });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

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
      }

      // Set default date range (last 30 days)
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      setEndDate(formatDate(end));
      setStartDate(formatDate(start));
      
      // Fetch report data
      fetchReportData(restaurantId, token);
    } catch (error) {
      setError("Error loading reports");
      setLoading(false);
    }
  }, [navigate]);

  // Format date for input fields
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

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

  const fetchReportData = async (restaurantId, token) => {
    setLoading(true);
    try {
      // In a real application, these would be actual API calls
      // For demonstration, we'll use sample data
      
      // Simulating API response delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Sample data for demonstration
      const sampleItemQuantities = [
        { name: 'Chicken Biryani', quantity: 156 },
        { name: 'Butter Naan', quantity: 230 },
        { name: 'Veg Manchurian', quantity: 120 },
        { name: 'Paneer Tikka', quantity: 98 },
        { name: 'Chocolate Cake', quantity: 75 },
        { name: 'Mango Lassi', quantity: 185 }
      ];
      
      const sampleItemRevenues = [
        { name: 'Chicken Biryani', revenue: 31200 },
        { name: 'Butter Naan', revenue: 11500 },
        { name: 'Veg Manchurian', revenue: 14400 },
        { name: 'Paneer Tikka', revenue: 19600 },
        { name: 'Chocolate Cake', revenue: 15000 },
        { name: 'Mango Lassi', revenue: 9250 }
      ];
      
      const sampleCategoryRevenues = [
        { name: 'Main Course', value: 65000 },
        { name: 'Appetizers', value: 34000 },
        { name: 'Breads', value: 21500 },
        { name: 'Beverages', value: 18700 },
        { name: 'Desserts', value: 25000 }
      ];
      
      const samplePopularItems = [
        { name: 'Butter Naan', quantity: 230, percentage: 24 },
        { name: 'Mango Lassi', quantity: 185, percentage: 19 },
        { name: 'Chicken Biryani', quantity: 156, percentage: 16 },
        { name: 'Veg Manchurian', quantity: 120, percentage: 12 },
        { name: 'Paneer Tikka', quantity: 98, percentage: 10 },
      ];
      
      // Set the data states
      setItemQuantities(sampleItemQuantities);
      setItemRevenues(sampleItemRevenues);
      setCategoryRevenues(sampleCategoryRevenues);
      setPopularItems(samplePopularItems);
      
      // Set highest and lowest performing categories
      const highestCategory = sampleCategoryRevenues.reduce((prev, current) => 
        (prev.value > current.value) ? prev : current);
        
      const lowestCategory = sampleCategoryRevenues.reduce((prev, current) => 
        (prev.value < current.value) ? prev : current);
        
      setPerformingCategories({
        highest: { name: highestCategory.name, revenue: highestCategory.value },
        lowest: { name: lowestCategory.name, revenue: lowestCategory.value }
      });
      
      setLoading(false);
    } catch (error) {
      setError("Error fetching report data");
      setLoading(false);
    }
  };

  const handleDateRangeChange = () => {
    const restaurantId = localStorage.getItem("restaurantId");
    const token = localStorage.getItem("token");
    
    if (startDate && endDate && restaurantId && token) {
      fetchReportData(restaurantId, token);
    }
  };

  const handleTimeSpanChange = (span) => {
    setTimeSpan(span);
    
    // Calculate date range based on selected time span
    const end = new Date();
    const start = new Date();
    
    switch(span) {
      case "daily":
        start.setDate(start.getDate() - 1);
        break;
      case "weekly":
        start.setDate(start.getDate() - 7);
        break;
      case "monthly":
        start.setDate(start.getDate() - 30);
        break;
      case "yearly":
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setDate(start.getDate() - 30);
    }
    
    setEndDate(formatDate(end));
    setStartDate(formatDate(start));
    
    const restaurantId = localStorage.getItem("restaurantId");
    const token = localStorage.getItem("token");
    
    if (restaurantId && token) {
      fetchReportData(restaurantId, token);
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
          <p style={{ color: "#495057", fontWeight: "500" }}>Loading reports...</p>
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
          maxWidth: "1200px",
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
        padding: "30px 20px",
        maxWidth: "1200px",
        margin: "0 auto",
        width: "100%"
      }}>
        {/* Report Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
          flexWrap: "wrap",
          gap: "15px"
        }}>
          <div>
            <h2 style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#212529",
              margin: "0 0 8px 0"
            }}>
              Sales & Revenue Reports
            </h2>
            <p style={{
              fontSize: "14px",
              color: "#6c757d",
              margin: "0"
            }}>
              Analyze your restaurant's performance and identify growth opportunities
            </p>
          </div>
          
          <div style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap"
          }}>
            <button
              onClick={() => navigate("/restauranthome")}
              style={{
                backgroundColor: "transparent",
                color: "#6c757d",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                padding: "8px 16px",
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <span style={{ fontSize: "18px" }}>←</span> Dashboard
            </button>
            
            <button
              onClick={() => {
                /* Export functionality would go here */
                alert("Export functionality would be implemented here");
              }}
              style={{
                backgroundColor: "#198754",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "8px 16px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <span style={{ fontSize: "18px" }}>↓</span> Export
            </button>
          </div>
        </div>
        
        {/* Time Period Selector */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          padding: "20px",
          marginBottom: "25px"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px"
          }}>
            <div style={{
              display: "flex",
              gap: "10px"
            }}>
              {["daily", "weekly", "monthly", "yearly"].map(span => (
                <button
                  key={span}
                  onClick={() => handleTimeSpanChange(span)}
                  style={{
                    backgroundColor: timeSpan === span ? "#0d6efd" : "white",
                    color: timeSpan === span ? "white" : "#495057",
                    border: `1px solid ${timeSpan === span ? "#0d6efd" : "#dee2e6"}`,
                    borderRadius: "4px",
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontWeight: timeSpan === span ? "500" : "normal",
                    transition: "all 0.2s ease"
                  }}
                >
                  {span.charAt(0).toUpperCase() + span.slice(1)}
                </button>
              ))}
            </div>
            
            <div style={{
              display: "flex",
              gap: "10px",
              alignItems: "center"
            }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  border: "1px solid #dee2e6",
                  borderRadius: "4px",
                  padding: "8px 12px",
                  fontSize: "14px"
                }}
              />
              <span style={{ color: "#6c757d" }}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  border: "1px solid #dee2e6",
                  borderRadius: "4px",
                  padding: "8px 12px",
                  fontSize: "14px"
                }}
              />
              <button
                onClick={handleDateRangeChange}
                style={{
                  backgroundColor: "#0d6efd",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
        
        {/* Report Tabs */}
        <div style={{
          display: "flex",
          borderBottom: "1px solid #dee2e6",
          marginBottom: "25px"
        }}>
          {["overview", "items", "categories", "trends"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                backgroundColor: "transparent",
                border: "none",
                borderBottom: activeTab === tab ? "3px solid #0d6efd" : "none",
                color: activeTab === tab ? "#0d6efd" : "#6c757d",
                fontWeight: activeTab === tab ? "600" : "normal",
                padding: "12px 20px",
                cursor: "pointer",
                fontSize: "15px",
                transition: "all 0.2s ease"
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Overview Tab Content */}
        {activeTab === "overview" && (
          <>
            {/* Key Metrics */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
              marginBottom: "25px"
            }}>
              <MetricCard
                title="Total Revenue"
                value={`₹${categoryRevenues.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}`}
                icon="💰"
                color="#0d6efd"
                change="+12.5%"
                isPositive={true}
              />
              
              <MetricCard
                title="Total Items Sold"
                value={itemQuantities.reduce((acc, curr) => acc + curr.quantity, 0).toLocaleString()}
                icon="📦"
                color="#198754"
                change="+8.3%"
                isPositive={true}
              />
              
              <MetricCard
                title="Average Order Value"
                value="₹458"
                icon="📊"
                color="#fd7e14"
                change="-2.1%"
                isPositive={false}
              />
              
              <MetricCard
                title="Customer Count"
                value="1,285"
                icon="👥"
                color="#6f42c1"
                change="+5.7%"
                isPositive={true}
              />
            </div>
            
            {/* Category Performance */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
              gap: "25px",
              marginBottom: "25px"
            }}>
              <div style={{
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                padding: "20px",
                height: "100%"
              }}>
                <h3 style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#212529",
                  marginTop: "0",
                  marginBottom: "20px"
                }}>
                  Category Revenue
                </h3>
                
                <div style={{ height: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryRevenues}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryRevenues.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "20px",
                  padding: "15px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "6px"
                }}>
                  <div>
                    <p style={{ margin: "0", fontSize: "14px", color: "#6c757d" }}>
                      Highest Performing
                    </p>
                    <p style={{ margin: "5px 0 0 0", fontWeight: "600", color: "#198754" }}>
                      {performingCategories.highest.name}
                      <span style={{ marginLeft: "5px", fontSize: "14px" }}>
                        (₹{performingCategories.highest.revenue.toLocaleString()})
                      </span>
                    </p>
                  </div>
                  
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: "0", fontSize: "14px", color: "#6c757d" }}>
                      Lowest Performing
                    </p>
                    <p style={{ margin: "5px 0 0 0", fontWeight: "600", color: "#dc3545" }}>
                      {performingCategories.lowest.name}
                      <span style={{ marginLeft: "5px", fontSize: "14px" }}>
                        (₹{performingCategories.lowest.revenue.toLocaleString()})
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div style={{
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                padding: "20px",
                height: "100%"
              }}>
                <h3 style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#212529",
                  marginTop: "0",
                  marginBottom: "20px"
                }}>
                  Popular Orders
                </h3>
                
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px"
                }}>
                  {popularItems.map((item, index) => (
                    <div 
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "12px 15px",
                        backgroundColor: index % 2 === 0 ? "#f8f9fa" : "white",
                        borderRadius: "6px"
                      }}
                    >
                      <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: COLORS[index % COLORS.length] + "20",
                        color: COLORS[index % COLORS.length],
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        fontWeight: "bold",
                        fontSize: "16px",
                        marginRight: "15px"
                      }}>
                        {index + 1}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0", fontWeight: "500" }}>{item.name}</p>
                        <p style={{ margin: "3px 0 0 0", fontSize: "14px", color: "#6c757d" }}>
                          {item.quantity} units sold
                        </p>
                      </div>
                      
                      <div style={{
                        backgroundColor: "#0d6efd10",
                        color: "#0d6efd",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "14px",
                        fontWeight: "500"
                      }}>
                        {item.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Item Sales and Revenue */}
            <div style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              padding: "20px",
              marginBottom: "25px"
            }}>
              <h3 style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#212529",
                marginTop: "0",
                marginBottom: "20px"
              }}>
                Top Items by Revenue
              </h3>
              
              <div style={{ height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={itemRevenues.sort((a, b) => b.revenue - a.revenue).slice(0, 6)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                    <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                    <Bar dataKey="revenue" fill="#0d6efd" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
        
        {/* Items Tab Content */}
        {activeTab === "items" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
            gap: "25px"
          }}>
            <div style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              padding: "20px"
            }}>
              <h3 style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#212529",
                marginTop: "0",
                marginBottom: "20px"
              }}>
                Items by Quantity Sold
              </h3>
              
              <div style={{ height: "400px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={itemQuantities.sort((a, b) => b.quantity - a.quantity)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Bar dataKey="quantity" fill="#198754" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              padding: "20px"
            }}>
              <h3 style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#212529",
                marginTop: "0",
                marginBottom: "20px"
              }}>
                Items by Revenue
              </h3>
              
              <div style={{ height: "400px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={itemRevenues.sort((a, b) => b.revenue - a.revenue)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `₹${value / 1000}k`} />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                    <Bar dataKey="revenue" fill="#0d6efd" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
        
        {/* Categories Tab Content */}
        {activeTab === "categories" && (
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            padding: "20px"
          }}>
            <h3 style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#212529",
              marginTop: "0",
              marginBottom: "20px"
            }}>
              Category Revenue Distribution
            </h3>
            
            <div style={{ height: "400px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryRevenues}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={160}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value, percent }) => `${name}: ₹${value.toLocaleString()} (${(percent * 100).toFixed(1)}%)`}
                  >
                    {categoryRevenues.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{
              marginTop: "20px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "15px"
            }}>
              {categoryRevenues.map((category, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: "#f8f9fa",
                    borderRadius: "6px",
                    padding: "15px",
                    borderLeft: `4px solid ${COLORS[index % COLORS.length]}`
                  }}
                >
                  <p style={{
                    margin: "0 0 5px 0",
                    fontWeight: "600",
                    color: "#212529"
                  }}>
                    {category.name}
                  </p>
                  <p style={{
                    margin: "0",
                    color: "#495057",
                    fontSize: "18px",
                    fontWeight: "500"
                  }}>
                    ₹{category.value.toLocaleString()}
                  </p>
                  <p style={{
                    margin: "5px 0 0 0",
                    fontSize: "14px",
                    color: "#6c757d"
                  }}>
                    {((category.value / categoryRevenues.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(1)}% of total
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Trends Tab Content */}
        {activeTab === "trends" && (
          <>
            <div style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              padding: "20px",
              marginBottom: "25px"
            }}>
              <h3 style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#212529",
                marginTop: "0",
                marginBottom: "20px"
              }}>
                Revenue Trend
              </h3>
              
              <div style={{ height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { name: 'Day 1', revenue: 19500 },
                      { name: 'Day 2', revenue: 21400 },
                      { name: 'Day 3', revenue: 18900 },
                      { name: 'Day 4', revenue: 23200 },
                      { name: 'Day 5', revenue: 25600 },
                      { name: 'Day 6', revenue: 29800 },
                      { name: 'Day 7', revenue: 32500 },
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                    <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                    <Line type="monotone" dataKey="revenue" stroke="#0d6efd" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              padding: "20px"
            }}>
              <h3 style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#212529",
                marginTop: "0",
                marginBottom: "20px"
              }}>
                Sales Comparison
              </h3>
              
              <div style={{ height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Week 1', current: 89500, previous: 78200 },
                      { name: 'Week 2', current: 92300, previous: 85400 },
                      { name: 'Week 3', current: 98700, previous: 94100 },
                      { name: 'Week 4', current: 105600, previous: 97800 },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                    <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="current" name="Current Period" fill="#0d6efd" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="previous" name="Previous Period" fill="#6c757d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </main>
      
      {/* Footer */}
      <footer style={{
        padding: "20px",
        textAlign: "center",
        borderTop: "1px solid #dee2e6",
        backgroundColor: "white",
        color: "#6c757d",
        fontSize: "14px"
      }}>
        <p style={{ margin: "0" }}>
          © {new Date().getFullYear()} {restaurantName} - Restaurant Management System
        </p>
      </footer>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, icon, color, change, isPositive }) => {
  return (
    <div style={{
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
      padding: "20px"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "15px"
      }}>
        <h4 style={{
          fontSize: "16px",
          fontWeight: "500",
          color: "#6c757d",
          margin: "0"
        }}>
          {title}
        </h4>
        
        <div style={{
          width: "40px",
          height: "40px",
          backgroundColor: `${color}20`,
          borderRadius: "8px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "20px"
        }}>
          {icon}
        </div>
      </div>
      
      <p style={{
        fontSize: "24px",
        fontWeight: "700",
        color: "#212529",
        margin: "0 0 10px 0"
      }}>
        {value}
      </p>
      
      <div style={{
        display: "inline-block",
        padding: "4px 8px",
        borderRadius: "4px",
        backgroundColor: isPositive ? "#19875420" : "#dc354520",
        color: isPositive ? "#198754" : "#dc3545",
        fontSize: "14px",
        fontWeight: "500"
      }}>
        {change} {isPositive ? "↑" : "↓"} 
      </div>
    </div>
  );
};

export default BillReports;