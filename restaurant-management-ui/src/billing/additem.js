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
  
  // Style constants
  const formGroupStyle = {
    marginBottom: "20px",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    fontWeight: "500",
    fontSize: "14px",
    color: "#343a40",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 15px",
    fontSize: "14px",
    border: "1px solid #ced4da",
    borderRadius: "8px",
    transition: "border-color 0.2s ease",
    outline: "none",
    boxSizing: "border-box",
  };

  const buttonStyle = {
    width: "100%",
    backgroundColor: "#0a58ca",
    color: "white",
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    fontWeight: "500",
    fontSize: "15px",
    transition: "background-color 0.2s ease",
    marginTop: "10px",
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
        alignItems: "center",
        padding: "20px",
      }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
            width: "100%",
            maxWidth: "700px",
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
                Add Menu Item
              </h1>
              <p style={{
                margin: "8px 0 0 0",
                color: "#6c757d",
                fontSize: "14px"
              }}>
                Add a new item to your menu
              </p>
            </div>
            
            <div style={{ width: "84px" }}></div> {/* Empty div for spacing */}
          </div>

          {/* Form section */}
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

              <form onSubmit={handleSubmit}>
                {/* Item Name */}
                <div style={formGroupStyle}>
                  <label htmlFor="item_name" style={labelStyle}>
                    Item Name *
                  </label>
                  <input
                    type="text"
                    id="item_name"
                    name="item_name"
                    value={formData.item_name}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="Enter menu item name"
                  />
                </div>

                {/* Description */}
                <div style={formGroupStyle}>
                  <label htmlFor="description" style={labelStyle}>
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    style={{
                      ...inputStyle,
                      height: "120px",
                      resize: "vertical",
                    }}
                    placeholder="Enter item description"
                  />
                </div>

                {/* Price */}
                <div style={formGroupStyle}>
                  <label htmlFor="price" style={labelStyle}>
                    Price *
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="Enter price"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Category */}
                <div style={formGroupStyle}>
                  <label htmlFor="category" style={labelStyle}>
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleCategoryChange}
                    style={inputStyle}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category, index) => (
                      <option key={index} value={category}>
                        {category}
                      </option>
                    ))}
                    <option value="add_new">+ Add New Category</option>
                  </select>
                </div>

                {/* New Category Input */}
                {showCategoryInput && (
                  <div style={formGroupStyle}>
                    <label htmlFor="new_category" style={labelStyle}>
                      New Category
                    </label>
                    <div style={{
                      display: "flex",
                      gap: "10px"
                    }}>
                      <input
                        type="text"
                        id="new_category"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        style={{
                          ...inputStyle,
                          flex: 1
                        }}
                        placeholder="Enter new category name"
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        style={{
                          backgroundColor: "#198754",
                          color: "white",
                          padding: "10px 15px",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "500"
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Availability */}
                <div style={{
                  ...formGroupStyle,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}>
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
                  <label htmlFor="available" style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#343a40",
                    cursor: "pointer"
                  }}>
                    Item is available
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  style={buttonStyle}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = "#0d6efd";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = "#0a58ca";
                  }}
                >
                  Add Menu Item
                </button>
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