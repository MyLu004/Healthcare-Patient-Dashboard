import { useState } from "react";
import Navbar from "../components/NavBar";
import Dashboard from "./dashboard";
import Appointment from "./appointment";
import Goal from "./goal";

export default function MainDashboard() {
  // which tab is active? dashboard by default
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div>
      <Navbar />
      <div className="flex gap-5 px-6 mt-4">
        <button
          className={`px-4 py-2 rounded ${activeTab === "dashboard" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-700"}`}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === "appointment" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-700"}`}
          onClick={() => setActiveTab("appointment")}
        >
          Appointment
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === "goal" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-700"}`}
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
    </div>
  );
}
