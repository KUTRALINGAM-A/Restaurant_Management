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
      
      // Just send data to the server without handling the response
      // This will send the data but not require any action from the frontend
      axios.post(`http://localhost:5000/bills`, billData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      // Set success message
      setSuccess("Bill data sent successfully!");
      
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
      console.error("Error sending bill data:", error);
      setError("Failed to send bill data: " + (error.response?.data?.message || error.message));
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
            body * {
              visibility: hidden;
            }
            
            .print-only, .print-only * {
              visibility: visible;
            }
            
            .no-print {
              display: none !important;
            }
            
            @page {
              size: 57mm auto;
              margin: 0;
            }
            
            .print-only {
              position: absolute;
              left: 0;
              top: 0;
              width: 57mm;
            }
            
            .print-only * {
              color: black !important;
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
                  width: "57mm",
                  margin: "0 auto",
                  fontFamily: "monospace",
                  fontSize: "10px"
                }}>
                  {/* Restaurant name in larger font */}
                  <div style={{
                    textAlign: "center",
                    marginBottom: "5px",
                    fontWeight: "bold",
                    fontSize: "14px"
                  }}>
                    {restaurantName}
                  </div>
                  
                  {/* Date and bill number on same line */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "5px"
                  }}>
                    <span>Date: {billDate.toLocaleDateString()}</span>
                    <span>Bill #: {billNumber}</span>
                  </div>


                    {/* Payment method */}
                    <div style={{ marginTop: "5px" }}>
                    <span>Payment Method: {paymentMethod}</span>
                  </div>


                   {/* Server name */}
                   <div style={{ marginTop: "5px" }}>
                    <span>Served by: {userName}</span>
                  </div>
                  
                  {/* Separator line */}
                  <div style={{ borderTop: "1px dashed #000", marginBottom: "5px" }}></div>
                  
                  {/* Items header */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: "bold",
                    marginBottom: "3px"
                  }}>
                    <span style={{ width: "50%" }}>Item</span>
                    <span style={{ width: "15%", textAlign: "center" }}>Qty</span>
                    <span style={{ width: "35%", textAlign: "right" }}>Price</span>
                  </div>
                  
                  {/* Items list */}
                  {cart.map(item => (
                    <div key={item._id} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "2px"
                    }}>
                      <span style={{ width: "50%", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.name}
                      </span>
                      <span style={{ width: "15%", textAlign: "center" }}>
                        {item.quantity}
                      </span>
                      <span style={{ width: "35%", textAlign: "right" }}>
                        ₹{parseFloat(item.subtotal).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  
                  {/* Separator line */}
                  <div style={{ borderTop: "1px dashed #000", margin: "5px 0" }}></div>
                  
                  {/* Total amount */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: "bold",
                    marginBottom: "5px"
                  }}>
                    <span>Total:</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                  </div>
                  
                  {/* Payment method */}
                  <div style={{ marginTop: "5px" }}>
                    <span>Payment Method: {paymentMethod}</span>
                  </div>
                  
                  {/* Customer details if available */}
                  {customerName && (
                    <div>
                      <span>Customer: {customerName}</span>
                      {customerPhone && <div>Phone: {customerPhone}</div>}
                    </div>
                  )}
                  
                 
                  
                  {/* Separator line */}
                  <div style={{ borderTop: "1px dashed #000", margin: "10px 0 5px" }}></div>
                  
                  {/* Thank you message */}
                  <div style={{ 
                    textAlign: "center",
                    marginTop: "10px"
                  }}>
                    <div>Thank you for your visit!</div>
                    <div>Please visit again.</div>
                  </div>
                  
                  {/* Footer */}
                  <div style={{ 
                    textAlign: "center",
                    marginTop: "10px",
                    fontSize: "9px"
                  }}>
                    A product of Flamingoes
                  </div>
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
                
                <div style={{
                  border: printMode ? "none" : "1px solid #dee2e6",
                  borderRadius: "4px",
                  maxHeight: "300px",
                  overflow: "auto"
                }}>
                  {cart.length > 0 ? (
                    <table style={{
                      width: "100%",
                      borderCollapse: "collapse"
                    }}>
                      <thead style={{ display: printMode ? "none" : "table-header-group" }}>
                        <tr>
                          <th style={{
                            padding: "10px",
                            textAlign: "left",
                            borderBottom: "1px solid #dee2e6",
                            fontSize: "14px",
                            color: "#495057"
                          }}>
                            Item
                          </th>
                          <th style={{
                            padding: "10px",
                            textAlign: "center",
                            borderBottom: "1px solid #dee2e6",
                            fontSize: "14px",
                            color: "#495057",
                            width: "80px"
                          }}>
                            Qty
                          </th>
                          <th style={{
                            padding: "10px",
                            textAlign: "right",
                            borderBottom: "1px solid #dee2e6",
                            fontSize: "14px",
                            color: "#495057",
                            width: "100px"
                          }}>
                            Price
                          </th>
                          <th style={{
                            padding: "10px",
                            textAlign: "right",
                            borderBottom: "1px solid #dee2e6",
                            fontSize: "14px",
                            color: "#495057",
                            width: "100px"
                          }}>
                            Subtotal
                          </th>
                          <th style={{
                            padding: "10px",
                            textAlign: "center",
                            borderBottom: "1px solid #dee2e6",
                            fontSize: "14px",
                            color: "#495057",
                            width: "50px"
                          }}>
                            
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map(item => (
                          <tr key={item._id}>
                            <td style={{
                              padding: printMode ? "4px" : "10px",
                              borderBottom: printMode ? "none" : "1px solid #dee2e6",
                              fontSize: printMode ? "12px" : "15px"
                            }}>
                              {item.name}
                            </td>
                            <td style={{
                              padding: printMode ? "4px" : "10px",
                              textAlign: "center",
                              borderBottom: printMode ? "none" : "1px solid #dee2e6",
                              fontSize: printMode ? "12px" : "15px"
                            }}>
                              {printMode ? (
                                item.quantity
                              ) : (
                                <div style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "5px"
                                }}>
                                  <button
                                    onClick={() => removeFromCart(item._id)}
                                    style={{
                                      width: "24px",
                                      height: "24px",
                                      display: "flex",
                                      justifyContent: "center",
                                      alignItems: "center",
                                      backgroundColor: "#f8f9fa",
                                      border: "1px solid #dee2e6",
                                      borderRadius: "3px",
                                      cursor: "pointer",
                                      color: "#6c757d",
                                      fontSize: "14px",
                                      fontWeight: "bold"
                                    }}
                                  >
                                    -
                                  </button>
                                  <span>{item.quantity}</span>
                                  <button
                                    onClick={() => addToCart(item)}
                                    style={{
                                      width: "24px",
                                      height: "24px",
                                      display: "flex",
                                      justifyContent: "center",
                                      alignItems: "center",
                                      backgroundColor: "#f8f9fa",
                                      border: "1px solid #dee2e6",
                                      borderRadius: "3px",
                                      cursor: "pointer",
                                      color: "#6c757d",
                                      fontSize: "14px",
                                      fontWeight: "bold"
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </td>
                            <td style={{
                              padding: printMode ? "4px" : "10px",
                              textAlign: "right",
                              borderBottom: printMode ? "none" : "1px solid #dee2e6",
                              fontSize: printMode ? "12px" : "15px"
                            }}>
                              ₹{parseFloat(item.price).toFixed(2)}
                            </td>
                            <td style={{
                              padding: printMode ? "4px" : "10px",
                              textAlign: "right",
                              borderBottom: printMode ? "none" : "1px solid #dee2e6",
                              fontWeight: "500",
                              fontSize: printMode ? "12px" : "15px"
                            }}>
                              ₹{parseFloat(item.subtotal).toFixed(2)}
                            </td>
                            <td className={printMode ? "no-print" : ""} style={{
                              padding: "10px",
                              textAlign: "center",
                              borderBottom: "1px solid #dee2e6"
                            }}>
                              <button
                                onClick={() => {
                                  const updatedCart = cart.filter(cartItem => cartItem._id !== item._id);
                                  setCart(updatedCart);
                                  setTotalAmount(prevTotal => prevTotal - parseFloat(item.subtotal));
                                }}
                                style={{
                                  backgroundColor: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "#dc3545",
                                  fontSize: "14px"
                                }}
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#6c757d"
                    }}>
                      Your cart is empty. Add items from the menu.
                    </div>
                  )}
                </div>
              </div>
              
              {/* Payment section */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                marginTop: "15px"
              }}>
                {/* Payment method - Hide during print */}
                <div className={printMode ? "no-print" : ""}>
                  <label style={{
                    display: "block",
                    marginBottom: "5px",
                    fontSize: "14px",
                    color: "#495057"
                  }}>
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "4px",
                      border: "1px solid #ced4da",
                      fontSize: "15px"
                    }}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                {/* Total amount */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: printMode ? "5px 0" : "12px",
                  backgroundColor: printMode ? "transparent" : "#f8f9fa",
                  borderRadius: "4px",
                  border: printMode ? "none" : "1px solid #dee2e6"
                }}>
                  <span style={{
                    fontSize: printMode ? "14px" : "16px",
                    fontWeight: "600",
                    color: "#212529"
                  }}>
                    Total Amount:
                  </span>
                  <span style={{
                    fontSize: printMode ? "14px" : "20px",
                    fontWeight: "700",
                    color: "#0d6efd"
                  }}>
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>
                
                {/* Action buttons */}
                <div className={printMode ? "no-print" : ""} style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "5px"
                }}>
                  <button
                    onClick={clearCart}
                    style={{
                      flex: "1",
                      backgroundColor: "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "10px",
                      cursor: "pointer",
                      fontSize: "15px",
                      fontWeight: "500",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "5px"
                    }}
                  >
                    Clear
                  </button>
                  
                  <button
                    onClick={handlePrintBill}
                    disabled={cart.length === 0}
                    style={{
                      flex: "2",
                      backgroundColor: cart.length === 0 ? "#a9d6a9" : "#198754",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "10px",
                      cursor: cart.length === 0 ? "not-allowed" : "pointer",
                      fontSize: "15px",
                      fontWeight: "500",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    Print Bill
                  </button>
                </div>
              </div>
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

export default BillingPage;