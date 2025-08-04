import { useState, useEffect } from "react";


// model for editing vital sign entries
export default function EditVitalModal({ open, onClose, initial, onSave }) {
  // state to hold the form data
  const [form, setForm] = useState(null);

  // effect to set initial form data when modal opens
  useEffect(() => {
    if (initial) {
      setForm(initial);
    }
  }, [initial]);

  if (!open || !initial || !form) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // handle form submission: validatee, convert values, and call teh onSave callback
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      systolic_bp: form.systolic_bp ? parseInt(form.systolic_bp) : null,
      diastolic_bp: form.diastolic_bp ? parseInt(form.diastolic_bp) : null,
      heart_rate: form.heart_rate ? parseInt(form.heart_rate) : null,
      temperature: form.temperature ? parseFloat(form.temperature) : null,
      glucose: form.glucose ? parseFloat(form.glucose) : null,
      recorded_at: new Date(form.recorded_at).toISOString(),
    });
  };


  // render modal overlay and form
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Edit Vital</h3>
        <form onSubmit={handleSubmit} className="space-y-3">

           {/* Date and time picker */}
          <input
            type="datetime-local"
            name="recorded_at"
            value={form.recorded_at?.slice(0, 16) || ""}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
            required
          />

          {/* Blood pressure fields, side-by-side */}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              name="systolic_bp"
              placeholder="Systolic"
              value={form.systolic_bp ?? ""}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2"
            />
            <input
              type="number"
              name="diastolic_bp"
              placeholder="Diastolic"
              value={form.diastolic_bp ?? ""}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2"
            />
          </div>

           {/* Heart rate input */}
          <input
            type="number"
            name="heart_rate"
            placeholder="Heart Rate"
            value={form.heart_rate ?? ""}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />

          {/* Temperature input */}
          <input
            type="number"
            step="0.1"
            name="temperature"
            placeholder="Temperature"
            value={form.temperature ?? ""}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />

          {/* Glucose input */}
          <input
            type="number"
            step="0.1"
            name="glucose"
            placeholder="Glucose"
            value={form.glucose ?? ""}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />

          {/* Notes textarea */}
          <textarea
            name="notes"
            placeholder="Notes"
            value={form.notes ?? ""}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />

           {/* Form action buttons: Cancel and Save */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-white"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
