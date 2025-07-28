import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserPlus } from "react-icons/fa"; // Healthcare-friendly icon

function Signup() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const validatePassword = (pwd) => {
    return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(pwd);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!validatePassword(password)) {
      setError(
        "Password must be at least 6 characters and contain a letter and a number."
      );
      return;
    }

    const res = await fetch("http://localhost:8000/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, username }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Signup successful!");
      navigate("/");
    } else {
      setError("Signup failed: " + (data.detail || "Unknown error"));
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
          className="w-full bg-teal-500 text-white py-2 rounded-lg hover:bg-teal-600 transition"
        >
          Sign Up
        </button>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full text-sm text-teal-700 mt-2 hover:underline"
        >
          Already have an account? Log In
        </button>
      </form>
    </div>
  );
}

export default Signup;
