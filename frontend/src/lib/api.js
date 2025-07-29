const BASE_URL = "http://localhost:8000"; // or your deployed backend URL

export async function fetchSummary(userId = 1) {
  const res = await fetch(`${BASE_URL}/vitals/summary?user_id=${userId}`);
  return res.json();
}

export async function fetchTrends(userId = 1) {
  const res = await fetch(`${BASE_URL}/vitals/trends?user_id=${userId}`);
  return res.json();
}

export async function fetchRecent(userId = 1) {
  const res = await fetch(`${BASE_URL}/vitals/recent?user_id=${userId}`);
  return res.json();
}

export async function postVital(data, userId = 1) {
  const res = await fetch(`${BASE_URL}/vitals?user_id=${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateVital(id, data, userId = 1) {
  const res = await fetch(`${BASE_URL}/vitals/${id}?user_id=${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function deleteVital(id, userId = 1) {
  const res = await fetch(`${BASE_URL}/vitals/${id}?user_id=${userId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw await res.json();
  return true;
}