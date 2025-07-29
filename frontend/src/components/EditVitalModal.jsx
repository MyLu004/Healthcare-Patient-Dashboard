import { useState, useEffect } from "react";

export default function EditVitalModal({ open, onClose, initial, onSave }) {
  const [form, setForm] = useState(null);

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

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Edit Vital</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="datetime-local"
            name="recorded_at"
            value={form.recorded_at?.slice(0, 16) || ""}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
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
          <input
            type="number"
            name="heart_rate"
            placeholder="Heart Rate"
            value={form.heart_rate ?? ""}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />
          <input
            type="number"
            step="0.1"
            name="temperature"
            placeholder="Temperature"
            value={form.temperature ?? ""}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />
          <input
            type="number"
            step="0.1"
            name="glucose"
            placeholder="Glucose"
            value={form.glucose ?? ""}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />
          <textarea
            name="notes"
            placeholder="Notes"
            value={form.notes ?? ""}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />
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
