import React from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import 'react-calendar/dist/Calendar.css';


//import pages
import Login from "./pages/login"
import Dashboard from './pages/dashboard';
import Signup from './pages/signup';
import Setting from './pages/setting';
import Appointment from './pages/appointment';
import MainDashboard from './pages/mainDashboard';

const App = () => {
  return (
    

    <Router>
      <Routes>
        <Route path="/mainDashboard" element={<MainDashboard />} />
        <Route path="/" element={<Login/>} />
        <Route path="/signup" element={<Signup/>} />
        <Route path="/dashboard" element={<Dashboard/>} />
        <Route path="/settings" element={<Setting/>} />
        <Route path="/appointment" element={<Appointment/>} />
        

      </Routes>

    </Router>
  )
}

export default App