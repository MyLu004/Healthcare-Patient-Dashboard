import { useState } from "react";
import { postVital } from "../lib/api";


// default form values for a new entry
const defaultEntry = {
  recorded_at: new Date().toISOString().slice(0, 16),
  systolic_bp: "",
  diastolic_bp: "",
  heart_rate: "",
  temperature: "",
  glucose: "",
  notes: "",
};

/**
 * NewEntryForm component allows user to add a new vitals entry.
 * Props:
 *   - onSuccess: function called after a successful entry (e.g., to refresh dashboard)
 */
const NewEntryForm = ({ onSuccess }) => {
  // local form state for input values
  const [form, setForm] = useState(defaultEntry);

  // track loading statee for submit button
  const [loading, setLoading] = useState(false);

  // status or error message to show user
  const [message, setMessage] = useState("");


  // handle changes to any input by updating form state
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };


  // handle form submit: format data, send API call, handle UI feedback
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {

      // prepare payload by converting fields to appropriate types
      const payload = {
        ...form,
        systolic_bp: parseInt(form.systolic_bp),
        diastolic_bp: parseInt(form.diastolic_bp),
        heart_rate: parseInt(form.heart_rate),
        temperature: parseFloat(form.temperature),
        glucose: parseFloat(form.glucose),
      };

      // send data to backend API
      await postVital(payload);
      setMessage("Entry added!");   // show sucess message
      setForm(defaultEntry);        // reset forms for next entry
      if (onSuccess) onSuccess(); // callback to refresh dashboard or parent data
    } catch (err) {
        console.error("Failed to add entry:", err);
      setMessage("Failed to add entry.");     // show error message
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft p-4 space-y-4">
      <h2 className="text-lg font-semibold text-neutral-dark">Add New Entry</h2>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
        
        {/* Date/time input */}
        <input 
          type="datetime-local" 
          name="recorded_at" 
          value={form.recorded_at} 
          onChange={handleChange} required 
        />

        {/* Systolic Blood Pressure */}
        <input 
          type="number" 
          name="systolic_bp" 
          placeholder="Systolic BP" 
          value={form.systolic_bp} 
          onChange={handleChange} 
        />

        {/* Diastolic Blood Pressure */}
        <input 
          type="number" 
          name="diastolic_bp" 
          placeholder="Diastolic BP" 
          value={form.diastolic_bp} 
          onChange={handleChange} 
        />

        {/* Heart Rate */}
        <input 
          type="number" 
          name="heart_rate" 
          placeholder="Heart Rate" 
          value={form.heart_rate} 
          onChange={handleChange} 
        />

        {/* Temperature */}
        <input 
          type="number" 
          step="0.1" 
          name="temperature" 
          placeholder="Temperature (°F)" 
          value={form.temperature} 
          onChange={handleChange} 
        />

        {/* Glucose */}
        <input 
          type="number" 
          step="0.1" 
          name="glucose" 
          placeholder="Glucose" 
          value={form.glucose} 
          onChange={handleChange} 
        />

        {/* Notes */}
        <textarea 
          name="notes" 
          placeholder="Notes" 
          value={form.notes} 
          onChange={handleChange} 
          className="col-span-full" 
        />

        {/* Submit button and status message */}
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
