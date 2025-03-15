import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const DeleteMenuItem = () => {
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = useState("My Restaurant");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");
  const [logoUrl, setLogoUrl] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

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
      
      // Fetch restaurant logo, menu items and categories
      const restaurantId = localStorage.getItem("restaurantId");
      
      if (restaurantId) {
        fetchRestaurantLogo(restaurantId, token);
        fetchMenuItems(restaurantId, token);
        fetchCategories(restaurantId, token);
      } else {
        setLoading(false);
      }
    } catch (error) {
      setError("Error loading page");
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
      setLoading(false);
    } catch (error) {
      console.error("Error fetching logo:", error);
      setLoading(false);
    }
  };

  const fetchMenuItems = async (restaurantId, token) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/menu_${restaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setMenuItems(response.data);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      setError("Failed to load menu items. Please try again.");
      setLoading(false);
    }
  };

  const fetchCategories = async (restaurantId, token) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/menu_${restaurantId}/category`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      // Transform category objects into format expected by component
      const categoryObjects = response.data.map(category => ({
        _id: category,
        name: category
      }));
      setCategories(categoryObjects);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Failed to load menu categories. Please try again.");
    }
  };
  
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };
  
  const handleBackToMenuManagement = () => {
    navigate("/billing/CURD_menu");
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleDeleteClick = (itemId) => {
    setConfirmDelete(itemId);
  };

  const confirmDeleteItem = async () => {
    if (!confirmDelete) return;
    
    try {
      const token = localStorage.getItem("token");
      const restaurantId = localStorage.getItem("restaurantId");
      
      if (!token || !restaurantId) {
        setError("Authentication error. Please log in again.");
        navigate("/");
        return;
      }

      

      
      
      // Remove the item from the local state
      setMenuItems(menuItems.filter(item => item.id !== confirmDelete));
      
      // Show success message
      setSuccessMessage("Menu item deleted successfully!");
      
      // Clear the confirmation
      setConfirmDelete(null);
      
      // Scroll to top to see success message
      window.scrollTo(0, 0);
      
    } catch (error) {
      console.error("Error deleting menu item:", error);
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("Failed to delete menu item. Please try again.");
      }
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  // Filter menu items based on search and category
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Format price
  const formatPrice = (price) => {
    return parseFloat(price).toFixed(2);
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
          <p style={{ color: "#495057", fontWeight: "500" }}>Loading...</p>
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
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
        display: "flex",
        justifyContent: "center",
        padding: "20px",
      }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
            width: "100%",
            maxWidth: "900px",
            overflow: "hidden",
          }}
        >
          {/* Header section */}
          <div style={{
            padding: "25px 30px",
            borderBottom: "1px solid #e9ecef",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <button
              onClick={handleBackToMenuManagement}
              style={{
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "10px 14px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "background-color 0.2s ease"
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = "#5a6268";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "#6c757d";
              }}
            >
              <span>←</span> Back
            </button>
            
            <div style={{ textAlign: "center" }}>
              <h1 style={{ 
                margin: "0",
                fontSize: "24px",
                fontWeight: "600",
                color: "#212529" 
              }}>
                Delete Menu Items
              </h1>
              <p style={{
                margin: "8px 0 0 0",
                color: "#6c757d",
                fontSize: "14px"
              }}>
                View and remove items from your menu
              </p>
            </div>
            
            <div style={{ width: "84px" }}></div> {/* Empty div for spacing */}
          </div>

          {/* Content section */}
          <div style={{ padding: "25px 30px" }}>
            {/* Success Message */}
            {successMessage && (
              <div style={{
                backgroundColor: "#d1e7dd",
                color: "#0f5132",
                padding: "12px 15px",
                marginBottom: "25px",
                borderRadius: "6px",
                width: "100%",
                textAlign: "center",
                fontWeight: "500",
                fontSize: "14px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span>{successMessage}</span>
                <button 
                  onClick={() => setSuccessMessage("")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "18px",
                    color: "#0f5132",
                    padding: "0 5px"
                  }}
                >
                  ×
                </button>
              </div>
            )}

            {/* Error notification */}
            {error && (
              <div style={{
                backgroundColor: "#f8d7da",
                color: "#842029",
                padding: "12px 15px",
                marginBottom: "25px",
                borderRadius: "6px",
                width: "100%",
                textAlign: "center",
                fontWeight: "500",
                fontSize: "14px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span>{error}</span>
                <button 
                  onClick={() => setError("")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "18px",
                    color: "#842029",
                    padding: "0 5px"
                  }}
                >
                  ×
                </button>
              </div>
            )}

            {/* Search and Filter Controls */}
            {/* Search and Filter Controls */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "25px",
              gap: "15px",
              flexWrap: "wrap"
            }}>
              {/* Search box */}
              <div style={{
                flex: "1",
                minWidth: "200px"
              }}>
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "1px solid #ced4da",
                    fontSize: "14px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    outline: "none"
                  }}
                />
              </div>

              {/* Category filter */}
              <div style={{
                flex: "1",
                minWidth: "200px"
              }}>
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "1px solid #ced4da",
                    fontSize: "14px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    outline: "none",
                    backgroundColor: "#fff",
                    cursor: "pointer"
                  }}
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Menu Items List */}
            <div style={{
              marginTop: "20px",
              borderRadius: "8px",
              overflow: "hidden",
              border: "1px solid #e9ecef"
            }}>
              {filteredItems.length === 0 ? (
                <div style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "#6c757d",
                  backgroundColor: "#f8f9fa"
                }}>
                  <p style={{ margin: "0" }}>No menu items found. Try a different search term or category.</p>
                </div>
              ) : (
                <table style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px"
                }}>
                  <thead style={{
                    backgroundColor: "#f8f9fa",
                    borderBottom: "1px solid #e9ecef"
                  }}>
                    <tr>
                      <th style={{
                        padding: "12px 15px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#495057"
                      }}>
                        Item Name
                      </th>
                      <th style={{
                        padding: "12px 15px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#495057"
                      }}>
                        Category
                      </th>
                      <th style={{
                        padding: "12px 15px",
                        textAlign: "right",
                        fontWeight: "600",
                        color: "#495057"
                      }}>
                        Price
                      </th>
                      <th style={{
                        padding: "12px 15px",
                        textAlign: "center",
                        fontWeight: "600",
                        color: "#495057"
                      }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, index) => (
                      <tr key={item.id || index} style={{
                        borderBottom: index < filteredItems.length - 1 ? "1px solid #e9ecef" : "none"
                      }}>
                        <td style={{
                          padding: "15px",
                          verticalAlign: "top",
                          fontWeight: "500",
                          color: "#212529"
                        }}>
                          <div>
                            {item.item_name}
                            <p style={{
                              margin: "5px 0 0 0",
                              fontSize: "13px",
                              color: "#6c757d",
                              fontWeight: "normal"
                            }}>
                              {item.description}
                            </p>
                          </div>
                        </td>
                        <td style={{
                          padding: "15px",
                          verticalAlign: "top",
                          color: "#495057"
                        }}>
                          {item.category}
                        </td>
                        <td style={{
                          padding: "15px",
                          verticalAlign: "top",
                          textAlign: "right",
                          fontWeight: "500",
                          color: "#212529"
                        }}>
                          ${formatPrice(item.price)}
                        </td>
                        <td style={{
                          padding: "15px",
                          verticalAlign: "top",
                          textAlign: "center"
                        }}>
                          <button
                            onClick={() => handleDeleteClick(item.id)}
                            style={{
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              padding: "6px 12px",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: "500",
                              transition: "background-color 0.2s ease"
                            }}
                            onMouseOver={(e) => {
                              e.target.style.backgroundColor = "#bb2d3b";
                            }}
                            onMouseOut={(e) => {
                              e.target.style.backgroundColor = "#dc3545";
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div style={{
          position: "fixed",
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: "1000"
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            width: "90%",
            maxWidth: "400px",
            padding: "25px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)"
          }}>
            <h3 style={{
              margin: "0 0 15px 0",
              fontSize: "18px",
              fontWeight: "600",
              color: "#212529"
            }}>
              Confirm Deletion
            </h3>
            <p style={{
              margin: "0 0 20px 0",
              color: "#6c757d",
              fontSize: "14px",
              lineHeight: "1.5"
            }}>
              Are you sure you want to delete this menu item? This action cannot be undone.
            </p>
            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px"
            }}>
              <button
                onClick={cancelDelete}
                style={{
                  backgroundColor: "#f8f9fa",
                  color: "#6c757d",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s ease"
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#e9ecef";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "#f8f9fa";
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteItem}
                style={{
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "background-color 0.2s ease"
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#bb2d3b";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "#dc3545";
                }}
              >
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}

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

export default DeleteMenuItem;