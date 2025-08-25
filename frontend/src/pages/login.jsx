// src/pages/login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHeartbeat } from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_API_URL;

function parseJwt(token) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert("Login failed: " + (data?.detail || "Unknown error"));
      return;
    }

    const token = data.access_token;
    const role = data.role || parseJwt(token).role || "patient";

    if (rememberMe) {
      localStorage.setItem("accessToken", token);
      localStorage.setItem("role", role);
    } else {
      sessionStorage.setItem("accessToken", token);
      sessionStorage.setItem("role", role);
    }
    localStorage.setItem("username", data.username || "");
    localStorage.setItem("userEmail", data.email || "");

    // Redirect by role
    if (role === "provider") navigate("/appointments");
    else if (role === "staff") navigate("/appointments");
    else navigate("/mainDashboard");
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-teal-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-5 border border-teal-300">
        <div className="flex items-center justify-center mb-2">
          <FaHeartbeat className="text-4xl text-teal-600" />
        </div>
        <h2 className="text-2xl font-bold text-center text-teal-700">Kinoko Health Dashboard</h2>
        <p className="text-center text-sm text-gray-500">Please login to access your health dashboard</p>

        <input type="email" placeholder="Email" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          value={password} onChange={(e) => setPassword(e.target.value)} required />

        <label className="flex items-center text-sm text-gray-600">
          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="mr-2" />
          Remember me
        </label>

        <button type="submit" className="w-full bg-teal-500 text-white py-2 rounded-lg hover:bg-teal-600 transition">Log In</button>
        <button type="button" onClick={() => navigate("/signup")} className="w-full border border-teal-500 text-teal-600 py-2 rounded-lg hover:bg-teal-50 transition">
          Sign Up
        </button>
      </form>
    </div>
  );
}
export default Login;
