import { useEffect, useMemo, useState } from "react";
import { getCamerasGeoJson, getVideos } from "../api";

const pageStyle = {
  minHeight: "100vh",
  background: "#f3f4f6",
  padding: "24px",
  boxSizing: "border-box",
};

const containerStyle = {
  maxWidth: "1400px",
  margin: "0 auto",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "24px",
  flexWrap: "wrap",
};

const titleStyle = {
  margin: 0,
  fontSize: "32px",
  fontWeight: 800,
  color: "#111827",
};

const subtitleStyle = {
  margin: "6px 0 0 0",
  color: "#6b7280",
  fontSize: "15px",
};

const actionsStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const primaryButtonStyle = {
  border: "none",
  borderRadius: "12px",
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: 700,
  background: "#111827",
  color: "#ffffff",
};

const secondaryButtonStyle = {
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  padding: "10px 16px",
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
  padding: "18px",
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
};

const sectionTitleStyle = {
  margin: "0 0 16px 0",
  fontSize: "20px",
  fontWeight: 800,
  color: "#111827",
};

const searchStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  outline: "none",
  fontSize: "14px",
  marginBottom: "14px",
};

const cameraListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const cameraButtonStyle = (active) => ({
  width: "100%",
  textAlign: "left",
  border: active ? "2px solid #111827" : "1px solid #e5e7eb",
  background: active ? "#f9fafb" : "#ffffff",
  borderRadius: "14px",
  padding: "14px",
  cursor: "pointer",
});

const cameraNameStyle = {
  fontSize: "16px",
  fontWeight: 700,
  color: "#111827",
  marginBottom: "6px",
};

const cameraMetaStyle = {
  fontSize: "13px",
  color: "#6b7280",
  lineHeight: 1.5,
};

const emptyStyle = {
  padding: "18px",
  borderRadius: "14px",
  background: "#f9fafb",
  border: "1px dashed #d1d5db",
  color: "#6b7280",
  fontSize: "14px",
};

const selectedCameraBoxStyle = {
  marginBottom: "18px",
  padding: "16px",
  borderRadius: "14px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
};

const selectedCameraTitleStyle = {
  margin: "0 0 8px 0",
  fontSize: "22px",
  fontWeight: 800,
  color: "#111827",
};

const selectedCameraInfoStyle = {
  margin: 0,
  color: "#4b5563",
  lineHeight: 1.6,
  fontSize: "14px",
};

const videosGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "16px",
};

const videoCardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  overflow: "hidden",
  background: "#ffffff",
};

const previewStyle = {
  width: "100%",
  height: "180px",
  objectFit: "cover",
  background: "#e5e7eb",
  display: "block",
};

const videoContentStyle = {
  padding: "14px",
};

const videoTitleStyle = {
  margin: "0 0 10px 0",
  fontSize: "16px",
  fontWeight: 700,
  color: "#111827",
  wordBreak: "break-word",
};

const videoMetaStyle = {
  margin: "0 0 6px 0",
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: 1.5,
  wordBreak: "break-word",
};

const videoActionsStyle = {
  display: "flex",
  gap: "10px",
  marginTop: "14px",
  flexWrap: "wrap",
};

const linkButtonStyle = {
  display: "inline-block",
  textDecoration: "none",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  background: "#111827",
  color: "#ffffff",
};

const ghostLinkButtonStyle = {
  display: "inline-block",
  textDecoration: "none",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  background: "#ffffff",
  color: "#111827",
  border: "1px solid #d1d5db",
};

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function MapPage({ onLogout, onOpenProfile }) {
  const [cameras, setCameras] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [cameraSearch, setCameraSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [geojsonData, videosData] = await Promise.all([
          getCamerasGeoJson(),
          getVideos(),
        ]);

        const features = Array.isArray(geojsonData?.features)
          ? geojsonData.features
          : [];

        const videosList = Array.isArray(videosData) ? videosData : [];

        setCameras(features);
        setVideos(videosList);

        if (features.length > 0) {
          const firstCameraId = features[0]?.properties?.id || "";
          setSelectedCameraId(firstCameraId);
        }
      } catch (e) {
        console.error("Ошибка загрузки данных:", e);
        setError(e?.message || "Не удалось загрузить камеры и видео");
        setCameras([]);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredCameras = useMemo(() => {
    const search = cameraSearch.trim().toLowerCase();

    if (!search) {
      return cameras;
    }

    return cameras.filter((item) => {
      const props = item?.properties || {};

      return [
        props.camera_name,
        props.camera_id,
        props.camera_place,
        props.model,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }, [cameras, cameraSearch]);

  const selectedCamera = useMemo(() => {
    return (
      cameras.find((item) => item?.properties?.id === selectedCameraId) || null
    );
  }, [cameras, selectedCameraId]);

  const selectedCameraVideos = useMemo(() => {
    if (!selectedCameraId) {
      return [];
    }

    return videos.filter((video) => video.camera_id === selectedCameraId);
  }, [videos, selectedCameraId]);

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Карта с камерами и видео</h1>
            <p style={subtitleStyle}>
              Камеры, загруженные видео и быстрый просмотр по выбранной локации
            </p>
          </div>

          <div style={actionsStyle}>
            <button type="button" style={secondaryButtonStyle} onClick={onOpenProfile}>
              Личный кабинет
            </button>
            <button type="button" style={primaryButtonStyle} onClick={onLogout}>
              Выйти
            </button>
          </div>
        </div>

        {loading ? (
          <div style={cardStyle}>Загрузка данных...</div>
        ) : error ? (
          <div style={cardStyle}>{error}</div>
        ) : (
          <div style={gridStyle}>
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>Камеры</h2>

              <input
                type="text"
                placeholder="Поиск по названию камеры"
                value={cameraSearch}
                onChange={(e) => setCameraSearch(e.target.value)}
                style={searchStyle}
              />

              <div style={cameraListStyle}>
                {filteredCameras.length === 0 ? (
                  <div style={emptyStyle}>Камеры не найдены</div>
                ) : (
                  filteredCameras.map((camera) => {
                    const props = camera?.properties || {};
                    const isActive = props.id === selectedCameraId;

                    return (
                      <button
                        key={props.id}
                        type="button"
                        style={cameraButtonStyle(isActive)}
                        onClick={() => setSelectedCameraId(props.id)}
                      >
                        <div style={cameraNameStyle}>
                          {props.camera_name || "Без названия"}
                        </div>

                        <div style={cameraMetaStyle}>
                          <div>ID камеры: {props.camera_id || "—"}</div>
                          <div>Видео: {props.videos_count ?? 0}</div>
                          <div>
                            Координаты: {props.camera_latitude ?? "—"},{" "}
                            {props.camera_longitude ?? "—"}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>Видео по выбранной камере</h2>

              {selectedCamera ? (
                <>
                  <div style={selectedCameraBoxStyle}>
                    <h3 style={selectedCameraTitleStyle}>
                      {selectedCamera.properties?.camera_name || "Без названия"}
                    </h3>
                    <p style={selectedCameraInfoStyle}>
                      <strong>ID:</strong>{" "}
                      {selectedCamera.properties?.camera_id || "—"}
                      <br />
                      <strong>Количество видео:</strong>{" "}
                      {selectedCamera.properties?.videos_count ?? 0}
                      <br />
                      <strong>Широта:</strong>{" "}
                      {selectedCamera.properties?.camera_latitude ?? "—"}
                      <br />
                      <strong>Долгота:</strong>{" "}
                      {selectedCamera.properties?.camera_longitude ?? "—"}
                    </p>
                  </div>

                  {selectedCameraVideos.length === 0 ? (
                    <div style={emptyStyle}>
                      Для этой камеры пока нет видео
                    </div>
                  ) : (
                    <div style={videosGridStyle}>
                      {selectedCameraVideos.map((video) => (
                        <div key={video.id} style={videoCardStyle}>
                          {video.preview_url ? (
                            <img
                              src={video.preview_url}
                              alt={video.filename || "preview"}
                              style={previewStyle}
                            />
                          ) : (
                            <div style={previewStyle} />
                          )}

                          <div style={videoContentStyle}>
                            <h3 style={videoTitleStyle}>
                              {video.filename || "Без названия"}
                            </h3>

                            <p style={videoMetaStyle}>
                              <strong>Пользователь:</strong>{" "}
                              {video.user_full_name || video.user_email || "—"}
                            </p>

                            <p style={videoMetaStyle}>
                              <strong>Email:</strong> {video.user_email || "—"}
                            </p>

                            <p style={videoMetaStyle}>
                              <strong>Статус:</strong> {video.status || "—"}
                            </p>

                            <p style={videoMetaStyle}>
                              <strong>Дата загрузки:</strong>{" "}
                              {formatDate(video.uploaded_at)}
                            </p>

                            <div style={videoActionsStyle}>
                              {video.video_url ? (
                                <a
                                  href={video.video_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={linkButtonStyle}
                                >
                                  Смотреть видео
                                </a>
                              ) : null}

                              {video.preview_url ? (
                                <a
                                  href={video.preview_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={ghostLinkButtonStyle}
                                >
                                  Открыть превью
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={emptyStyle}>Выбери камеру слева</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}