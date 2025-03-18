import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import UserLogin from "./login";
import Home from "./home";
import RestaurantRegistration from "./RestaurantRegistration";
import UserForm from "./userform";
import RestaurantHome from "./restauranthome";
import BillingHome from "./billinghome";
import Curd from "./billing/CURD_menu";
import Add from "./billing/additem";
import Delete from "./billing/deleteitem";
import Edit from "./billing/edititem";
import Newbill from "./new_bills/new_one";
import Attendance from "./attendance/attendance_home";
import Mark_attendance from "./attendance/mark_attendance";
// Protected Route Component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    // Redirect to login if no token
    return <Navigate to="/" replace />;
  }

  return children;
}

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UserLogin />} />
        <Route path="/home" element={<Home />} />
        <Route path="/restaurant-register" element={<RestaurantRegistration />} />
        <Route path="/user-register" element={<UserForm />} />
        <Route path="/billinghome" element={<BillingHome />} />
        <Route path="/billing/CURD_menu" element={<Curd />} />
        <Route path="/billing/additem" element={<Add />} />
        <Route path="/billing/deleteitem" element={<Delete />} />
        <Route path="/billing/edititem" element={<Edit />} />
        <Route path="/new_bills/new_one" element={<Newbill />} />
        <Route path="/attendance/attendance_home" element={<Attendance />} />
        <Route path="/attendance/mark_attendance" element={<Mark_attendance />} />
        {/* Protected Restaurant Home Route */}
        <Route 
          path="/restaurant-home" 
          element={
            <ProtectedRoute>
              <RestaurantHome />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;