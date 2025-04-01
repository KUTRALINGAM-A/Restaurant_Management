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
import MarkAttendance from "./attendance/mark_attendance";
import ViewAttendance from "./attendance/view_attendance";
import BillReport from "./reports/bill_report";
import Generator from "./UPI_payment/QRcodeGenerator";
import Search from "./reports/bill_search_item";
import Userinfo from "./userinfo";
import ResetPassword from "./reset_password"
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
        <Route path="/attendance/mark_attendance" element={<MarkAttendance />}/>
        <Route path="/attendance/view_attendance" element={<ViewAttendance />}/>
        <Route path="/reports/bill_report" element={<BillReport />}/>
        <Route path="/UPI_payment/QRcodeGenerator" element={<Generator />}/>
        <Route path="/reports/bill_search_item" element={<Search />}/>
        <Route path="/userinfo" element={<Userinfo />}/>
        <Route path="/reset_password" element={<ResetPassword />}/>
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