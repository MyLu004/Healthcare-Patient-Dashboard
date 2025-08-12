//const BASE_URL =import.meta.env.VITE_API_URL; // or your deployed backend URL

// api.js : organize and centralize all the coded for communicating with application's backend API

  // WHY
  // - centralization : all the API call logic live in one place, easy to maintainable
  // - resuability : components can just call the function instead of repeating in different file
  // - maintainablitity : easy to update URL if there is anything change
  // - abstraction 

//const BASE_URL = "https://healthcare-patient-dashboard.onrender.com"

const BASE_URL = "http://127.0.0.1:8000"
// Helper to get the token from localStorage (or wherever you store it)
function getToken() {
  return localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
}

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