import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./home";
import RestaurantRegistration from "./RestaurantRegistration";
import UserForm from "./userform";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/restaurant-register" element={<RestaurantRegistration />} />
        <Route path="/user-register" element={<UserForm />} />
      </Routes>
    </Router>
  );
};

export default App;
