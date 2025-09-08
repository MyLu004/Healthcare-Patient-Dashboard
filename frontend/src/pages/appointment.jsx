import { useEffect, useState, useCallback, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  myAppointments,
  createAppointment,
  listAvailability,
  cancelAppointment,
} from "../lib/api";
import AdminAppointmentsTable from "../components/AdminAppointmentsTable";
import ProviderCalendar from "../components/ProviderCalendar";

import { VapiWidget } from "@vapi-ai/client-sdk-react";

function getRole() {
  return (
    localStorage.getItem("role") ||
    sessionStorage.getItem("role") ||
    "patient"
  );
}

console.log("Vapi env", import.meta.env.VITE_VAPI_PUBLIC_KEY, import.meta.env.VITE_VAPI_ASSISTANT_ID);


export default function Appointment() {
  const role = getRole(); // useMemo not needed here
  if (role === "provider") return <ProviderView />;
  if (role === "staff") return <StaffView />;
  return <PatientView />;
}

// ---------- Patient ----------
function PatientView() {
  const [appointments, setAppointments] = useState([]);
  const [providerId, setProviderId] = useState("");
  const [startAt, setStartAt] = useState(null);
  const [endAt, setEndAt] = useState(null);
  const [visitType, setVisitType] = useState("telehealth");
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  const me = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("me") || "{}"); }
    catch { return {}; }
  }, []);

  // Fetch my appointments (hide denied/cancelled)
  const loadMine = useCallback(async () => {
    try {
      setLoading(true);
      const list = await myAppointments();
      const filtered = (list || []).filter(
        (a) => a.status !== "denied" && a.status !== "cancelled"
      );
      setAppointments(filtered);
    } catch {
      alert("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMine(); }, [loadMine]);

  async function findSlots() {
    if (!providerId) return alert("Enter provider ID");
    const list = await listAvailability({
      provider_id: Number(providerId),
      start_from: new Date().toISOString(),
    });
    setSlots(list || []);
  }

  async function requestAppt(e) {
    e.preventDefault();
    if (!providerId || !startAt || !endAt) return alert("Fill provider + time");
    try {
      await createAppointment({
        provider_id: Number(providerId),
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        visit_type: visitType,
        reason: "",
      });
      setStartAt(null); setEndAt(null);
      await loadMine();
      alert("Appointment requested!");
    } catch (err) {
      alert(err.message);
    }
  }

  async function requestFromSlot(slot) {
    try {
      await createAppointment({
        provider_id: slot.provider_id,
        start_at: slot.start_at,
        end_at: slot.end_at,
        visit_type: slot.visit_type,
        availability_id: slot.id,
        reason: "",
        location: slot.location || null,
        facility_id: slot.facility_id ?? null,
      });
      await loadMine();
      alert("Appointment requested from slot!");
    } catch (e) {
      alert(e.message);
    }
  }

  async function onCancel(id) {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await cancelAppointment(id);
      await loadMine();
      alert("Appointment cancelled");
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="space-y-6 m-5">
      <h2 className="text-3xl font-bold">Appointments</h2>

      {/* Request form */}
      <form onSubmit={requestAppt} className="bg-white shadow-soft rounded-2xl p-6 border space-y-4">
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm mb-1">Provider ID</label>
            <input
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="e.g. 42"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Start</label>
            <DatePicker
              selected={startAt}
              onChange={setStartAt}
              showTimeSelect
              dateFormat="Pp"
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">End</label>
            <DatePicker
              selected={endAt}
              onChange={setEndAt}
              showTimeSelect
              dateFormat="Pp"
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Type</label>
            <select
              value={visitType}
              onChange={(e) => setVisitType(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="telehealth">Telehealth</option>
              <option value="in_person">In-person</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded bg-teal-600 text-white" type="submit">
            Request Appointment
          </button>
          <button className="px-4 py-2 rounded border" type="button" onClick={findSlots}>
            Find Provider Slots
          </button>
        </div>
      </form>

      {/* Available slots */}
      {slots.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Available Slots</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {slots.map((s) => (
              <div key={s.id} className="border rounded-xl p-3 flex items-center justify-between bg-white">
                <div>
                  <div className="font-medium">{new Date(s.start_at).toLocaleString()}</div>
                  <div className="text-sm text-gray-600">
                    {s.visit_type}{s.location ? ` • ${s.location}` : ""}
                  </div>
                </div>
                <button onClick={() => requestFromSlot(s)} className="px-3 py-1 rounded bg-teal-600 text-white">
                  Request
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My upcoming */}
      <section className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">My Upcoming</h3>
          <button
            onClick={loadMine}
            disabled={loading}
            className="px-4 py-2 rounded border bg-white hover:bg-gray-100 disabled:opacity-60"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-xl">
            No upcoming appointments.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {appointments.map((a) => (
              <div key={a.id} className="bg-white shadow-soft rounded-2xl p-4 border">
                <div className="font-medium">{new Date(a.start_at).toLocaleString()}</div>
                <div className="text-sm text-gray-600">
                  Provider #{a.provider_id} • {a.visit_type} •{" "}
                  <span className={
                    a.status === "confirmed" ? "text-green-600 font-medium"
                    : a.status === "requested" ? "text-yellow-600 font-medium"
                    : "text-gray-500"
                  }>
                    {a.status}
                  </span>
                </div>
                {a.reason && <div className="text-gray-500 text-sm mt-1">{a.reason}</div>}
                <div className="mt-2">
                  {(a.status === "requested" || a.status === "confirmed") && (
                    <button onClick={() => onCancel(a.id)} className="px-3 py-1 rounded border text-red-600 hover:bg-red-50">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <VapiWidget
        enabled
        publicKey={import.meta.env.VITE_VAPI_PUBLIC_KEY}
        mode="voice"
        assistant={{
          id: import.meta.env.VITE_VAPI_ASSISTANT_ID,
          overrides: {
            variableValues: {
              patientId: me?.id || null,
              patientEmail: me?.email || null,
            },
          },
        }}
        onCallStart={() => console.log("Vapi call started")}
        onCallEnd={() => {
          console.log("Vapi call ended");
          loadMine(); // refresh your list
        }}
        onError={(e) => console.error("Vapi error detail", e)}
      />
      
    </div>
  );
}

// ---------- Provider ----------
function ProviderView() {
  return (
    <div className="space-y-10 m-5">
      <ProviderCalendar />
      <AdminAppointmentsTable />
    </div>
  );
}

// ---------- Staff ----------
function StaffView() {
  return (
    <div className="space-y-10 m-5">
      <h2 className="text-3xl font-bold">Provider Console (Staff View)</h2>
      <AdminAppointmentsTable />
    </div>
  );
}
