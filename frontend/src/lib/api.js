//const BASE_URL =import.meta.env.VITE_API_URL; // or your deployed backend URL

// api.js : organize and centralize all the coded for communicating with application's backend API

  // WHY
  // - centralization : all the API call logic live in one place, easy to maintainable
  // - resuability : components can just call the function instead of repeating in different file
  // - maintainablitity : easy to update URL if there is anything change
  // - abstraction 

const BASE_URL = "https://healthcare-patient-dashboard.onrender.com"

//const BASE_URL = "http://127.0.0.1:8000"


// ======== HELPER FUNCTION ===============

// GET and SET token for the JWT token access
// Helper to get the token from localStorage or session storage
function getToken() {
  return localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
}
  
function setToken(token) {
  localStorage.setItem("accessToken", token);
}

// BUILD A QUERY STRING FROM AN OBJECT, SKIPPING EMPTY VALUE


// ```
//      How it Work?
//     - iterate over params
//     - appends only keys whose values aren't underfined, null or ""
// ```

function qs(params = {}) {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") u.append(k, v);
  });
  const s = u.toString();
  return s ? `?${s}` : "";
}
async function request(path, { method = "GET", body, auth = true, headers = {} } = {}) {
  const token = auth ? getToken() : null;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return true;

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text || null; }

  if (!res.ok) {
    const detail = (data && data.detail) ? data.detail : data;
    throw new Error(`${method} ${path} ${res.status}: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`);
  }
  return data;
}

// ========= auth =========
export async function login(email, password) {
  // matches OAuth2 Password flow at /login if you expose it
  const data = await request("/login", {
    method: "POST",
    auth: false,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: email, password }),
  });
  if (data?.access_token) setToken(data.access_token);
  return data;
}

// === regiser as patient ===
export async function registerPatient({ email, username, password }) {
  return request("/users", { method: "POST", body: { email, username, password } });
}
// == register as provider
export async function adminCreateProvider({ email, username, password }) {
  return request("/auth/admin/providers", { method: "POST", body: { email, username, password } });
}

// ========= facilities =========
export async function listFacilities() {
  return request("/facilities");
}
export async function createFacility(payload) { // staff-only server-side
  return request("/facilities", { method: "POST", body: payload });
}

// ========= availability =========
// Public/patient search (optional filters)
export async function listAvailability(filters = {}) {
  // filters: { provider_id, visit_type, start_from }
  return request(`/availability${qs(filters)}`);
}
// Provider’s own
export async function listMyAvailability() {
  return request("/availability/mine");
}
export async function createAvailability(payload) {
  // backend derives provider_id from token; payload should NOT include provider_id
  // payload: { start_at, end_at, visit_type, facility_id?, location?, capacity?, notes? }
  return request("/availability", { method: "POST", body: payload });
}
export async function updateAvailability(id, data) {
  return request(`/availability/${id}`, { method: "PATCH", body: data });
}
export async function deleteAvailability(id) {
  return request(`/availability/${id}`, { method: "DELETE" });
}

// ========= appointments =========
export async function myAppointments() {
  return request("/appointments/mine");
}
export async function providerAppointments(params = {}) {
  // params: { start_from }
  return request(`/appointments/provider${qs(params)}`);
}
export async function createAppointment(payload) {
  // payload: { provider_id, start_at, end_at, visit_type, facility_id?, reason?, availability_id?, location? }
  return request("/appointments", { method: "POST", body: payload });
}
export async function updateAppointment(id, data) {
  return request(`/appointments/${id}`, { method: "PATCH", body: data });
}
export async function approveAppointment(id) {
  return request(`/appointments/${id}/approve`, { method: "PATCH" });
}
export async function cancelAppointment(id) {
  return request(`/appointments/${id}/cancel`, { method: "PATCH" }); // returns 204 -> true
}


export async function listMyAppointments(activeOnly = true) {
  const res = await fetch(`/appointments/mine${activeOnly ? '?active_only=true' : ''}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
  if (!res.ok) throw new Error('Failed to load');
  return res.json();
}


// ======== vitals in the dashboard =========

export async function fetchSummary() {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/vitals/summary`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function fetchTrends(range = "7d") {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/vitals/trends?range=${range}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function fetchRecent(limit = 10) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/vitals/recent?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function postVital(data) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/vitals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateVital(id, data) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/vitals/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text(); // ← capture FastAPI detail
    throw new Error(`PUT /vitals/${id} ${res.status}: ${text}`);
  }
  return res.json();
}

export async function deleteVital(id) {
  console.log("[api] Deleting entry with ssID:", id);
  const token = getToken();
  const res = await fetch(`${BASE_URL}/vitals/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 204) {
    console.log("here")
    const text = await res.text();
    throw new Error(`DELETE /vitals/${id} ${res.status}: ${text}`);
  }
  return true;
}