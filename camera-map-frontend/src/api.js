const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function parseError(response, defaultMessage) {
  try {
    const data = await response.json();

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data?.detail)) {
      return data.detail.map((item) => item?.msg || JSON.stringify(item)).join(", ");
    }

    if (typeof data?.message === "string") {
      return data.message;
    }

    return defaultMessage;
  } catch {
    try {
      const text = await response.text();
      return text || defaultMessage;
    } catch {
      return defaultMessage;
    }
  }
}

export async function registerUser(payload) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Ошибка регистрации"));
  }

  return response.json();
}

export async function loginUser(payload) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Ошибка входа"));
  }

  return response.json();
}

export async function getMe(token) {
  const realToken = token || localStorage.getItem("access_token") || "";

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${realToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Не удалось загрузить профиль"));
  }

  return response.json();
}

export async function getCamerasGeoJson(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.hasVideo === true) {
    searchParams.set("has_video", "true");
  }

  if (params.minVideos !== undefined && params.minVideos !== null && params.minVideos !== "") {
    searchParams.set("min_videos", String(params.minVideos));
  }

  const query = searchParams.toString();
  const url = query
    ? `${API_URL}/cameras/geojson?${query}`
    : `${API_URL}/cameras/geojson`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(await parseError(response, "Не удалось загрузить камеры"));
  }

  return response.json();
}

export async function getVideos(token) {
  const realToken = token || localStorage.getItem("access_token") || "";

  const response = await fetch(`${API_URL}/videos/`, {
    headers: realToken
      ? {
          Authorization: `Bearer ${realToken}`,
        }
      : {},
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Не удалось загрузить видео"));
  }

  return response.json();
}

export async function uploadVideo({ token, file, cameraId, latitude, longitude }) {
  const realToken = token || localStorage.getItem("access_token") || "";

  const formData = new FormData();
  formData.append("file", file);

  if (cameraId) {
    formData.append("camera_id", cameraId);
  }

  if (latitude !== undefined && latitude !== null && latitude !== "") {
    formData.append("latitude", String(latitude));
  }

  if (longitude !== undefined && longitude !== null && longitude !== "") {
    formData.append("longitude", String(longitude));
  }

  const response = await fetch(`${API_URL}/videos/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${realToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Ошибка загрузки видео"));
  }

  return response.json();
}

export async function uploadVideoForCamera({
  token,
  file,
  cameraId,
  latitude,
  longitude,
}) {
  return uploadVideo({
    token,
    file,
    cameraId,
    latitude,
    longitude,
  });
}

export async function deleteVideo(videoId, token) {
  const realToken = token || localStorage.getItem("access_token") || "";

  const response = await fetch(`${API_URL}/videos/${videoId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${realToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Ошибка удаления видео"));
  }

  return true;
}