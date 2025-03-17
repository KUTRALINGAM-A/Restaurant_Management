import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BillingPage = () => {
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = useState("My Restaurant");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [logoUrl, setLogoUrl] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [billNumber, setBillNumber] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [printMode, setPrintMode] = useState(false);
  const [billDate, setBillDate] = useState(new Date());

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
      
      // Fetch restaurant logo and menu items
      const restaurantId = localStorage.getItem("restaurantId");
      
      if (restaurantId) {
        fetchRestaurantLogo(restaurantId, token);
        fetchMenuItems(restaurantId, token);
        fetchTodayBillCount(restaurantId, token);
      } else {
        setLoading(false);
        setError("Restaurant ID not found");
      }
    } catch (error) {
      setError("Error loading menu items");
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
    } catch (error) {
      console.error("Error fetching restaurant logo:", error);
      // Don't set an error state here as the logo is not critical
    }
  };

  const fetchMenuItems = async (restaurantId, token) => {
    try {
      const response = await axios.get(`http://localhost:5000/menu_${restaurantId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Map the response data to match the expected format
      const formattedMenuItems = response.data.map(item => ({
        _id: item.id,
        name: item.item_name,
        description: item.description,
        price: item.price,
        category: item.category,
        available: item.available
      }));
      
      setMenuItems(formattedMenuItems);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(formattedMenuItems.map(item => item.category))];
      setCategories(uniqueCategories);
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      if (error.response) {
        setError(`Error fetching menu items: ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        setError("Network error - server might be down");
      } else {
        setError(`Error: ${error.message}`);
      }
      setLoading(false);
    }
  };

  const fetchTodayBillCount = async (restaurantId, token) => {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      const response = await axios.get(`http://localhost:5000/bills/count/${restaurantId}?date=${today}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Set bill number to the count + 1
      setBillNumber(response.data.count + 1);
    } catch (error) {
      console.error("Error fetching bill count:", error);
      // Default to 1 if error occurs
      setBillNumber(1);
    }
  };
  
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };
  
  const handleBackToMenu = () => {
    navigate("/billing/CURD_menu");
  };

  // Filter items based on search term and category
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item) => {
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(cartItem => cartItem._id === item._id);
    
    if (existingItemIndex !== -1) {
      // If item exists, update quantity
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      updatedCart[existingItemIndex].subtotal = updatedCart[existingItemIndex].quantity * updatedCart[existingItemIndex].price;
      setCart(updatedCart);
    } else {
      // If item does not exist, add it with quantity 1
      setCart([...cart, { 
        ...item, 
        quantity: 1,
        subtotal: item.price
      }]);
    }
    
    // Update total amount
    setTotalAmount(prevTotal => prevTotal + parseFloat(item.price));
  };

  const removeFromCart = (itemId) => {
    const itemIndex = cart.findIndex(item => item._id === itemId);
    if (itemIndex === -1) return;
    
    const updatedCart = [...cart];
    const item = updatedCart[itemIndex];
    
    if (item.quantity > 1) {
      // If quantity > 1, decrease quantity
      updatedCart[itemIndex].quantity -= 1;
      updatedCart[itemIndex].subtotal = updatedCart[itemIndex].quantity * updatedCart[itemIndex].price;
      setCart(updatedCart);
    } else {
      // If quantity = 1, remove item from cart
      updatedCart.splice(itemIndex, 1);
      setCart(updatedCart);
    }
    
    // Update total amount
    setTotalAmount(prevTotal => prevTotal - parseFloat(item.price));
  };

  const clearCart = () => {
    setCart([]);
    setTotalAmount(0);
    setCustomerName("");
    setCustomerPhone("");
    setPaymentMethod("Cash");
  };

  const handlePrintBill = async () => {
    try {
      // Prepare bill data
      const billData = {
        restaurant_id: localStorage.getItem("restaurantId"),
        bill_number: billNumber,
        bill_date: billDate.toISOString(),
        employee_name: userName,
        customer_name: customerName,
        customer_phone: customerPhone,
        payment_method: paymentMethod,
        items: cart.map(item => ({
          item_id: item._id,
          item_name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal
        })),
        total_amount: totalAmount
      };

      const token = localStorage.getItem("token");
      
      // Save bill to database
      await axios.post(`http://localhost:5000/bills`, billData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Set success message
      setSuccess("Bill saved successfully!");
      
      // Switch to print mode
      setPrintMode(true);
      
      // After a short delay, trigger print
      setTimeout(() => {
        window.print();
        
        // Reset after print
        setTimeout(() => {
          setPrintMode(false);
          // Increment bill number for next bill
          setBillNumber(prevNumber => prevNumber + 1);
          // Clear cart
          clearCart();
        }, 1000);
      }, 500);
    } catch (error) {
      console.error("Error saving bill:", error);
      setError("Failed to save bill: " + (error.response?.data?.message || error.message));
    }
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
          <p style={{ color: "#495057", fontWeight: "500" }}>Loading billing page...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @media print {
            .no-print {
              display: none !important;
            }
            .print-only {
              display: block !important;
            }
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
      {/* Header - Hide during print */}
      <header className={printMode ? "no-print" : ""} style={{
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

      {/* Main content */}
      <main style={{
        flex: 1,
        padding: "20px"
      }}>
        <div style={{
          width: "100%",
          maxWidth: "1400px",
          margin: "0 auto"
        }}>
          {/* Page header - Hide during print */}
          <div className={printMode ? "no-print" : ""} style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px"
          }}>
            <button
               onClick={() => navigate("/restaurant-home")}
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
             ← Back
            
            </button>
            
            <h2 style={{
              margin: "0",
              fontSize: "24px",
              fontWeight: "600",
              color: "#212529"
            }}>
              Create New Bill
            </h2>
          </div>
          
          {/* Error and success messages */}
          {error && (
            <div style={{
              backgroundColor: "#f8d7da",
              color: "#721c24",
              padding: "10px 15px",
              borderRadius: "4px",
              marginBottom: "20px",
              border: "1px solid #f5c6cb"
            }}>
              {error}
            </div>
          )}
          
          {success && (
            <div style={{
              backgroundColor: "#d4edda",
              color: "#155724",
              padding: "10px 15px",
              borderRadius: "4px",
              marginBottom: "20px",
              border: "1px solid #c3e6cb"
            }}>
              {success}
            </div>
          )}
          
          {/* Main grid layout */}
          <div style={{
            display: "grid",
            gridTemplateColumns: printMode ? "1fr" : "1fr 400px",
            gap: "20px"
          }}>
            {/* Menu items section - Hide during print */}
            <div className={printMode ? "no-print" : ""} style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}>
              {/* Search and filter controls */}
              <div style={{
                display: "flex",
                gap: "15px",
                flexWrap: "wrap"
              }}>
                {/* Search box */}
                <div style={{
                  flex: "1",
                  minWidth: "250px",
                }}>
                  <input 
                    type="text"
                    placeholder="Search menu items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 15px",
                      borderRadius: "4px",
                      border: "1px solid #ced4da",
                      fontSize: "15px"
                    }}
                  />
                </div>
                
                {/* Category filter */}
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                      padding: "10px 15px",
                      borderRadius: "4px",
                      border: "1px solid #ced4da",
                      backgroundColor: "#ffffff",
                      fontSize: "15px",
                      minWidth: "150px"
                    }}
                  >
                    <option value="All">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div style={{
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
  gap: "15px",
  overflow: "auto",
  maxHeight: "60vh"
}}>
  {/* Add this style tag to define hover effects */}
  <style>
    {`
      .menu-item-card {
        background-color: #ffffff;
        border: 1px solid #e9ecef;
        border-radius: 6px;
        padding: 15px;
        display: flex;
        flex-direction: column;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      
      .menu-item-card.available {
        cursor: pointer;
        opacity: 1;
      }
      
      .menu-item-card.unavailable {
        background-color: #f8f9fa;
        cursor: not-allowed;
        opacity: 0.6;
      }
      
      .menu-item-card.available:hover {
        transform: translateY(-3px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }
    `}
  </style>

  {filteredItems.length > 0 ? (
    filteredItems.map(item => (
      <div
        key={item._id}
        onClick={() => item.available ? addToCart(item) : null}
        className={`menu-item-card ${item.available ? 'available' : 'unavailable'}`}
      >
        <h3 style={{
          margin: "0 0 5px 0",
          fontSize: "16px",
          fontWeight: "600",
          color: "#212529"
        }}>
          {item.name}
        </h3>
        <p style={{
          margin: "0 0 10px 0",
          fontSize: "13px",
          color: "#6c757d",
          flexGrow: 1
        }}>
          {item.description.length > 50 
            ? `${item.description.substring(0, 50)}...` 
            : item.description}
        </p>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span style={{
            fontWeight: "600", 
            color: "#0d6efd"
          }}>
            ₹{parseFloat(item.price).toFixed(2)}
          </span>
          <span style={{
            fontSize: "12px",
            padding: "3px 6px",
            borderRadius: "3px",
            backgroundColor: "#e9ecef",
            color: "#495057"
          }}>
            {item.category}
          </span>
        </div>
      </div>
    ))
  ) : (
    <div style={{
      gridColumn: "1 / -1",
      padding: "30px",
      textAlign: "center",
      color: "#6c757d"
    }}>
      No menu items found.
    </div>
  )}
</div>
            </div>
            
            {/* Cart and Billing section */}
            <div style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              padding: printMode ? "0" : "20px",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              gridColumn: printMode ? "1 / -1" : "auto"
            }}>
              {/* Print version header - Show only during print */}
              {printMode && (
                <div className="print-only" style={{
                  display: printMode ? "block" : "none",
                  marginBottom: "20px",
                  textAlign: "center"
                }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "15px",
                    marginBottom: "10px"
                  }}>
                    {logoUrl && (
                      <img 
                        src={logoUrl} 
                        alt={`${restaurantName} Logo`} 
                        style={{
                          maxWidth: "80px",
                          maxHeight: "80px"
                        }} 
                      />
                    )}
                    <h1 style={{
                      margin: "0",
                      fontSize: "24px",
                      fontWeight: "600"
                    }}>
                      {restaurantName}
                    </h1>
                  </div>
                  <p style={{ margin: "5px 0" }}>Bill Number: {billNumber}</p>
                  <p style={{ margin: "5px 0" }}>Date: {billDate.toLocaleDateString()}</p>
                  <p style={{ margin: "5px 0" }}>Time: {billDate.toLocaleTimeString()}</p>
                  <div style={{ margin: "15px 0", borderBottom: "1px dashed #ccc" }}></div>
                </div>
              )}
              
              {/* Bill information */}
              <div style={printMode ? { marginBottom: "15px" } : {}}>
                <h3 style={{
                  margin: "0 0 15px 0",
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#212529",
                  display: printMode ? "none" : "block"
                }}>
                  Bill Information
                </h3>
                
                <div style={{
                  display: "grid",
                  gridTemplateColumns: printMode ? "1fr" : "1fr 1fr",
                  gap: "10px",
                  marginBottom: "15px"
                }}>
                  <div>
                    <label style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "14px",
                      color: "#495057"
                    }}>
                      Bill Number
                    </label>
                    <div style={{
                      padding: printMode ? "0" : "8px 10px",
                      border: printMode ? "none" : "1px solid #ced4da",
                      borderRadius: "4px",
                      backgroundColor: printMode ? "transparent" : "#f8f9fa",
                      fontSize: "15px"
                    }}>
                      {billNumber}
                    </div>
                  </div>
                  
                  <div>
                    <label style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "14px",
                      color: "#495057"
                    }}>
                      Date
                    </label>
                    <div style={{
                      padding: printMode ? "0" : "8px 10px",
                      border: printMode ? "none" : "1px solid #ced4da",
                      borderRadius: "4px",
                      backgroundColor: printMode ? "transparent" : "#f8f9fa",
                      fontSize: "15px"
                    }}>
                      {billDate.toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className={printMode ? "no-print" : ""}>
                    <label style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "14px",
                      color: "#495057"
                    }}>
                      Customer Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "4px",
                        border: "1px solid #ced4da",
                        fontSize: "15px"
                      }}
                      placeholder="Enter customer name"
                    />
                  </div>
                  
                  <div className={printMode ? "no-print" : ""}>
                    <label style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "14px",
                      color: "#495057"
                    }}>
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "4px",
                        border: "1px solid #ced4da",
                        fontSize: "15px"
                      }}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                
                {/* Customer details for print */}
                {printMode && customerName && (
                  <div style={{ margin: "10px 0" }}>
                    <p style={{ margin: "5px 0" }}>Customer: {customerName}</p>
                    {customerPhone && <p style={{ margin: "5px 0" }}>Phone: {customerPhone}</p>}
                  </div>
                )}
              </div>
              
              {/* Cart items */}
              <div style={{ flex: 1 }}>
                <h3 style={{
                  margin: "0 0 15px 0",
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#212529",
                  display: printMode ? "none" : "block"
                }}>
                  Cart Items
                </h3>
                
                {/* Cart table */}
                <table style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "15px"
                }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #dee2e6" }}>
                      <th style={{
                        textAlign: "left",
                        padding: "8px 5px",
                        fontWeight: "600",
                        color: "#495057"
                      }}>
                        Item
                      </th>
                      <th style={{
                        textAlign: "center",
                        padding: "8px 5px",
                        fontWeight: "600",
                        color: "#495057"
                      }}>
                        Price
                      </th>
                      <th style={{
                        textAlign: "center",
                        padding: "8px 5px",
                        fontWeight: "600",
                        color: "#495057"
                      }}>
                        Qty
                      </th>
                      <th style={{
                        textAlign: "right",
                        padding: "8px 5px",
                        fontWeight: "600",
                        color: "#495057"
                      }}>
                        Subtotal
                      </th>
                      <th className={printMode ? "no-print" : ""} style={{
                        textAlign: "center",
                        padding: "8px 5px",
                        fontWeight: "600",
                        color: "#495057",
                        width: "50px"
                      }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.length > 0 ? (
                      cart.map(item => (
                        <tr key={item._id} style={{ borderBottom: "1px solid #dee2e6" }}>
                          <td style={{ padding: "10px 5px" }}>
                            {item.name}
                          </td>
                          <td style={{ 
                            padding: "10px 5px",
                            textAlign: "center" 
                          }}>
                            ₹{parseFloat(item.price).toFixed(2)}
                          </td>
                          <td style={{ 
                            padding: "10px 5px",
                            textAlign: "center" 
                          }}>
                            {item.quantity}
                          </td>
                          <td style={{ 
                            padding: "10px 5px",
                            textAlign: "right",
                            fontWeight: "500"
                          }}>
                            ₹{parseFloat(item.subtotal).toFixed(2)}
                          </td>
                          <td className={printMode ? "no-print" : ""} style={{ 
                            padding: "10px 5px",
                            textAlign: "center" 
                          }}>
                            <button
                              onClick={() => removeFromCart(item._id)}
                              style={{
                                backgroundColor: "#dc3545",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                padding: "5px 8px",
                                cursor: "pointer",
                                fontSize: "12px"
                              }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ 
                          padding: "20px",
                          textAlign: "center",
                          color: "#6c757d"
                        }}>
                          No items in cart
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" style={{ 
                        padding: "15px 5px",
                        textAlign: "right",
                        fontWeight: "600"
                      }}>
                        Total:
                      </td>
                      <td style={{ 
                        padding: "15px 5px",
                        textAlign: "right",
                        fontWeight: "700",
                        fontSize: "18px",
                        color: "#0d6efd"
                      }}>
                        ₹{totalAmount.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              {/* Payment method selection - Hide during print */}
              <div className={printMode ? "no-print" : ""}>
                <h3 style={{
                  margin: "15px 0",
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#212529"
                }}>
                  Payment Method
                </h3>
                
                <div style={{
                  display: "flex",
                  gap: "10px"
                }}>
                  {["Cash", "Card", "UPI", "Other"].map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      style={{
                        backgroundColor: paymentMethod === method ? "#0d6efd" : "#e9ecef",
                        color: paymentMethod === method ? "white" : "#495057",
                        border: "none",
                        borderRadius: "4px",
                        padding: "8px 16px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Payment method info in print mode */}
              {printMode && (
                <div style={{ margin: "15px 0" }}>
                  <p style={{ margin: "5px 0" }}>Payment Method: {paymentMethod}</p>
                  <p style={{ margin: "5px 0" }}>Served by: {userName}</p>
                </div>
              )}
              
              {/* Action buttons - Hide during print */}
              <div className={printMode ? "no-print" : ""} style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "20px"
              }}>
                <button
                  onClick={clearCart}
                  style={{
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "10px 20px",
                    cursor: "pointer",
                    fontSize: "15px",
                    fontWeight: "500",
                    transition: "all 0.2s ease"
                  }}
                  disabled={cart.length === 0}
                >
                  Clear Cart
                </button>
                
                <button
                  onClick={handlePrintBill}
                  style={{
                    backgroundColor: "#0d6efd",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "10px 20px",
                    cursor: "pointer",
                    fontSize: "15px",
                    fontWeight: "500",
                    transition: "all 0.2s ease"
                  }}
                  disabled={cart.length === 0}
                >
                  Save & Print Bill
                </button>
              </div>
              
              {/* Thank you message - Show only in print mode */}
              {printMode && (
                <div style={{ 
                  margin: "30px 0 20px",
                  textAlign: "center",
                  borderTop: "1px dashed #ccc",
                  paddingTop: "20px"
                }}>
                  <p style={{ 
                    margin: "5px 0",
                    fontSize: "16px",
                    fontWeight: "500"
                  }}>
                    Thank you for your visit!
                  </p>
                  <p style={{ margin: "5px 0" }}>Please visit again.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer - Hide during print */}
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

export default BillingPage;