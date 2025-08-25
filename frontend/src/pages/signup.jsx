import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserPlus } from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_API_URL;

// Match your backend's accepted roles. Default to "user" (per Swagger).
const ROLES = [
  { value: "user", label: "User" },
  { value: "patient", label: "Patient" },
  { value: "provider", label: "Provider" },
  { value: "admin", label: "Admin" },
];

function Signup() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("user"); // default role per backend example
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const validatePassword = (pwd) =>
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(pwd);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters and contain a letter and a number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Backend expects role IN BODY (not headers)
        body: JSON.stringify({ email, password, username, role }),
      });

      // Try to parse JSON even for error responses
      let data = {};
      
      try { data = await res.json(); } catch (_) {}

      if (!res.ok) {
        let message = "Unknown error";
if (data?.detail) {
  if (Array.isArray(data.detail)) {
    // FastAPI validation errors come as a list
    message = data.detail.map(err => `${err.loc.join(".")}: ${err.msg}`).join(", ");
  } else if (typeof data.detail === "string") {
    message = data.detail;
  } else {
    message = JSON.stringify(data.detail);
  }
}
setError(`Signup failed: ${message}`);
        return;
      }

      alert("Signup successful!");
      navigate("/");
    } catch (err) {
      setError(`Network error: ${err?.message || "Unable to reach server"}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-teal-100">
      <form
        onSubmit={handleSignup}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-4 border border-teal-300"
      >
        <div className="flex items-center justify-center">
          <FaUserPlus className="text-4xl text-teal-600" />
        </div>

        <h2 className="text-2xl font-bold text-center text-teal-700">Sign Up</h2>
        <p className="text-sm text-center text-gray-500">
          Create your account to access your health dashboard
        </p>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <input
          type="text"
          placeholder="Username"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* Role selector */}
        <select
          className="w-full px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        <input
          type="password"
          placeholder="Password"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className={`w-full text-white py-2 rounded-lg transition ${
            submitting ? "bg-teal-300 cursor-not-allowed" : "bg-teal-500 hover:bg-teal-600"
          }`}
        >
          {submitting ? "Signing up..." : "Sign Up"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full text-sm text-teal-700 mt-2 hover:underline"
        >
          Already have an account? Log In
        </button>

        <p className="text-xs text-gray-400 text-center">
          Password must be ≥ 6 chars and include at least one letter and one number.
        </p>
      </form>
    </div>
  );
}

export default Signup;
