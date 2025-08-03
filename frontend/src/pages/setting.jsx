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
      setMessage("Passwords do not match");
      return;
    }

    // backend route and token auth 
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
      setMessage("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      const data = await res.json();
      setMessage("Error: " + (data.detail || "Failed to change password"));
    }
  };

  // Handler for navigating back to dashboard
  const handleGoBack = () => {
    navigate("/mainDashboard"); // Change to your actual dashboard route if different
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="flex items-center justify-between py-5 px-5 bg-teal-700 shadow">
        <h2 className="text-3xl font-bold text-white">Account Settings</h2>
        <button
          onClick={handleGoBack}
          className="border border-teal-600 bg-white text-teal-700 hover:bg-teal-50 font-medium px-4 py-1.5 rounded-lg transition"
        >
          ← Back to Dashboard
        </button>
      </header>
      <main className="flex-1 px-8 py-10 max-w-2xl w-full mx-auto">
        <div className="flex justify-end mb-4">
          
        </div>

        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-4 text-teal-700">Profile</h3>
          <div className="bg-white rounded-xl shadow p-6 space-y-2">
            <p><span className="font-semibold">Username:</span> {username}</p>
            <p><span className="font-semibold">Email:</span> {email}</p>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-4 text-teal-700">Change Password</h3>
          <form onSubmit={handleChangePassword} className="bg-white rounded-xl shadow p-6 space-y-4">
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
        </section>

        <button
          onClick={handleLogout}
          className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition font-medium"
        >
          Log Out
        </button>
      </main>
    </div>
  );
};

export default Settings;
