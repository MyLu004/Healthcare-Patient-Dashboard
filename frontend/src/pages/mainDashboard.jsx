// src/pages/MainDashboard.jsx
import { useMemo, useState } from "react";
import NavBar from "../components/NavBar";
import Dashboard from "./dashboard";
import Appointment from "./appointment";
import Goal from "./goal";

// provider-only widgets
import AdminAppointmentsTable from "../components/AdminAppointmentsTable";
import ProviderCalendar from "../components/ProviderCalendar";

// read role & me from either storage (login.jsx populates these)
function getRole() {
  return (
    localStorage.getItem("role") ||
    sessionStorage.getItem("role") ||
    "patient"
  );
}

export default function MainDashboard() {
  const role = useMemo(() => getRole(), []);
  const isProvider = role === "provider";

  // Only show tabs for non-providers. Providers get a focused console.
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div>
      <NavBar />

      {/* Provider console */}
      {isProvider ? (
        <div className="px-6 py-6 space-y-8">
          <div>
            <h2 className="text-3xl font-bold">Provider Console</h2>
            <p className="text-gray-600">Manage your availability and appointments.</p>
          </div>

          {/* Manage availability */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold">My Availability</h3>
            <ProviderCalendar />
          </section>

          {/* Approve/cancel requests & see upcoming */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold">Appointments</h3>
            <AdminAppointmentsTable />
          </section>
        </div>
      ) : (
        // Patient/staff: keep your original tabbed layout
        <>
          <div className="flex gap-5 px-6 mt-4">
            <button
              className={`px-4 py-2 rounded ${
                activeTab === "dashboard" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-700"
              }`}
              onClick={() => setActiveTab("dashboard")}
            >
              Dashboard
            </button>
            <button
              className={`px-4 py-2 rounded ${
                activeTab === "appointment" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-700"
              }`}
              onClick={() => setActiveTab("appointment")}
            >
              Appointment
            </button>
            <button
              className={`px-4 py-2 rounded ${
                activeTab === "goal" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-700"
              }`}
              onClick={() => setActiveTab("goal")}
            >
              Goal
            </button>
          </div>

          <div className="px-6 pt-6">
            {activeTab === "dashboard" && <Dashboard />}
            {activeTab === "appointment" && <Appointment />}
            {activeTab === "goal" && <Goal />}
          </div>
        </>
      )}
    </div>
  );
}
