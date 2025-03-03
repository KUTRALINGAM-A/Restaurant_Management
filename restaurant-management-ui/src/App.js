import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import UserLogin from "./login";
import Home from "./home";
import RestaurantRegistration from "./RestaurantRegistration";
import UserForm from "./userform";

const App = () => {
  const isAuthenticated = localStorage.getItem("token"); // Check if the user is logged in

  return (
    <Router>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/home" /> : <UserLogin />} />
        <Route path="/home" element={<Home />} />
        <Route path="/restaurant-register" element={<RestaurantRegistration />} />
        <Route path="/user-register" element={<UserForm />} />
      </Routes>
    </Router>
  );
};

export default App;
