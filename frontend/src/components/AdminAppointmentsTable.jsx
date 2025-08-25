// src/components/AdminAppointmentsTable.jsx
import { useEffect, useState } from "react";
import {
  providerAppointments,
  approveAppointment,
  cancelAppointment,
} from "../lib/api";

export default function AdminAppointmentsTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const list = await providerAppointments(); // your backend: only this provider
      setRows(list || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleApprove(id) {
    try {
      await approveAppointment(id);
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleCancel(id) {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await cancelAppointment(id);
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  const pending = rows.filter(r => r.status === "requested");
  const upcoming = rows.filter(r => r.status === "confirmed");

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-xl font-semibold mb-2">Pending Requests</h3>
        {loading ? (
          <div>Loading…</div>
        ) : pending.length === 0 ? (
          <div className="text-gray-500">No pending requests.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">When</th>
                  <th className="px-3 py-2 text-left">Patient</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Reason</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {pending.map(a => (
                  <tr key={a.id} className="border-t">
                    <td className="px-3 py-2">
                      {new Date(a.start_at).toLocaleString()} – {new Date(a.end_at).toLocaleTimeString()}
                    </td>
                    <td className="px-3 py-2">#{a.patient_id}</td>
                    <td className="px-3 py-2">{a.visit_type}</td>
                    <td className="px-3 py-2">{a.reason || "-"}</td>
                    <td className="px-3 py-2 space-x-2 text-right">
                      <button onClick={() => handleApprove(a.id)} className="px-3 py-1 rounded bg-teal-600 text-white">Approve</button>
                      <button onClick={() => handleCancel(a.id)} className="px-3 py-1 rounded border">Cancel</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-2">Upcoming (Confirmed)</h3>
        {upcoming.length === 0 ? (
          <div className="text-gray-500">No upcoming confirmed visits.</div>
        ) : (
          <ul className="space-y-2">
            {upcoming.map(a => (
              <li key={a.id} className="border rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{new Date(a.start_at).toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Patient #{a.patient_id} • {a.visit_type}</div>
                </div>
                <button onClick={() => handleCancel(a.id)} className="px-3 py-1 rounded border">Cancel</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
