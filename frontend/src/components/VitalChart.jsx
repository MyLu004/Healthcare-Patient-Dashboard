import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

const VitalChart = ({ data }) => {
  const [metric, setMetric] = useState("bp"); // "bp" | "hr" | "temp"

  const chartData = data.map((d) => ({
    ...d,
    dateLabel: new Date(d.date).toLocaleDateString(),
  }));

  const renderLines = () => {
    if (metric === "bp") {
      return (
        <>
          <Line type="monotone" dataKey="systolic" stroke="#3B82F6" name="Systolic" />
          <Line type="monotone" dataKey="diastolic" stroke="#6366F1" name="Diastolic" />
        </>
      );
    }
    if (metric === "hr") {
      return <Line type="monotone" dataKey="heart_rate" stroke="#EC4899" name="Heart Rate" />;
    }
    if (metric === "temp") {
      return <Line type="monotone" dataKey="temperature" stroke="#F97316" name="Temperature" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Vitals Chart</h2>
        <div className="flex gap-2">
          <button className={`px-3 py-1 rounded-lg text-sm ${metric === "bp" ? "bg-primary text-white" : "bg-neutral-light"}`} onClick={() => setMetric("bp")}>BP</button>
          <button className={`px-3 py-1 rounded-lg text-sm ${metric === "hr" ? "bg-primary text-white" : "bg-neutral-light"}`} onClick={() => setMetric("hr")}>HR</button>
          <button className={`px-3 py-1 rounded-lg text-sm ${metric === "temp" ? "bg-primary text-white" : "bg-neutral-light"}`} onClick={() => setMetric("temp")}>Temp</button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="dateLabel" />
          <YAxis />
          <Tooltip />
          <Legend />
          {renderLines()}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VitalChart;
