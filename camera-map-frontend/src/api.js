const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function parseError(response, defaultMessage) {
  try {
    const data = await response.json();
    return data?.detail || defaultMessage;
  } catch {
    return defaultMessage;
  }
}

// ===== AUTH =====

export async function loginUser(payload) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseError(res, "Ошибка входа"));
  }

  return res.json();
}

export async function registerUser(payload) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseError(res, "Ошибка регистрации"));
  }

  return res.json();
}

export async function getMe(token) {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    throw new Error("INVALID_TOKEN");
  }

  if (!res.ok) {
    throw new Error(await parseError(res, "Ошибка получения пользователя"));
  }

  return res.json();
}

// ===== CAMERAS =====

export async function getCamerasGeoJson(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.min_videos !== undefined && params.min_videos !== null && params.min_videos !== "") {
    searchParams.set("min_videos", String(params.min_videos));
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `${API_URL}/cameras/geojson?${queryString}`
    : `${API_URL}/cameras/geojson`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(await parseError(res, "Ошибка получения камер"));
  }

  return res.json();
}

// ===== VIDEOS =====

export async function getVideos(token) {
  const res = await fetch(`${API_URL}/videos`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    throw new Error("INVALID_TOKEN");
  }

  if (!res.ok) {
    throw new Error(await parseError(res, "Ошибка получения видео"));
  }

  return res.json();
}

export async function deleteVideo(videoId, token) {
  const res = await fetch(`${API_URL}/videos/${videoId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    throw new Error("INVALID_TOKEN");
  }

  if (!res.ok) {
    throw new Error(await parseError(res, "Ошибка удаления видео"));
  }

  return true;
}