const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function parseError(response, defaultMessage) {
  const error = await response.json().catch(() => ({}));
  throw new Error(error.detail || defaultMessage);
}

export async function loginUser(payload) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) await parseError(res, "Ошибка входа");
  return res.json();
}

export async function registerUser(payload) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) await parseError(res, "Ошибка регистрации");
  return res.json();
}

export async function getMe(token) {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) await parseError(res, "Ошибка пользователя");
  return res.json();
}

export async function getCamerasGeoJson() {
  const res = await fetch(`${API_BASE_URL}/cameras/geojson`);
  if (!res.ok) throw new Error("Ошибка камер");
  return res.json();
}

export async function getVideos(token, filters = {}) {
  const params = new URLSearchParams();

  if (filters.camera_id) params.append("camera_id", filters.camera_id);
  if (filters.title) params.append("title", filters.title);
  if (filters.user) params.append("user", filters.user);

  const url = `${API_BASE_URL}/videos/?${params.toString()}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) await parseError(res, "Ошибка видео");
  return res.json();
}

export async function uploadVideo(token, { file, camera_id }) {
  const form = new FormData();
  form.append("file", file);
  form.append("camera_id", camera_id);

  const res = await fetch(`${API_BASE_URL}/videos/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) await parseError(res, "Ошибка загрузки");
  return res.json();
}

export async function deleteVideo(token, id) {
  const res = await fetch(`${API_BASE_URL}/videos/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) await parseError(res, "Ошибка удаления");
}