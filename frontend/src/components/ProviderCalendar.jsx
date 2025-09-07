// src/components/ProviderCalendar.jsx
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  listMyAvailability,
  createAvailability,
  deleteAvailability,
} from "../lib/api";


const DEFAULT_SLOT_MINUTES = 30;


export default function ProviderCalendar() {
  const [rows, setRows] = useState([]);
  // const [startAt, setStartAt] = useState(null);
  // const [endAt, setEndAt] = useState(null);

  const [startAt, setStartAt] = useState(null);
  const [endAt, setEndAt] = useState(null);




  const [visitType, setVisitType] = useState("telehealth");
  const [notes, setNotes] = useState("");

  const [facilityId, setFacilityId] = useState("");
  
  
  const me = JSON.parse(localStorage.getItem("me") || "{}"); // needs id saved at login
  console.log("ProviderCalendar user:", me);
  const providerId = me?.id;

  // react hook : load availability
  
  useEffect(() => { (async () => {
    const list = await listMyAvailability();
    setRows(Array.isArray(list) ? list : []);
  })(); }, []);

   function onStartChange(d) {
    setStartAt(d);
    if (!d) return;
    if (!endAt || endAt <= d) {
      const next = new Date(d.getTime() + DEFAULT_SLOT_MINUTES * 60 * 1000);
      setEndAt(next);
    }
  }
 function onEndChange(d) {
   setEndAt(d);
 }


  async function submit(e) {
    e.preventDefault();
    if (!startAt || !endAt) return alert("Pick start & end");
    if (endAt <= startAt) return alert("End time must be after start time.");
    if (!providerId) return alert("Missing provider id (are you logged in?)");
    if (visitType === "in_person" && !facilityId) return alert("In-person availability requires a facility id.");

    await createAvailability({
      // ok if backend ignores provider_id; harmless to include
      provider_id: Number(providerId),
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      visit_type: visitType,
      facility_id: visitType === "in_person" ? Number(facilityId) : null,
      notes,
    });

    setStartAt(null); setEndAt(null); setNotes(""); setFacilityId("");
    const list = await listMyAvailability(); setRows(Array.isArray(list) ? list : []);
  }

  async function remove(id) {
  if (!confirm("Delete this slot?")) return;
  try {
    await deleteAvailability(id);
    // Refresh the list after deletion
    const list = await listMyAvailability();
    setRows(Array.isArray(list) ? list : []);
  } catch (e) {
    alert(e.message);
  }
}

  return (
    <div className="space-y-4">
      {/* <h3 className="text-xl font-semibold">My Availability</h3> */}
      <form onSubmit={submit} className="grid md:grid-cols-4 gap-3 items-end bg-white rounded-2xl p-4 border">
        <div>
          <label className="block text-sm mb-1">Start</label>
          <DatePicker
            selected={startAt}
            onChange={onStartChange}        
            showTimeSelect
            selectsStart                   
            startDate={startAt}
            endDate={endAt}
            dateFormat="Pp"
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">End</label>
          <DatePicker
            selected={endAt}
            onChange={onEndChange}
            showTimeSelect
            minDate={startAt || undefined}
            dateFormat="Pp"
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Type</label>
          <select value={visitType} onChange={e => setVisitType(e.target.value)} className="w-full border rounded p-2">
            <option value="telehealth">Telehealth</option>
            <option value="in_person">In-person</option>
          </select>
        </div>

        {visitType === "in_person" && (
          <div>
            <label className="block text-sm mb-1">Facility ID</label>
            <input
              type="number"
              value={facilityId}
              onChange={e => setFacilityId(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="e.g. 1"
            />
          </div>
        )}



        <div className="md:col-span-4">
          <label className="block text-sm mb-1">Notes</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} className="w-full border rounded p-2" placeholder="Optional" />
        </div>
        <div className="md:col-span-4">
          <button type="submit" className="px-4 py-2 rounded bg-teal-600 text-white">Add Slot</button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">When</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Notes</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(s => (
              <tr key={s.id} className="border-t">
                <td className="px-3 py-2">
                  {new Date(s.start_at).toLocaleString()} – {new Date(s.end_at).toLocaleTimeString()}
                </td>
                <td className="px-3 py-2">{s.visit_type}</td>
                <td className="px-3 py-2">{s.notes || "-"}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => remove(s.id)} className="px-3 py-1 rounded border">Delete</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="px-3 py-4 text-gray-500" colSpan={4}>No slots yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
