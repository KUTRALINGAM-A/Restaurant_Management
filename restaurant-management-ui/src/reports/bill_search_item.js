import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BillItemLookup = () => {
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = useState("My Restaurant");
  const [userName, setUserName] = useState("User");
  const [logoUrl, setLogoUrl] = useState(null);
  const [lookupType, setLookupType] = useState("bill_to_items");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Lookup states
  const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [lookupDate, setLookupDate] = useState("");
  const [lookupResults, setLookupResults] = useState(null);
  const [menuItems, setMenuItems] = useState([]);

  // Handle navigation back to dashboard
  const handleBackToDashboard = () => {
    navigate('/restaurant-home');
  };

  useEffect(() => {
    // Fetch user and restaurant details from localStorage
    const storedName = localStorage.getItem("name");
    const storedRestaurantName = localStorage.getItem("restaurantName");
    const restaurantId = localStorage.getItem("restaurantId");
    const token = localStorage.getItem("token");

    if (storedName) setUserName(storedName);
    if (storedRestaurantName) setRestaurantName(storedRestaurantName);

    // Fetch restaurant logo
    if (restaurantId) {
      fetchRestaurantLogo(restaurantId, token);
      fetchMenuItems(restaurantId, token);
    }
  }, []);

  const fetchRestaurantLogo = async (restaurantId, token) => {
    try {
      const response = await axios.get(`http://localhost:5000/users/restaurant-logo/${restaurantId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const logoBlob = new Blob([response.data], { type: response.headers['content-type'] || 'image/png' });
      const url = URL.createObjectURL(logoBlob);
      setLogoUrl(url);
    } catch (error) {
      console.error("Error fetching logo:", error);
    }
  };

  const fetchMenuItems = async (restaurantId, token) => {
    try {
      const response = await axios.get(`http://localhost:5000/menu/items/${restaurantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenuItems(response.data);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      setError("Unable to fetch menu items");
    }
  };

  const handleLookup = async () => {
    setLoading(true);
    setError("");
    setLookupResults(null);

    try {
      const token = localStorage.getItem("token");
      const restaurantId = localStorage.getItem("restaurantId");

      if (lookupType === "bill_to_items") {
        // Lookup bill details by bill number and date (now required)
        const response = await axios.get(`http://localhost:5000/bills/details/${restaurantId}/${billNumber}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            date: billDate // Required date parameter
          }
        });
        setLookupResults(response.data);
      } else {
        // Lookup bills by item and date
        const response = await axios.get(`http://localhost:5000/bills/item-lookup/${restaurantId}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            item: selectedItem,
            date: lookupDate // Required date parameter
          }
        });
        setLookupResults(response.data);
      }
    } catch (error) {
      console.error("Lookup error:", error);
      setError(error.response?.data?.message || "Error performing lookup");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const renderLookupForm = () => {
    return (
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        padding: "30px",
        marginTop: "20px"
      }}>
        {/* Lookup Type Selector */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "25px"
        }}>
          <div style={{
            display: "flex",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            padding: "5px"
          }}>
            <button
              onClick={() => setLookupType("bill_to_items")}
              style={{
                backgroundColor: lookupType === "bill_to_items" ? "#0d6efd" : "transparent",
                color: lookupType === "bill_to_items" ? "white" : "#6c757d",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              Bill Number to Items
            </button>
            <button
              onClick={() => setLookupType("items_to_bill")}
              style={{
                backgroundColor: lookupType === "items_to_bill" ? "#0d6efd" : "transparent",
                color: lookupType === "items_to_bill" ? "white" : "#6c757d",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              Items to Bill Number
            </button>
          </div>
        </div>

        {/* Lookup Form */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px"
        }}>
          {lookupType === "bill_to_items" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ display: "flex", gap: "15px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                  <label style={{ color: "#495057", fontWeight: "600" }}>Bill Number *</label>
                  <input 
                    type="text" 
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                    placeholder="Enter Bill Number"
                    required
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #ced4da",
                      fontSize: "16px"
                    }}
                  />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                  <label style={{ color: "#495057", fontWeight: "600" }}>Bill Date *</label>
                  <input 
                    type="date" 
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    required
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #ced4da",
                      fontSize: "16px"
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ color: "#495057", fontWeight: "600" }}>Select Item *</label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  required
                  style={{
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ced4da",
                    fontSize: "16px"
                  }}
                >
                  <option value="">Select an Item</option>
                  {menuItems.map((item) => (
                    <option key={item.item_name} value={item.item_name}>
                      {item.item_name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ color: "#495057", fontWeight: "600" }}>Lookup Date *</label>
                <input 
                  type="date" 
                  value={lookupDate}
                  onChange={(e) => setLookupDate(e.target.value)}
                  required
                  style={{
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ced4da",
                    fontSize: "16px"
                  }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleLookup}
            disabled={loading || 
              (lookupType === "bill_to_items" && (!billNumber || !billDate)) ||
              (lookupType === "items_to_bill" && (!selectedItem || !lookupDate))
            }
            style={{
              backgroundColor: "#198754",
              color: "white",
              border: "none",
              padding: "12px 20px",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              fontSize: "16px",
              fontWeight: "600",
              transition: "all 0.2s ease"
            }}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>
    );
  };

  const renderLookupResults = () => {
    if (!lookupResults) return null;
  
    // Add a console log to inspect the actual structure of lookupResults
    console.log("Lookup Results:", lookupResults);
  
    return (
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        padding: "30px",
        marginTop: "20px"
      }}>
        <h3 style={{
          margin: "0 0 20px 0",
          color: "#212529",
          fontSize: "20px",
          fontWeight: "600",
          textAlign: "center"
        }}>
          {lookupType === "bill_to_items" 
            ? `Bill #${billNumber} Details` 
            : `Bills for ${selectedItem}`}
        </h3>
  
        {lookupType === "bill_to_items" ? (
          // Existing bill to items rendering code
          <div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "15px",
              marginBottom: "20px"
            }}>
              <div>
                <p style={{ margin: "0", color: "#6c757d" }}>Total Amount</p>
                <p style={{ margin: "0", fontWeight: "600", color: "#212529" }}>
                  ₹{lookupResults.total_amount || 0}
                </p>
              </div>
              <div>
                <p style={{ margin: "0", color: "#6c757d" }}>Date</p>
                <p style={{ margin: "0", fontWeight: "600", color: "#212529" }}>
                  {lookupResults.bill_date || 'N/A'}
                </p>
              </div>
            </div>
  
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "20px"
            }}>
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: "1px solid #dee2e6"
                  }}>Item</th>
                  <th style={{
                    padding: "12px",
                    textAlign: "right",
                    borderBottom: "1px solid #dee2e6"
                  }}>Quantity</th>
                  <th style={{
                    padding: "12px",
                    textAlign: "right",
                    borderBottom: "1px solid #dee2e6"
                  }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {lookupResults.items?.map((item, index) => (
                  <tr key={index}>
                    <td style={{
                      padding: "12px",
                      borderBottom: "1px solid #dee2e6"
                    }}>{item.item_name}</td>
                    <td style={{
                      padding: "12px",
                      textAlign: "right",
                      borderBottom: "1px solid #dee2e6"
                    }}>{item.quantity}</td>
                    <td style={{
                      padding: "12px",
                      textAlign: "right",
                      borderBottom: "1px solid #dee2e6"
                    }}>₹{item.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Updated items to bill rendering code
          <table style={{
            width: "100%",
            borderCollapse: "collapse"
          }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <th style={{
                  padding: "12px",
                  textAlign: "left",
                  borderBottom: "1px solid #dee2e6"
                }}>Bill Number</th>
                <th style={{
                  padding: "12px",
                  textAlign: "right",
                  borderBottom: "1px solid #dee2e6"
                }}>Date</th>
                <th style={{
                  padding: "12px",
                  textAlign: "right",
                  borderBottom: "1px solid #dee2e6"
                }}>Quantity</th>
                <th style={{
                  padding: "12px",
                  textAlign: "right",
                  borderBottom: "1px solid #dee2e6"
                }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {/* Add type check and fallback */}
              {Array.isArray(lookupResults) ? (
                lookupResults.map((bill, index) => (
                  <tr key={index}>
                    <td style={{
                      padding: "12px",
                      borderBottom: "1px solid #dee2e6"
                    }}>{bill.bill_number}</td>
                    <td style={{
                      padding: "12px",
                      textAlign: "right",
                      borderBottom: "1px solid #dee2e6"
                    }}>{bill.bill_date}</td>
                    <td style={{
                      padding: "12px",
                      textAlign: "right",
                      borderBottom: "1px solid #dee2e6"
                    }}>{bill.quantity}</td>
                    <td style={{
                      padding: "12px",
                      textAlign: "right",
                      borderBottom: "1px solid #dee2e6"
                    }}>₹{bill.subtotal}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
                    No results found or unexpected data format
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    );
  };
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

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px",
        overflowY: "auto"
      }}>
        <div style={{
          width: "100%",
          maxWidth: "900px"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px"
          }}>
            <button
              onClick={handleBackToDashboard}
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
              <span>←</span> Back to Dashboard
            </button>
            
            <h2 style={{
              fontSize: "24px",
              color: "#343a40",
              margin: "0",
              fontWeight: "600"
            }}>
              Bill & Item Lookup
            </h2>
            
            <div style={{ width: "120px" }}></div>
          </div>

          {error && (
            <div style={{
              backgroundColor: "#f8d7da",
              color: "#721c24",
              padding: "12px 20px",
              marginBottom: "20px",
              borderRadius: "4px",
              textAlign: "center"
            }}>
              {error}
            </div>
          )}

          {renderLookupForm()}
          {lookupResults && renderLookupResults()}
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

export default BillItemLookup;