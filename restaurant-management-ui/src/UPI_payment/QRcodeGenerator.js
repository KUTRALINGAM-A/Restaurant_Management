import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';


const BillQRGenerator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const restaurantId = localStorage.getItem("restaurantId");
  const [state, setState] = useState({
    totalAmount: location.state?.totalAmount || 0,
    restaurantName: location.state?.restaurantName || "My Restaurant",
    billNumber: location.state?.billNumber || 0,
    userName: "User",
    logoUrl: null
  });

  useEffect(() => {
    const storedData = {
      userName: localStorage.getItem("name"),
      restaurantName: localStorage.getItem("restaurantName"),
      logoUrl: localStorage.getItem("restaurantLogoUrl")
    };

    setState(prev => ({
      ...prev,
      userName: storedData.userName || prev.userName,
      restaurantName: storedData.restaurantName || prev.restaurantName,
      logoUrl: `http://localhost:5000/users/restaurant-logo/${restaurantId}`
    }));
  }, []);

  const generateQRCodeData = () => {
    return JSON.stringify({
      amount: state.totalAmount,
      restaurantName: state.restaurantName,
      billNumber: state.billNumber,
      timestamp: new Date().toISOString(),
      reference: `BILL-${Math.random().toString(36).substr(2, 9)}`
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div style={{
      display: "flex", 
      flexDirection: "column", 
      minHeight: "100vh", 
      backgroundColor: "#f8f9fa", 
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <header style={{
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
        padding: "15px 25px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{
            width: "60px",
            height: "60px",
            borderRadius: "8px",
            overflow: "hidden",
            backgroundColor: "#f8f9fa",
            border: "1px solid #e9ecef"
          }}>
            {state.logoUrl ? (
              <img 
                src={state.logoUrl} 
                alt={`${state.restaurantName} Logo`} 
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} 
              />
            ) : (
              <div style={{ color: "#6c757d", fontSize: "12px", textAlign: "center", padding: "5px" }}>
                No logo
              </div>
            )}
          </div>
          <h1 style={{ margin: "0", fontSize: "22px", fontWeight: "600", color: "#212529" }}>
            {state.restaurantName}
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div>
            <p style={{ margin: "0", fontSize: "14px", color: "#6c757d" }}>Welcome,</p>
            <p style={{ margin: "0", fontWeight: "500", color: "#212529" }}>{state.userName}</p>
          </div>
          <button 
            onClick={handleLogout} 
            style={{
              backgroundColor: "transparent",
              color: "#dc3545",
              border: "1px solid #dc3545",
              borderRadius: "4px",
              padding: "8px 16px",
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={{
        flex: 1,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          padding: "30px",
          textAlign: "center",
          maxWidth: "500px",
          width: "100%"
        }}>
          <h2 style={{ marginBottom: "20px", color: "#212529", fontSize: "24px" }}>
            UPI Payment QR Code
          </h2>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "15px" }}>
            <div style={{ fontSize: "18px", fontWeight: "600", color: "#0d6efd" }}>
              Total Amount: ₹{state.totalAmount.toFixed(2)}
            </div>

            {state.totalAmount > 0 && (
             <QRCodeCanvas 
             value={generateQRCodeData()} 
             size={256} 
             level={"H"} 
             style={{ border: "1px solid #dee2e6", borderRadius: "8px" }} 
           />
           
            )}

            <div style={{ fontSize: "14px", color: "#6c757d", marginTop: "10px" }}>
              Bill Number: {state.billNumber}
            </div>

            <button
              onClick={() => navigate('/new_bills/new_one')}
              style={{
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "10px 20px",
                cursor: "pointer"
              }}
            >
              Back to Billing
            </button>
          </div>
        </div>
      </main>

      <footer style={{
        backgroundColor: "#ffffff",
        borderTop: "1px solid #e9ecef",
        padding: "15px 0",
        textAlign: "center",
        color: "#6c757d",
        fontSize: "14px"
      }}>
        <p style={{ margin: 0 }}>A product of Flamingoes</p>
        <p style={{ margin: 0, fontSize: "12px" }}>© Flamingoes 2025. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default BillQRGenerator;
