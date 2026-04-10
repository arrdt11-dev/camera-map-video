const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function registerUser(payload) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Ошибка регистрации");
  }

  return response.json();
}

export async function loginUser(payload) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Ошибка входа");
  }

  return response.json();
}

export async function getMe(token) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Не удалось получить пользователя");
  }

  return response.json();
}

export async function getCamerasGeoJson() {
  const response = await fetch(`${API_BASE_URL}/cameras/geojson`, {
    method: "GET",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Не удалось получить GeoJSON камер");
  }

  return response.json();
}

export async function getVideos(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.title) {
    searchParams.append("title", params.title);
  }

  if (params.user) {
    searchParams.append("user", params.user);
  }

  if (params.camera_id) {
    searchParams.append("camera_id", params.camera_id);
  }

  const queryString = searchParams.toString();
  const url = `${API_BASE_URL}/videos/${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Не удалось получить список видео");
  }

  return response.json();
}

export async function uploadVideo({ token, cameraId, file }) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/videos/upload?camera_id=${encodeURIComponent(cameraId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Не удалось загрузить видео");
  }

  return response.json();
}

export async function deleteVideo({ token, videoId }) {
  const response = await fetch(`${API_BASE_URL}/videos/${videoId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Не удалось удалить видео");
  }

  return response.json();
}