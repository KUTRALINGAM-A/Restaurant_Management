import React, { useState, useEffect, useCallback } from "react";
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
  const [dataLoadedTimestamp, setDataLoadedTimestamp] = useState(null);
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

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
      // Don't set any error state here, as logo is not critical
    }
  };

  const fetchReportData = useCallback(async (restaurantId, token, startDate, endDate, timespan) => {
    setLoading(true);
    setError(""); // Clear any previous errors
    
    try {
      // Log API request details for debugging
      console.log("Fetching report data with params:", {
        restaurantId,
        timespan,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
      });
      
      // Use consistent error handling for each API call
      const fetchWithErrorHandling = async (url, params = {}) => {
        try {
          const response = await axios.get(url, {
            headers: {
              Authorization: `Bearer ${token}`
            },
            params: {
              startDate: formatDate(startDate),
              endDate: formatDate(endDate),
              ...params
            }
          });
          
          if (!response.data) throw new Error("Empty response data");
          return response.data;
        } catch (error) {
          console.error(`Error fetching from ${url}:`, error.message);
          throw error;
        }
      };
      
      // Fetch all data in parallel for better performance
      const [
        quantitiesData,
        revenuesData,
        categoryData,
        popularData,
        summaryData,
        trendData,
      ] = await Promise.all([
        fetchWithErrorHandling(`http://localhost:5000/bill_itemss/${restaurantId}`),
        fetchWithErrorHandling(`http://localhost:5000/reports/item-revenues/${restaurantId}`),
        fetchWithErrorHandling(`http://localhost:5000/reports/category-revenues/${restaurantId}`),
        fetchWithErrorHandling(`http://localhost:5000/reports/popular-items/${restaurantId}`, {
          limit: 5
        }),
        fetchWithErrorHandling(`http://localhost:5000/reports/summary/${restaurantId}`),
        fetchWithErrorHandling(`http://localhost:5000/reports/sales-trend/${restaurantId}`, {
          interval: timespan === "daily" ? "hour" : timespan === "weekly" ? "day" : "week"
        }),
      ]);
      
      // Fetch comparative data separately since it has different date parameters
      const previousStartDate = new Date(startDate);
      const previousEndDate = new Date(endDate);
      const duration = previousEndDate - previousStartDate;
      previousStartDate.setTime(previousStartDate.getTime() - duration);
      previousEndDate.setTime(previousEndDate.getTime() - duration);
      
      const compareData = await fetchWithErrorHandling(`http://localhost:5000/reports/compare/${restaurantId}`, {
        currentStartDate: formatDate(startDate),
        currentEndDate: formatDate(endDate),
        previousStartDate: formatDate(previousStartDate),
        previousEndDate: formatDate(previousEndDate),
        interval: timespan === "monthly" ? "week" : "day"
      });
      
      // Process and validate data before updating state
      const safeItemQuantities = Array.isArray(quantitiesData?.items) 
        ? quantitiesData.items 
        : [];
        
      const safeItemRevenues = Array.isArray(revenuesData?.items) 
        ? revenuesData.items 
        : [];
        
      const safeCategoryRevenues = Array.isArray(categoryData?.categories) 
        ? categoryData.categories 
        : [];
        
      const safePopularItems = Array.isArray(popularData?.items) 
        ? popularData.items 
        : [];
       
      const safeSalesTrend = Array.isArray(trendData?.trend) 
        ? trendData.trend 
        : [];
        
      const safeComparativeData = Array.isArray(compareData?.comparison) 
        ? compareData.comparison 
        : [];
      
      // Update state with validated data
      setItemQuantities(safeItemQuantities);
      setItemRevenues(safeItemRevenues);
      setCategoryRevenues(safeCategoryRevenues);
      setPopularItems(safePopularItems);
      setSalesTrend(safeSalesTrend);
      setComparativeData(safeComparativeData);
      
      // Check if there's actual data for the charts
      if (safeItemQuantities.length === 0 && safeItemRevenues.length === 0) {
        setError("No sales data found for the selected period");
      }
      
      // Process category performance data if available
      if (safeCategoryRevenues.length > 0) {
        const highestCategory = safeCategoryRevenues.reduce((prev, current) => 
          (prev.value > current.value) ? prev : current);
          
        const lowestCategory = safeCategoryRevenues.reduce((prev, current) => 
          (prev.value < current.value) ? prev : current);
          
        setPerformingCategories({
          highest: { name: highestCategory.name, revenue: highestCategory.value },
          lowest: { name: lowestCategory.name, revenue: lowestCategory.value }
        });
      }
      
      // Set summary data with safe defaults
      const summary = summaryData || {};
      setTotalRevenue(summary.totalRevenue || 0);
      setTotalItemsSold(summary.totalItemsSold || 0);
      setAverageOrderValue(summary.averageOrderValue || 0);
      setCustomerCount(summary.customerCount || 0);
      
      // Record when data was last loaded
      setDataLoadedTimestamp(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Error fetching report data:", error);
      setError("Failed to load report data. Please check server connection and try again.");
      setLoading(false);
      
      // Set empty data rather than keeping stale data
      setItemQuantities([]);
      setItemRevenues([]);
      setCategoryRevenues([]);
      setPopularItems([]);
      setSalesTrend([]);
      setComparativeData([]);
    }
  }, []);

  // Main initialization effect
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
      console.error("Initialization error:", error);
      setError("Error loading reports. Please refresh and try again.");
      setLoading(false);
    }
  }, [navigate, fetchReportData]);

  // Set up periodic refresh (every 5 minutes)
  useEffect(() => {
    const refreshInterval = 5 * 60 * 1000; // 5 minutes
    
    const refreshData = () => {
      const token = localStorage.getItem("token");
      const restaurantId = localStorage.getItem("restaurantId");
      
      if (token && restaurantId && startDate && endDate) {
        console.log("Performing scheduled data refresh");
        fetchReportData(
          restaurantId, 
          token, 
          new Date(startDate), 
          new Date(endDate), 
          timeSpan
        );
      }
    };
    
    const intervalId = setInterval(refreshData, refreshInterval);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchReportData, startDate, endDate, timeSpan]);

  const handleDateRangeChange = () => {
    const restaurantId = localStorage.getItem("restaurantId");
    const token = localStorage.getItem("token");
    
    if (startDate && endDate && restaurantId && token) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Validate date range
      if (start > end) {
        setError("Start date cannot be after end date");
        return;
      }
      
      fetchReportData(restaurantId, token, start, end, timeSpan);
    } else {
      setError("Please select valid date range");
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
  
  // Helper function to prepare chart data
  const prepareChartData = (data, keyName, valueName, limit = 6) => {
    if (!Array.isArray(data) || data.length === 0) return [];
    
    // Create a copy to avoid modifying original data
    return [...data]
      .sort((a, b) => b[valueName] - a[valueName])
      .slice(0, limit)
      .map(item => ({
        ...item,
        [valueName]: Number(item[valueName]) // Ensure values are numbers
      }));
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

  // Prepare data for charts to avoid processing in render
  const topItemsByRevenue = prepareChartData(itemRevenues, "name", "revenue");
  const topItemsByQuantity = prepareChartData(itemQuantities, "name", "quantity");

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
              {dataLoadedTimestamp && (
                <span style={{ marginLeft: "10px", fontSize: "12px" }}>
                  (Last updated: {dataLoadedTimestamp.toLocaleTimeString()})
                </span>
              )}
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

            <button
              onClick={() => navigate("/reports/bill_search_item")}
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
              Bill Details  <span style={{ fontSize: "18px" }}> → </span>
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
        
        {/* If no data is available, show a message */}
        {itemQuantities.length === 0 && itemRevenues.length === 0 && !loading && (
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            padding: "40px 20px",
            textAlign: "center"
          }}>
            <p style={{ fontSize: "18px", color: "#6c757d", marginBottom: "15px" }}>
              No data available for the selected time period
            </p>
            <button
              onClick={() => handleTimeSpanChange("monthly")}
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
              Reset to Monthly View
            </button>
          </div>
        )}
        
        {/* Overview Tab Content - Only display if we have data */}
        {activeTab === "overview" && (itemQuantities.length > 0 || itemRevenues.length > 0) && (
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
                title="Customer/Bill Count"
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
                
                {categoryRevenues.length > 0 ? (
                  <div style={{ height: "300px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryRevenues.map(category => ({
                            name: category.name, 
                            value: Number(category.value)
                          }))}
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
                        <Tooltip 
                          formatter={(value) => `₹${value.toLocaleString()}`}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p style={{ color: "#6c757d", textAlign: "center" }}>No category data available</p>
                )}
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
                  Sales Trend
                </h3>
                
                {salesTrend.length > 0 ? (
                  <div style={{ height: "300px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => `₹${value.toLocaleString()}`}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#0d6efd" 
                          name="Revenue" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p style={{ color: "#6c757d", textAlign: "center" }}>No trend data available</p>
                )}
              </div>
            </div>
            
            {/* Top Performing Items */}
            <div style={{
            backgroundColor: "white",
            marginTop: "6%", // This will push the entire box down
            borderRadius: "8px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            padding: "20px",
            marginBottom: "25px"
}}>
  {/* Rest of the code remains the same */}

              <h3 style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#212529",
                paddingTop:"20px",
                marginBottom: "20px"
              }}>
                Top Selling Items
              </h3>
              
              {topItemsByQuantity.length > 0 ? (
                <div style={{ height: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topItemsByQuantity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="item_name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="quantity" 
                        fill="#0d6efd" 
                        name="Quantity Sold" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p style={{ color: "#6c757d", textAlign: "center" }}>No item data available</p>
              )}
            </div>
          </>
        )}
        
        {/* Items Tab Content */}
        {activeTab === "items" && (
  <>
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
        padding: "20px"
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
        
        {topItemsByRevenue.length > 0 ? (
          <div style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topItemsByRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => value ? `₹${value.toLocaleString()}` : '₹0'}
                />
                <Legend />
                <Bar 
                  dataKey="revenue" 
                  fill="#198754" 
                  name="Revenue" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p style={{ color: "#6c757d", textAlign: "center" }}>No revenue data available</p>
        )}
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
          Top Items by Quantity
        </h3>
        
        {topItemsByQuantity.length > 0 ? (
          <div style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topItemsByQuantity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="item_name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, "Quantity Sold"]}
                />
                <Legend />
                <Bar 
                  dataKey="quantity" 
                  fill="#0d6efd" 
                  name="Quantity Sold" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p style={{ color: "#6c757d", textAlign: "center" }}>No quantity data available</p>
        )}
      </div>
    </div>
    
    {/* Popular Items Table */}
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
        Most Popular Items
      </h3>
      
      {popularItems.length > 0 ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse"
          }}>
            <thead>
              <tr style={{
                backgroundColor: "#f8f9fa",
                borderBottom: "2px solid #dee2e6"
              }}>
                <th style={{ padding: "12px 15px", textAlign: "left" }}>Item Name</th>
                <th style={{ padding: "12px 15px", textAlign: "right" }}>Quantity Sold</th>
                <th style={{ padding: "12px 15px", textAlign: "right" }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {popularItems.map((item, index) => (
                <tr key={index} style={{
                  borderBottom: "1px solid #dee2e6"
                }}>
                  <td style={{ padding: "12px 15px" }}>{item.name}</td>
                  <td style={{ padding: "12px 15px", textAlign: "right" }}>{item.quantity}</td>
                  <td style={{ padding: "12px 15px", textAlign: "right" }}>
                    ₹{item.value ? item.value.toLocaleString() : '0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ color: "#6c757d", textAlign: "center" }}>No popular items data available</p>
      )}
    </div>
  </>
)}
        {/* Categories Tab Content */}
        {activeTab === "categories" && (
          <>
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
                padding: "20px"
              }}>
                <h3 style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#212529",
                  marginTop: "0",
                  marginBottom: "20px"
                }}>
                  Category Performance
                </h3>
                
                {categoryRevenues.length > 0 ? (
                  <div style={{ height: "300px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryRevenues}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => `₹${value.toLocaleString()}`}
                        />
                        <Legend />
                        <Bar 
                          dataKey="value" 
                          fill="#6f42c1" 
                          name="Revenue" 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p style={{ color: "#6c757d", textAlign: "center" }}>No category data available</p>
                )}
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
                  Category Distribution
                </h3>
                
                {categoryRevenues.length > 0 ? (
                  <div style={{ height: "300px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryRevenues.map(category => ({
                            name: category.name, 
                            value: Number(category.value)
                          }))}

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
                        <Tooltip 
                          formatter={(value) => `₹${value.toLocaleString()}`}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p style={{ color: "#6c757d", textAlign: "center" }}>No category data available</p>
                )}
              </div>
            </div>
            
            {/* Category Performance Info */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "25px",
              marginBottom: "25px"
            }}>
              <div style={{
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                padding: "20px",
                borderLeft: "5px solid #198754"
              }}>
                <h4 style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#198754",
                  marginTop: "0",
                  marginBottom: "10px"
                }}>
                  Best Performing Category
                </h4>
                
                {performingCategories.highest.name ? (
                  <>
                    <h3 style={{
                      fontSize: "22px",
                      fontWeight: "700",
                      color: "#212529",
                      margin: "0 0 5px 0"
                    }}>
                      {performingCategories.highest.name}
                    </h3>
                    <p style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#198754",
                      margin: "0"
                    }}>
                      ₹{performingCategories.highest.revenue.toLocaleString()}
                    </p>
                  </>
                ) : (
                  <p style={{ color: "#6c757d" }}>No data available</p>
                )}
              </div>
              
              <div style={{
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                padding: "20px",
                borderLeft: "5px solid #dc3545"
              }}>
                <h4 style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#dc3545",
                  marginTop: "0",
                  marginBottom: "10px"
                }}>
                  Lowest Performing Category
                </h4>
                
                {performingCategories.lowest.name ? (
                  <>
                    <h3 style={{
                      fontSize: "22px",
                      fontWeight: "700",
                      color: "#212529",
                      margin: "0 0 5px 0"
                    }}>
                      {performingCategories.lowest.name}
                    </h3>
                    <p style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#dc3545",
                      margin: "0"
                    }}>
                      ₹{performingCategories.lowest.revenue.toLocaleString()}
                    </p>
                  </>
                ) : (
                  <p style={{ color: "#6c757d" }}>No data available</p>
                )}
              </div>
            </div>
          </>
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
              
              {salesTrend.length > 0 ? (
                <div style={{ height: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => `₹${value.toLocaleString()}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#0d6efd" 
                        name="Revenue" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="orders" 
                        stroke="#fd7e14" 
                        name="Orders" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p style={{ color: "#6c757d", textAlign: "center" }}>No trend data available</p>
              )}
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
                Comparative Analysis ({timeSpan})
              </h3>
              
              {comparativeData.length > 0 ? (
                <div style={{ height: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparativeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => `₹${value.toLocaleString()}`}
                      />
                      <Legend />
                      <Bar 
                        dataKey="current" 
                        fill="#0d6efd" 
                        name="Current Period" 
                      />
                      <Bar 
                        dataKey="previous" 
                        fill="#6c757d" 
                        name="Previous Period" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p style={{ color: "#6c757d", textAlign: "center" }}>No comparative data available</p>
              )}
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
        alignItems: "center",
        marginBottom: "10px"
      }}>
        <p style={{
          margin: "0",
          fontSize: "14px",
          color: "#6c757d"
        }}>
          {title}
        </p>
        <span style={{
          fontSize: "24px",
          backgroundColor: `${color}20`,
          color: color,
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          {icon}
        </span>
      </div>
      
      <h3 style={{
        fontSize: "24px",
        fontWeight: "700",
        color: "#212529",
        margin: "0 0 10px 0"
      }}>
        {value}
      </h3>
      
      <p style={{
        margin: "0",
        fontSize: "14px",
        fontWeight: "500",
        color: isPositive ? "#198754" : "#dc3545"
      }}>
        {change} vs. previous period
      </p>
    </div>
  );
};

export default BillReports;