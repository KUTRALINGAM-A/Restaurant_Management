import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const EditMenu = () => {
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
  const [editItem, setEditItem] = useState(null);

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
      // Fix: Use the correct API path to match your Express routes
      const response = await axios.get(`http://localhost:5000/menu_${restaurantId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("Menu API response:", response.data);
      
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
      // Provide more specific error message
      if (error.response) {
        console.log("Error response:", error.response);
        setError(`Error fetching menu items: ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        setError("Network error - server might be down");
      } else {
        setError(`Error: ${error.message}`);
      }
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };
  
  const handleBackToMenuManagement = () => {
    navigate("/billing/CURD_menu");
  };

  const handleEditClick = (item) => {
    setEditItem({...item});
  };

  const handleCancelEdit = () => {
    setEditItem(null);
    setSuccess("");
    setError("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditItem({
      ...editItem,
      [name]: name === "price" ? (value === '' ? '' : parseFloat(value)) : value
    });
  };

  const handleUpdateItem = async () => {
    try {
      const token = localStorage.getItem("token");
      const restaurantId = localStorage.getItem("restaurantId");
      
      if (!token || !restaurantId) {
        navigate("/");
        return;
      }
  
      // Convert from React data format to API format
      const apiItem = {
        item_name: editItem.name,
        description: editItem.description,
        price: editItem.price,
        category: editItem.category,
        available: true // Assuming default value if not present in your form
      };
  
      // Fix: Use the correct API path to match your Express routes
      await axios.put(`http://localhost:5000/menu_${restaurantId}/${editItem._id}`, apiItem, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      // Update the item in the local state
      setMenuItems(menuItems.map(item => 
        item._id === editItem._id ? editItem : item
      ));
  
      setSuccess("Menu item updated successfully!");
      setTimeout(() => {
        setEditItem(null);
        setSuccess("");
      }, 2000);
    } catch (error) {
      console.error("Error updating menu item:", error);
      setError("Failed to update menu item: " + (error.response?.data?.message || error.message));
    }
  };

  // Filter items based on search term and category
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.price.includes(searchTerm);
    
    return matchesCategory && matchesSearch;
  });

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
          <p style={{ color: "#495057", fontWeight: "500" }}>Loading menu items...</p>
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

      {/* Main content */}
      <main style={{
        flex: 1,
        padding: "30px 20px"
      }}>
        <div style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          {/* Page header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px"
          }}>
            <button
              onClick={handleBackToMenuManagement}
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
              <span>←</span> Back to Menu Management
            </button>
            
            <h2 style={{
              fontSize: "24px",
              color: "#343a40",
              margin: "0",
              fontWeight: "600"
            }}>
              Edit Menu Items
            </h2>
            
            <div style={{ width: "120px" }}></div> {/* Empty div for spacing */}
          </div>

          {/* Notifications */}
          {error && (
            <div style={{
              backgroundColor: "#f8d7da",
              color: "#721c24",
              padding: "12px 20px",
              margin: "0 0 20px",
              borderRadius: "4px",
              textAlign: "center",
              fontWeight: "500",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              backgroundColor: "#d4edda",
              color: "#155724",
              padding: "12px 20px",
              margin: "0 0 20px",
              borderRadius: "4px",
              textAlign: "center",
              fontWeight: "500",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              {success}
            </div>
          )}

          {/* Search and filter section */}
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            padding: "20px",
            marginBottom: "25px"
          }}>
            <div style={{
              display: "flex",
              gap: "20px",
              flexWrap: "wrap"
            }}>
              {/* Search */}
              <div style={{
                flex: "1",
                minWidth: "250px"
              }}>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  color: "#495057",
                  fontWeight: "500"
                }}>
                  Search Items
                </label>
                <input
                  type="text"
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 15px",
                    borderRadius: "4px",
                    border: "1px solid #ced4da",
                    fontSize: "15px",
                    color: "#495057",
                    backgroundColor: "#fff",
                    transition: "border-color 0.15s ease-in-out",
                    outline: "none"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#86b7fe";
                    e.target.style.boxShadow = "0 0 0 0.25rem rgba(13, 110, 253, 0.25)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#ced4da";
                    e.target.style.boxShadow = "none";
                  }}
                />
                              </div>
                              
                              {/* Category filter */}
                              <div style={{
                                minWidth: "200px"
                              }}>
                                <label style={{
                                  display: "block",
                                  marginBottom: "8px",
                                  fontSize: "14px",
                                  color: "#495057",
                                  fontWeight: "500"
                                }}>
                                  Filter by Category
                                </label>
                                <select
                                  value={selectedCategory}
                                  onChange={(e) => setSelectedCategory(e.target.value)}
                                  style={{
                                    width: "100%",
                                    padding: "10px 15px",
                                    borderRadius: "4px",
                                    border: "1px solid #ced4da",
                                    fontSize: "15px",
                                    color: "#495057",
                                    backgroundColor: "#fff",
                                    transition: "border-color 0.15s ease-in-out",
                                    outline: "none",
                                    cursor: "pointer"
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.borderColor = "#86b7fe";
                                    e.target.style.boxShadow = "0 0 0 0.25rem rgba(13, 110, 253, 0.25)";
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.borderColor = "#ced4da";
                                    e.target.style.boxShadow = "none";
                                  }}
                                >
                                  <option value="All">All Categories</option>
                                  {categories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                
                          {/* Menu items list */}
                          {filteredItems.length === 0 ? (
                            <div style={{
                              backgroundColor: "#ffffff",
                              borderRadius: "8px",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                              padding: "30px 20px",
                              textAlign: "center",
                              color: "#6c757d"
                            }}>
                              <p style={{
                                fontSize: "16px",
                                margin: "0"
                              }}>
                                No menu items found matching your search criteria.
                              </p>
                            </div>
                          ) : (
                            <div style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                              gap: "20px"
                            }}>
                              {filteredItems.map(item => (
                                <div key={item._id} style={{
                                  backgroundColor: "#ffffff",
                                  borderRadius: "8px",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                  padding: "20px",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "15px"
                                }}>
                                  <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start"
                                  }}>
                                    <div>
                                      <h3 style={{
                                        margin: "0 0 5px",
                                        fontSize: "18px",
                                        fontWeight: "600",
                                        color: "#212529"
                                      }}>
                                        {item.name}
                                      </h3>
                                      <span style={{
                                        fontSize: "14px",
                                        color: "#6c757d",
                                        backgroundColor: "#e9ecef",
                                        padding: "3px 8px",
                                        borderRadius: "4px",
                                        display: "inline-block"
                                      }}>
                                        {item.category}
                                      </span>
                                    </div>
                                    <span style={{
                                      fontSize: "18px",
                                      fontWeight: "600",
                                      color: "#343a40"
                                    }}>
                                       ₹{(typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price || 0).toFixed(2))}
                                    </span>
                                  </div>
                
                                  <p style={{
                                    margin: "0",
                                    color: "#6c757d",
                                    fontSize: "15px",
                                    lineHeight: "1.5"
                                  }}>
                                    {item.description}
                                  </p>
                
                                  <div style={{
                                    marginTop: "auto",
                                    display: "flex",
                                    justifyContent: "flex-end"
                                  }}>
                                    <button
                                      onClick={() => handleEditClick(item)}
                                      style={{
                                        backgroundColor: "#0d6efd",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        padding: "8px 16px",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        transition: "all 0.2s ease"
                                      }}
                                      onMouseOver={(e) => {
                                        e.target.style.backgroundColor = "#0b5ed7";
                                      }}
                                      onMouseOut={(e) => {
                                        e.target.style.backgroundColor = "#0d6efd";
                                      }}
                                    >
                                      Edit Item
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </main>
                
                      {/* Edit Item Modal */}
                      {editItem && (
                        <div style={{
                          position: "fixed",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: "rgba(0,0,0,0.6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 1000,
                          padding: "20px"
                        }}>
                          <div style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "8px",
                            width: "100%",
                            maxWidth: "500px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            padding: "25px"
                          }}>
                            <h3 style={{
                              margin: "0 0 20px",
                              fontSize: "20px",
                              fontWeight: "600"
                            }}>
                              Edit Menu Item
                            </h3>
                            
                            {/* Form fields */}
                            <div style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "20px"
                            }}>
                              {/* Item name */}
                              <div>
                                <label style={{
                                  display: "block",
                                  marginBottom: "8px",
                                  fontSize: "14px",
                                  color: "#495057",
                                  fontWeight: "500"
                                }}>
                                  Item Name
                                </label>
                                <input
                                  type="text"
                                  name="name"
                                  value={editItem.name}
                                  onChange={handleInputChange}
                                  style={{
                                    width: "100%",
                                    padding: "10px 4px",
                                    borderRadius: "4px",
                                    border: "1px solid #ced4da",
                                    fontSize: "15px"
                                  }}
                                />
                              </div>
                              
                              {/* Description */}
                              <div>
                                <label style={{
                                  display: "block",
                                  marginBottom: "8px",
                                  fontSize: "14px",
                                  color: "#495057",
                                  fontWeight: "500"
                                }}>
                                  Description
                                </label>
                                <textarea
                                  name="description"
                                  value={editItem.description}
                                  onChange={handleInputChange}
                                  style={{
                                    width: "100%",
                                    padding: "10px 4px",
                                    borderRadius: "4px",
                                    border: "1px solid #ced4da",
                                    fontSize: "15px",
                                    minHeight: "100px",
                                    resize: "vertical"
                                  }}
                                />
                              </div>
                              
                              {/* Price and Category in a row */}
                              <div style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "15px"
                              }}>
                                <div>
                                  <label style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontSize: "14px",
                                    color: "#495057",
                                    fontWeight: "500"
                                  }}>
                                    Price (₹)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    name="price"
                                    value={editItem.price}
                                    onChange={handleInputChange}
                                    style={{
                                      width: "100%",
                                      padding: "10px 15px",
                                      borderRadius: "4px",
                                      border: "1px solid #ced4da",
                                      fontSize: "15px"
                                    }}
                                  />
                                </div>
                                
                                <div>
                                  <label style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontSize: "14px",
                                    color: "#495057",
                                    fontWeight: "500"
                                  }}>
                                    Category
                                  </label>
                                  <select
                                    name="category"
                                    value={editItem.category}
                                    onChange={handleInputChange}
                                    style={{
                                      width: "100%",
                                      padding: "10px 15px",
                                      borderRadius: "4px",
                                      border: "1px solid #ced4da",
                                      fontSize: "15px",
                                      backgroundColor: "#fff"
                                    }}
                                  >
                                    {categories.map(category => (
                                      <option key={category} value={category}>
                                        {category}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              
                              {/* Buttons */}
                              <div style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "10px",
                                marginTop: "10px"
                              }}>
                                <button
                                  onClick={handleCancelEdit}
                                  style={{
                                    backgroundColor: "#6c757d",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    padding: "10px 16px",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight: "500"
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleUpdateItem}
                                  style={{
                                    backgroundColor: "#28a745",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    padding: "10px 16px",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight: "500"
                                  }}
                                >
                                  Update Item
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
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
                
                export default EditMenu;