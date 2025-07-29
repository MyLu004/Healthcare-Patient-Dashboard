import React from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";


//import pages
import Login from "./pages/login"
import Dashboard from './pages/dashboard';
import Signup from './pages/signup';
import Setting from './pages/setting';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login/>} />
        <Route path="/signup" element={<Signup/>} />
        <Route path="/dashboard" element={<Dashboard/>} />
        <Route path="/settings" element={<Setting/>} />
        

      </Routes>

    </Router>
  )
}

export default App