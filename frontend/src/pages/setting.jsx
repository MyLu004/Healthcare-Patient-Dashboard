import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Unknown";
  const email = localStorage.getItem("userEmail") || "Unknown";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");

    if (newPassword !== confirmPassword) {
      setMessage("❌ Passwords do not match");
      return;
    }

    // 🔐 OPTIONAL: implement your backend route and token auth here
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    const res = await fetch("http://localhost:8000/users/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ new_password: newPassword }),
    });

    if (res.ok) {
      setMessage("✅ Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      const data = await res.json();
      setMessage("❌ Error: " + (data.detail || "Failed to change password"));
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-12 bg-white shadow-md rounded-2xl p-8">
      <h2 className="text-2xl font-bold text-teal-700 mb-4">Account Settings</h2>

      <div className="mb-6 space-y-1">
        <p><span className="font-semibold">Username:</span> {username}</p>
        <p><span className="font-semibold">Email:</span> {email}</p>
      </div>

      <form onSubmit={handleChangePassword} className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-700">Change Password</h3>
        <input
          type="password"
          placeholder="New Password"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-teal-500 text-white py-2 rounded-lg hover:bg-teal-600 transition"
        >
          Update Password
        </button>
        {message && <p className="text-sm text-center text-red-600">{message}</p>}
      </form>

      <hr className="my-4" />

      <button
        onClick={handleLogout}
        className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
      >
        Log Out
      </button>
    </div>
  );
};

export default Settings;
