import { useState } from "react";
import { postVital } from "../lib/api";

const defaultEntry = {
  recorded_at: new Date().toISOString().slice(0, 16),
  systolic_bp: "",
  diastolic_bp: "",
  heart_rate: "",
  temperature: "",
  glucose: "",
  notes: "",
};

const NewEntryForm = ({ onSuccess }) => {
  const [form, setForm] = useState(defaultEntry);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = {
        ...form,
        systolic_bp: parseInt(form.systolic_bp),
        diastolic_bp: parseInt(form.diastolic_bp),
        heart_rate: parseInt(form.heart_rate),
        temperature: parseFloat(form.temperature),
        glucose: parseFloat(form.glucose),
      };

      await postVital(payload);
      setMessage("✅ Entry added!");
      setForm(defaultEntry);
      if (onSuccess) onSuccess(); // Refresh dashboard
    } catch (err) {
        console.error("Failed to add entry:", err);
      setMessage("❌ Failed to add entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft p-4 space-y-4">
      <h2 className="text-lg font-semibold text-neutral-dark">Add New Entry</h2>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
        <input type="datetime-local" name="recorded_at" value={form.recorded_at} onChange={handleChange} required />
        <input type="number" name="systolic_bp" placeholder="Systolic BP" value={form.systolic_bp} onChange={handleChange} />
        <input type="number" name="diastolic_bp" placeholder="Diastolic BP" value={form.diastolic_bp} onChange={handleChange} />
        <input type="number" name="heart_rate" placeholder="Heart Rate" value={form.heart_rate} onChange={handleChange} />
        <input type="number" step="0.1" name="temperature" placeholder="Temperature (°F)" value={form.temperature} onChange={handleChange} />
        <input type="number" step="0.1" name="glucose" placeholder="Glucose" value={form.glucose} onChange={handleChange} />
        <textarea name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} className="col-span-full" />

        <div className="col-span-full flex justify-between items-center">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Add Entry"}
          </button>
          {message && <p className="text-sm text-gray-600">{message}</p>}
        </div>
      </form>
    </div>
  );
};

export default NewEntryForm;
