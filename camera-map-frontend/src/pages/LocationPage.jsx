import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { deleteVideo, getVideos, uploadVideoForCamera } from "../api";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const pageStyle = {
  minHeight: "100vh",
  background: "#f3f4f6",
  padding: "24px 16px",
  boxSizing: "border-box",
};

const containerStyle = {
  maxWidth: "1400px",
  margin: "0 auto",
};

const topBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "18px",
  flexWrap: "wrap",
};

const titleStyle = {
  margin: 0,
  fontSize: "28px",
  fontWeight: 800,
  color: "#111827",
};

const buttonRowStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const primaryButtonStyle = {
  border: "none",
  borderRadius: "12px",
  padding: "12px 16px",
  cursor: "pointer",
  fontWeight: 700,
  background: "#2563eb",
  color: "#ffffff",
};

const secondaryButtonStyle = {
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  padding: "12px 16px",
  cursor: "pointer",
  fontWeight: 700,
  background: "#ffffff",
  color: "#111827",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "360px 1fr",
  gap: "20px",
  alignItems: "start",
};

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "20px",
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
};

const sectionTitleStyle = {
  margin: "0 0 14px 0",
  fontSize: "18px",
  fontWeight: 800,
  color: "#111827",
};

const infoTextStyle = {
  margin: "0 0 10px 0",
  color: "#374151",
  lineHeight: 1.5,
};

const dividerStyle = {
  border: 0,
  borderTop: "1px solid #e5e7eb",
  margin: "18px 0",
};

const uploadRowStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const uploadButtonStyle = {
  border: "none",
  borderRadius: "10px",
  padding: "12px 14px",
  cursor: "pointer",
  fontWeight: 700,
  background: "#2563eb",
  color: "#ffffff",
};

const disabledButtonStyle = {
  ...uploadButtonStyle,
  opacity: 0.6,
  cursor: "not-allowed",
};

const mapWrapperStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "20px",
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
};

const mapStyle = {
  width: "100%",
  height: "620px",
  borderRadius: "14px",
  overflow: "hidden",
};

const videoCardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "14px",
  marginBottom: "12px",
  background: "#f9fafb",
};

const videoTitleStyle = {
  margin: "0 0 10px 0",
  fontSize: "16px",
  fontWeight: 800,
  color: "#111827",
  wordBreak: "break-word",
};

const metaStyle = {
  margin: "0 0 8px 0",
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: 1.4,
};

const videoButtonRowStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "12px",
};

const openButtonStyle = {
  border: "none",
  borderRadius: "10px",
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 700,
  background: "#0f172a",
  color: "#ffffff",
};

const dangerButtonStyle = {
  border: "1px solid #fca5a5",
  borderRadius: "10px",
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 700,
  background: "#ffffff",
  color: "#dc2626",
};

const errorStyle = {
  marginTop: "12px",
  color: "#dc2626",
  fontWeight: 600,
};

const successStyle = {
  marginTop: "12px",
  color: "#059669",
  fontWeight: 600,
};

function formatDate(value) {
  if (!value) {
    return "—";
  }

  try {
    return new Date(value).toLocaleString("ru-RU");
  } catch {
    return value;
  }
}

function getCameraCoords(location) {
  const lat =
    Number(location?.camera_latitude) ||
    Number(location?.latitude) ||
    Number(location?.lat) ||
    Number(location?.properties?.camera_latitude) ||
    Number(location?.properties?.latitude);

  const lng =
    Number(location?.camera_longitude) ||
    Number(location?.longitude) ||
    Number(location?.lng) ||
    Number(location?.properties?.camera_longitude) ||
    Number(location?.properties?.longitude);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return [lat, lng];
  }

  const coordinates = location?.geometry?.coordinates;

  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    const [geoLng, geoLat] = coordinates.map(Number);

    if (Number.isFinite(geoLat) && Number.isFinite(geoLng)) {
      return [geoLat, geoLng];
    }
  }

  return [55.751244, 37.618423];
}

function matchesCamera(video, location, cameraId) {
  const values = [
    video?.camera_id,
    video?.camera?.camera_id,
    video?.camera?.id,
    video?.camera_identifier,
    video?.cameraId,
    video?.camera?.cameraId,

    location?.id,
    location?.camera_id,
    location?.properties?.id,
    location?.properties?.camera_id,
  ]
    .filter(Boolean)
    .map(String);

  const leftSide = [
    video?.camera_id,
    video?.camera?.camera_id,
    video?.camera?.id,
    video?.camera_identifier,
    video?.cameraId,
    video?.camera?.cameraId,
  ]
    .filter(Boolean)
    .map(String);

  const rightSide = [
    cameraId,
    location?.id,
    location?.camera_id,
    location?.properties?.id,
    location?.properties?.camera_id,
  ]
    .filter(Boolean)
    .map(String);

  return leftSide.some((left) => rightSide.includes(left)) || values.includes(String(cameraId));
}

export default function LocationPage({
  location,
  token,
  onBack,
  onOpenProfile,
  onLogout,
}) {
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [videosError, setVideosError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [deletingId, setDeletingId] = useState("");

  const authToken = token || localStorage.getItem("access_token") || "";
  const coords = useMemo(() => getCameraCoords(location), [location]);
  const [lat, lng] = coords;

  const cameraId =
    location?.camera_id ||
    location?.properties?.camera_id ||
    location?.id ||
    location?.properties?.id ||
    "";

  const cameraName =
    location?.camera_name ||
    location?.properties?.camera_name ||
    "Камера";

  async function loadVideos() {
    try {
      setLoadingVideos(true);
      setVideosError("");

      const data = await getVideos(authToken);
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : [];

      const filtered = items.filter((video) => matchesCamera(video, location, cameraId));

      filtered.sort((a, b) => {
        const aTime = new Date(a?.uploaded_at || 0).getTime();
        const bTime = new Date(b?.uploaded_at || 0).getTime();
        return bTime - aTime;
      });

      setVideos(filtered);
    } catch (error) {
      console.error("Ошибка загрузки видео камеры:", error);
      setVideos([]);
      setVideosError(error.message || "Не удалось загрузить видео этой камеры");
    } finally {
      setLoadingVideos(false);
    }
  }

  useEffect(() => {
    loadVideos();
  }, [cameraId]);

  async function handleUpload(event) {
    event.preventDefault();

    if (!authToken) {
      setUploadError("Нет access token. Войди в систему заново.");
      setUploadSuccess("");
      return;
    }

    if (!selectedFile) {
      setUploadError("Сначала выбери mp4 файл");
      setUploadSuccess("");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      setUploadSuccess("");

      await uploadVideoForCamera({
        token: authToken,
        file: selectedFile,
        cameraId,
        latitude: lat,
        longitude: lng,
      });

      const input = document.getElementById("camera-video-upload-input");
      if (input) {
        input.value = "";
      }

      setSelectedFile(null);
      setUploadSuccess("Видео успешно загружено");
      await loadVideos();
    } catch (error) {
      console.error("Ошибка загрузки видео:", error);
      setUploadError(error.message || "Не удалось загрузить видео");
      setUploadSuccess("");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(videoId) {
    const confirmed = window.confirm("Удалить это видео?");
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(videoId);
      await deleteVideo(videoId, authToken);
      await loadVideos();
    } catch (error) {
      console.error("Ошибка удаления видео:", error);
      alert(error.message || "Не удалось удалить видео");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={topBarStyle}>
          <h1 style={titleStyle}>{cameraName}</h1>

          <div style={buttonRowStyle}>
            <button type="button" style={secondaryButtonStyle} onClick={onOpenProfile}>
              Личный кабинет
            </button>
            <button type="button" style={secondaryButtonStyle} onClick={onLogout}>
              Выйти
            </button>
            <button type="button" style={primaryButtonStyle} onClick={onBack}>
              Назад к карте
            </button>
          </div>
        </div>

        <div style={gridStyle}>
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Информация о камере</h2>

            <p style={infoTextStyle}>
              <strong>ID камеры:</strong> {cameraId || "—"}
            </p>
            <p style={infoTextStyle}>
              <strong>Координаты:</strong> {lat}, {lng}
            </p>
            <p style={infoTextStyle}>
              <strong>Видео:</strong> {videos.length}
            </p>

            <hr style={dividerStyle} />

            <h2 style={sectionTitleStyle}>Импорт видео</h2>

            <form onSubmit={handleUpload} style={uploadRowStyle}>
              <input
                id="camera-video-upload-input"
                type="file"
                accept="video/mp4"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setSelectedFile(file);
                  setUploadError("");
                  setUploadSuccess("");
                }}
              />

              <button
                type="submit"
                style={uploading ? disabledButtonStyle : uploadButtonStyle}
                disabled={uploading}
              >
                {uploading ? "Загрузка..." : "Загрузить видео"}
              </button>
            </form>

            {uploadError ? <div style={errorStyle}>{uploadError}</div> : null}
            {uploadSuccess ? <div style={successStyle}>{uploadSuccess}</div> : null}

            <hr style={dividerStyle} />

            <h2 style={sectionTitleStyle}>Видео этой камеры</h2>

            {loadingVideos ? <p style={metaStyle}>Загрузка видео...</p> : null}
            {videosError ? <p style={errorStyle}>{videosError}</p> : null}

            {!loadingVideos && !videosError && videos.length === 0 ? (
              <p style={metaStyle}>У этой камеры пока нет загруженных видео.</p>
            ) : null}

            {!loadingVideos &&
              !videosError &&
              videos.map((video) => {
                const openUrl =
                  video?.file_url ||
                  video?.video_url ||
                  video?.url ||
                  video?.public_url ||
                  video?.download_url;

                return (
                  <div key={video.id} style={videoCardStyle}>
                    <h3 style={videoTitleStyle}>{video.filename || "video.mp4"}</h3>

                    <p style={metaStyle}>
                      <strong>Статус:</strong> {video.status || "uploaded"}
                    </p>

                    <p style={metaStyle}>
                      <strong>Загружено:</strong> {formatDate(video.uploaded_at)}
                    </p>

                    <div style={videoButtonRowStyle}>
                      {openUrl ? (
                        <a
                          href={openUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ textDecoration: "none" }}
                        >
                          <button type="button" style={openButtonStyle}>
                            Открыть
                          </button>
                        </a>
                      ) : null}

                      <button
                        type="button"
                        style={dangerButtonStyle}
                        onClick={() => handleDelete(video.id)}
                        disabled={deletingId === video.id}
                      >
                        {deletingId === video.id ? "Удаление..." : "Удалить"}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          <div style={mapWrapperStyle}>
            <h2 style={sectionTitleStyle}>Положение на карте</h2>

            <div style={mapStyle}>
              <MapContainer
                center={[lat, lng]}
                zoom={15}
                scrollWheelZoom={true}
                style={{ width: "100%", height: "100%" }}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker position={[lat, lng]}>
                  <Popup>
                    <div>
                      <strong>{cameraName}</strong>
                      <br />
                      ID: {cameraId}
                      <br />
                      Координаты: {lat}, {lng}
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}