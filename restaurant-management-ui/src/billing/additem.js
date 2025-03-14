import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AddMenuItem = () => {
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = useState("My Restaurant");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");
  const [logoUrl, setLogoUrl] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [showCategoryInput, setShowCategoryInput] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    item_name: "",
    description: "",
    price: "",
    category: "",
    available: true
  });

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
      
      // Fetch restaurant logo and categories
      const restaurantId = localStorage.getItem("restaurantId");
      
      if (restaurantId) {
        fetchRestaurantLogo(restaurantId, token);
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
      setCategories(response.data);
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value === "add_new") {
      setShowCategoryInput(true);
      setFormData({
        ...formData,
        category: ""
      });
    } else {
      setFormData({
        ...formData,
        category: value
      });
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      // Add the new category to the list
      setCategories([...categories, newCategory.trim()]);
      
      // Set it as the selected category
      setFormData({
        ...formData,
        category: newCategory.trim()
      });
      
      // Reset and hide the input
      setNewCategory("");
      setShowCategoryInput(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    
    // Validate form
    if (!formData.item_name.trim()) {
      setError("Item name is required");
      return;
    }
    
    if (!formData.category.trim()) {
      setError("Category is required");
      return;
    }
    
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      setError("Price must be a valid positive number");
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const restaurantId = localStorage.getItem("restaurantId");
      
      if (!token || !restaurantId) {
        setError("Authentication error. Please log in again.");
        navigate("/");
        return;
      }
      
      console.log("Sending data to backend:", formData);
      
      const response = await axios.post(
        `http://localhost:5000/menu_${restaurantId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("Response from backend:", response.data);
      
      // Success
      setSuccessMessage(`Menu item "${response.data.item_name}" added successfully!`);
      
      // Reset form
      setFormData({
        item_name: "",
        description: "",
        price: "",
        category: formData.category, // Keep the same category for convenience
        available: true
      });
      
      // Scroll to top to see success message
      window.scrollTo(0, 0);
      
    } catch (error) {
      console.error("Error adding menu item:", error);
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("Failed to add menu item. Please try again.");
      }
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
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px"
      }}>
        <div style={{
          width: "100%",
          maxWidth: "700px"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px"
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
              Add Menu Item
            </h2>
            
            <div style={{ width: "120px" }}></div> {/* Empty div for spacing */}
          </div>

          {/* Success Message */}
          {successMessage && (
            <div style={{
              backgroundColor: "#d4edda",
              color: "#155724",
              padding: "12px 20px",
              marginBottom: "25px",
              borderRadius: "4px",
              width: "100%",
              textAlign: "center",
              fontWeight: "500",
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
                  color: "#155724",
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
              color: "#721c24",
              padding: "12px 20px",
              marginBottom: "25px",
              borderRadius: "4px",
              width: "100%",
              textAlign: "center",
              fontWeight: "500",
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
                  color: "#721c24",
                  padding: "0 5px"
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* Add Menu Item Form */}
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            padding: "30px",
            marginBottom: "30px"
          }}>
            <form onSubmit={handleSubmit}>
              {/* Item Name */}
              <div style={{ marginBottom: "20px" }}>
                <label 
                  htmlFor="item_name"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                    color: "#343a40"
                  }}
                >
                  Item Name *
                </label>
                <input
                  type="text"
                  id="item_name"
                  name="item_name"
                  value={formData.item_name}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "16px",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    boxSizing: "border-box"
                  }}
                  placeholder="Enter item name..."
                  required
                />
              </div>
              
              {/* Description */}
              <div style={{ marginBottom: "20px" }}>
                <label 
                  htmlFor="description"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                    color: "#343a40"
                  }}
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "16px",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    boxSizing: "border-box",
                    minHeight: "100px",
                    resize: "vertical"
                  }}
                  placeholder="Enter item description..."
                />
              </div>
              
              {/* Price */}
              <div style={{ marginBottom: "20px" }}>
                <label 
                  htmlFor="price"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                    color: "#343a40"
                  }}
                >
                  Price *
                </label>
                <div style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <span style={{
                    position: "absolute",
                    left: "12px",
                    color: "#495057"
                  }}>
                    $
                  </span>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 24px",
                      fontSize: "16px",
                      border: "1px solid #ced4da",
                      borderRadius: "4px",
                      boxSizing: "border-box"
                    }}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>
              
              {/* Category */}
              <div style={{ marginBottom: "20px" }}>
                <label 
                  htmlFor="category"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                    color: "#343a40"
                  }}
                >
                  Category *
                </label>
                
                {showCategoryInput ? (
                  <div style={{
                    display: "flex",
                    gap: "10px"
                  }}>
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      style={{
                        flex: "1",
                        padding: "10px 12px",
                        fontSize: "16px",
                        border: "1px solid #ced4da",
                        borderRadius: "4px",
                        boxSizing: "border-box"
                      }}
                      placeholder="Enter new category..."
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      style={{
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "10px 15px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500"
                      }}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCategoryInput(false)}
                      style={{
                        backgroundColor: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "10px 15px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500"
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleCategoryChange}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: "16px",
                      border: "1px solid #ced4da",
                      borderRadius: "4px",
                      boxSizing: "border-box",
                      backgroundColor: "white"
                    }}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category, index) => (
                      <option key={index} value={category}>
                        {category}
                      </option>
                    ))}
                    <option value="add_new">+ Add new category</option>
                  </select>
                )}
              </div>
              
              {/* Availability */}
              <div style={{ marginBottom: "30px" }}>
                <label 
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer"
                  }}
                >
                  <input
                    type="checkbox"
                    id="available"
                    name="available"
                    checked={formData.available}
                    onChange={handleInputChange}
                    style={{
                      width: "18px",
                      height: "18px",
                      cursor: "pointer"
                    }}
                  />
                  <span style={{
                    fontWeight: "500",
                    color: "#343a40"
                  }}>
                    Item is available
                  </span>
                </label>
              </div>
              
              {/* Submit Button */}
              <div style={{
                display: "flex",
                justifyContent: "center"
              }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "12px 24px",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "500",
                    minWidth: "150px",
                    transition: "all 0.2s ease"
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = "#0069d9";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = "#007bff";
                  }}
                >
                  Add Menu Item
                </button>
              </div>
            </form>
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

export default AddMenuItem;