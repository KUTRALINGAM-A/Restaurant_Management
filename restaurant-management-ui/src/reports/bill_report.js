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
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalItemsSold, setTotalItemsSold] = useState(0);
  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [salesTrend, setSalesTrend] = useState([]);
  const [comparativeData, setComparativeData] = useState([]);

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
      if (restaurantId) {
        fetchReportData(restaurantId, token, start, end, "monthly");
      }
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

  const fetchReportData = async (restaurantId, token, startDate, endDate, timespan) => {
    setLoading(true);
    try {
      // Fetch itemQuantities - count of items sold grouped by item
      const quantitiesResponse = await axios.get(`http://localhost:5000/bill_itemss/${restaurantId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          startDate: formatDate(startDate),
          endDate: formatDate(endDate)
        }
      });
      
      // Fetch itemRevenues - revenue for each item
      const revenuesResponse = await axios.get(`http://localhost:5000/reports/item-revenues/${restaurantId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          startDate: formatDate(startDate),
          endDate: formatDate(endDate)
        }
      });
      
      // Fetch categoryRevenues - revenue grouped by category
      const categoryResponse = await axios.get(`http://localhost:5000/reports/category-revenues/${restaurantId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          startDate: formatDate(startDate),
          endDate: formatDate(endDate)
        }
      });
      
      // Fetch popular items - top selling items by quantity
      const popularResponse = await axios.get(`http://localhost:5000/reports/popular-items/${restaurantId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          limit: 5
        }
      });
      
      // Fetch summary metrics
      const summaryResponse = await axios.get(`http://localhost:5000/reports/summary/${restaurantId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          startDate: formatDate(startDate),
          endDate: formatDate(endDate)
        }
      });
      
      // Fetch sales trend data
      const trendResponse = await axios.get(`http://localhost:5000/reports/sales-trend/${restaurantId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          interval: timespan === "daily" ? "hour" : timespan === "weekly" ? "day" : "week"
        }
      });
      
      // Fetch comparative data (current vs previous period)
      const previousStartDate = new Date(startDate);
      const previousEndDate = new Date(endDate);
      const duration = previousEndDate - previousStartDate;
      previousStartDate.setTime(previousStartDate.getTime() - duration);
      previousEndDate.setTime(previousEndDate.getTime() - duration);
      
      const compareResponse = await axios.get(`http://localhost:5000/reports/compare/${restaurantId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          currentStartDate: formatDate(startDate),
          currentEndDate: formatDate(endDate),
          previousStartDate: formatDate(previousStartDate),
          previousEndDate: formatDate(previousEndDate),
          interval: timespan === "monthly" ? "week" : "day"
        }
      });
      
      // Process and set data from responses
      setItemQuantities(quantitiesResponse.data.items || []);
      setItemRevenues(revenuesResponse.data.items || []);
      setCategoryRevenues(categoryResponse.data.categories || []);
      setPopularItems(popularResponse.data.items || []);
      
      const categories = categoryResponse.data.categories || [];
      if (categories.length > 0) {
        // Find highest and lowest performing categories
        const highestCategory = categories.reduce((prev, current) => 
          (prev.value > current.value) ? prev : current);
          
        const lowestCategory = categories.reduce((prev, current) => 
          (prev.value < current.value) ? prev : current);
          
        setPerformingCategories({
          highest: { name: highestCategory.name, revenue: highestCategory.value },
          lowest: { name: lowestCategory.name, revenue: lowestCategory.value }
        });
      }
      
      // Set summary data
      const summary = summaryResponse.data;
      setTotalRevenue(summary.totalRevenue || 0);
      setTotalItemsSold(summary.totalItemsSold || 0);
      setAverageOrderValue(summary.averageOrderValue || 0);
      setCustomerCount(summary.customerCount || 0);
      
      // Set trend and comparative data
      setSalesTrend(trendResponse.data.trend || []);
      setComparativeData(compareResponse.data.comparison || []);
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Error fetching report data");
      setLoading(false);
    }
  };

  const handleDateRangeChange = () => {
    const restaurantId = localStorage.getItem("restaurantId");
    const token = localStorage.getItem("token");
    
    if (startDate && endDate && restaurantId && token) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      fetchReportData(restaurantId, token, start, end, timeSpan);
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
      fetchReportData(restaurantId, token, start, end, span);
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
              onClick={() => navigate("/billinghome")}
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
                value={`₹${totalRevenue.toLocaleString()}`}
                icon="💰"
                color="#0d6efd"
                change="+12.5%"
                isPositive={true}
              />
              
              <MetricCard
                title="Total Items Sold"
                value={totalItemsSold.toLocaleString()}
                icon="📦"
                color="#198754"
                change="+8.3%"
                isPositive={true}
              />
              
              <MetricCard
                title="Average Order Value"
                value={`₹${averageOrderValue.toLocaleString()}`}
                icon="📊"
                color="#fd7e14"
                change="-2.1%"
                isPositive={false}
              />
              
              <MetricCard
                title="Customer Count"
                value={customerCount.toLocaleString()}
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
                Item Sales by Quantity
              </h3>
              
              <div style={{ height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={itemQuantities.sort((a, b) => b.quantity - a.quantity).slice(0, 6)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="quantity" fill="#198754" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
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
          </div>
        )}
        
        {/* Categories Tab Content */}
        {activeTab === "categories" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
            gap: "25px"
          }}>
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
            </div>
            
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
                Category Comparison
              </h3>
              
              <div style={{ height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryRevenues}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                    <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                    <Bar dataKey="value" fill="#6f42c1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
                Sales Trend
              </h3>
              
              <div style={{ height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={salesTrend}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                    <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#0d6efd" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="orders" stroke="#dc3545" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
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
                Period Comparison
              </h3>
              
              <div style={{ height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparativeData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
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

// Helper component for metric cards
const MetricCard = ({ title, value, icon, color, change, isPositive }) => {
  return (
    <div style={{
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
      padding: "20px",
      display: "flex",
      flexDirection: "column"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "15px"
      }}>
        <div>
          <p style={{
            margin: "0",
            fontSize: "14px",
            color: "#6c757d"
          }}>
            {title}
          </p>
          <h4 style={{
            margin: "8px 0 0 0",
            fontSize: "24px",
            fontWeight: "600",
            color: "#212529"
          }}>
            {value}
          </h4>
        </div>
        
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "8px",
          backgroundColor: `${color}20`,
          color: color,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "20px"
        }}>
          {icon}
        </div>
      </div>
      
      <div style={{
        backgroundColor: isPositive ? "#19875420" : "#dc354520",
        color: isPositive ? "#198754" : "#dc3545",
        alignSelf: "flex-start",
        padding: "5px 10px",
        borderRadius: "4px",
        fontSize: "13px",
        fontWeight: "500",
        display: "flex",
        alignItems: "center",
        gap: "3px"
      }}>
        <span>{isPositive ? "↑" : "↓"}</span>
        {change} vs previous
      </div>
    </div>
  );
};

export default BillReports;