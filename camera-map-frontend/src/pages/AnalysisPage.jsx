import { useEffect, useMemo, useState } from "react";
import { getCamerasGeoJson, getVideos } from "../api";

const pageStyle = {
  minHeight: "100vh",
  background: "#f3f4f6",
  padding: "32px 20px",
  boxSizing: "border-box",
};

const containerStyle = {
  maxWidth: "1280px",
  margin: "0 auto",
};

const topBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "24px",
  flexWrap: "wrap",
};

const titleStyle = {
  fontSize: "32px",
  fontWeight: 800,
  color: "#111827",
  margin: 0,
};

const subtitleStyle = {
  fontSize: "15px",
  color: "#6b7280",
  marginTop: "6px",
};

const actionsStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const primaryButtonStyle = {
  border: "none",
  borderRadius: "12px",
  padding: "12px 18px",
  cursor: "pointer",
  fontWeight: 700,
  background: "#111827",
  color: "#ffffff",
};

const secondaryButtonStyle = {
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  padding: "12px 18px",
  cursor: "pointer",
  fontWeight: 700,
  background: "#ffffff",
  color: "#111827",
};

const errorStyle = {
  background: "#fee2e2",
  border: "1px solid #fecaca",
  color: "#991b1b",
  padding: "12px 14px",
  borderRadius: "12px",
  marginBottom: "16px",
};

const loadingStyle = {
  fontSize: "16px",
  color: "#6b7280",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
  marginBottom: "24px",
};

const statCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  padding: "20px",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
};

const statValueStyle = {
  fontSize: "32px",
  fontWeight: 800,
  color: "#111827",
  marginBottom: "8px",
};

const statLabelStyle = {
  fontSize: "14px",
  color: "#6b7280",
};

const contentGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
};

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  padding: "20px",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
};

const sectionTitleStyle = {
  fontSize: "22px",
  fontWeight: 800,
  color: "#111827",
  margin: "0 0 16px 0",
};

const listStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const itemStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "14px",
  background: "#f9fafb",
};

const itemTitleStyle = {
  fontSize: "16px",
  fontWeight: 800,
  color: "#111827",
  marginBottom: "6px",
};

const itemMetaStyle = {
  fontSize: "14px",
  color: "#6b7280",
  marginBottom: "4px",
  wordBreak: "break-word",
};

const emptyStyle = {
  padding: "24px",
  borderRadius: "16px",
  background: "#f9fafb",
  border: "1px dashed #d1d5db",
  color: "#6b7280",
  textAlign: "center",
};

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString("ru-RU");
  } catch {
    return value;
  }
}

function normalizeCamera(feature) {
  const properties = feature?.properties || {};

  return {
    id: properties.id || "",
    camera_id: properties.camera_id || "—",
    camera_name: properties.camera_name || "Без названия",
    camera_place: properties.camera_place || "",
    model: properties.model || "",
    camera_type: properties.camera_type || "",
    camera_class: properties.camera_class || "",
    videos_count: Number(properties.videos_count || 0),
    has_video: Boolean(properties.has_video),
  };
}

export default function AnalysisPage({ onBack, onOpenProfile, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cameras, setCameras] = useState([]);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError("");

      const [camerasData, videosData] = await Promise.all([
        getCamerasGeoJson(),
        getVideos(),
      ]);

      const features = Array.isArray(camerasData?.features)
        ? camerasData.features
        : [];

      const normalizedCameras = features.map(normalizeCamera);
      const normalizedVideos = Array.isArray(videosData) ? videosData : [];

      setCameras(normalizedCameras);
      setVideos(normalizedVideos);
    } catch (e) {
      console.error("Ошибка загрузки аналитики:", e);
      setError(e.message || "Ошибка загрузки аналитики");
      setCameras([]);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const totalCameras = cameras.length;
    const totalVideos = videos.length;
    const camerasWithVideo = cameras.filter((camera) => camera.videos_count > 0).length;

    const uniqueUsers = new Set(
      videos
        .map((video) => video.user_email || video.user_full_name || video.user_name)
        .filter(Boolean)
    ).size;

    let topCamera = null;
    for (const camera of cameras) {
      if (!topCamera || camera.videos_count > topCamera.videos_count) {
        topCamera = camera;
      }
    }

    return {
      totalCameras,
      totalVideos,
      camerasWithVideo,
      uniqueUsers,
      topCamera,
    };
  }, [cameras, videos]);

  const latestVideos = useMemo(() => {
    return [...videos]
      .sort((a, b) => {
        const aTime = a?.uploaded_at ? new Date(a.uploaded_at).getTime() : 0;
        const bTime = b?.uploaded_at ? new Date(b.uploaded_at).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [videos]);

  const topCameras = useMemo(() => {
    return [...cameras]
      .sort((a, b) => b.videos_count - a.videos_count)
      .slice(0, 5);
  }, [cameras]);

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div style={loadingStyle}>Загрузка аналитики...</div>
        </div>
      </div>
    );
  }

  const isMobile =
    typeof window !== "undefined" ? window.innerWidth < 1000 : false;

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={topBarStyle}>
          <div>
            <h1 style={titleStyle}>Аналитика</h1>
            <div style={subtitleStyle}>
              Сводная информация по камерам, пользователям и загруженным видео
            </div>
          </div>

          <div style={actionsStyle}>
            <button style={secondaryButtonStyle} onClick={onBack}>
              Назад к карте
            </button>
            <button style={secondaryButtonStyle} onClick={onOpenProfile}>
              Личный кабинет
            </button>
            <button style={primaryButtonStyle} onClick={onLogout}>
              Выйти
            </button>
          </div>
        </div>

        {error ? <div style={errorStyle}>{error}</div> : null}

        <div style={statsGridStyle}>
          <div style={statCardStyle}>
            <div style={statValueStyle}>{stats.totalCameras}</div>
            <div style={statLabelStyle}>Всего камер</div>
          </div>

          <div style={statCardStyle}>
            <div style={statValueStyle}>{stats.totalVideos}</div>
            <div style={statLabelStyle}>Всего видео</div>
          </div>

          <div style={statCardStyle}>
            <div style={statValueStyle}>{stats.camerasWithVideo}</div>
            <div style={statLabelStyle}>Камер с видео</div>
          </div>

          <div style={statCardStyle}>
            <div style={statValueStyle}>{stats.uniqueUsers}</div>
            <div style={statLabelStyle}>Пользователей с загрузками</div>
          </div>
        </div>

        <div
          style={{
            ...contentGridStyle,
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          }}
        >
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Топ камер по количеству видео</h2>

            {topCameras.length === 0 ? (
              <div style={emptyStyle}>Пока нет данных по камерам</div>
            ) : (
              <div style={listStyle}>
                {topCameras.map((camera) => (
                  <div key={camera.id || camera.camera_id} style={itemStyle}>
                    <div style={itemTitleStyle}>{camera.camera_name}</div>
                    <div style={itemMetaStyle}>ID: {camera.camera_id}</div>
                    <div style={itemMetaStyle}>
                      Количество видео: {camera.videos_count}
                    </div>
                    <div style={itemMetaStyle}>
                      Модель: {camera.model || "—"}
                    </div>
                    <div style={itemMetaStyle}>
                      Тип: {camera.camera_type || "—"}
                    </div>
                    <div style={itemMetaStyle}>
                      Класс: {camera.camera_class || "—"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Последние загруженные видео</h2>

            {latestVideos.length === 0 ? (
              <div style={emptyStyle}>Пока нет загруженных видео</div>
            ) : (
              <div style={listStyle}>
                {latestVideos.map((video, index) => (
                  <div key={video.id || video.storage_key || index} style={itemStyle}>
                    <div style={itemTitleStyle}>
                      {video.filename || "Без названия"}
                    </div>
                    <div style={itemMetaStyle}>
                      Пользователь:{" "}
                      {video.user_full_name ||
                        video.user_name ||
                        video.owner_name ||
                        "Неизвестно"}
                    </div>
                    <div style={itemMetaStyle}>
                      Email: {video.user_email || "—"}
                    </div>
                    <div style={itemMetaStyle}>
                      Камера ID: {video.camera_id || "—"}
                    </div>
                    <div style={itemMetaStyle}>
                      Статус: {video.status || "uploaded"}
                    </div>
                    <div style={itemMetaStyle}>
                      Загружено: {formatDate(video.uploaded_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ ...cardStyle, marginTop: "20px" }}>
          <h2 style={sectionTitleStyle}>Главный вывод</h2>

          {stats.topCamera ? (
            <div style={itemStyle}>
              <div style={itemTitleStyle}>
                Самая активная камера: {stats.topCamera.camera_name}
              </div>
              <div style={itemMetaStyle}>
                ID камеры: {stats.topCamera.camera_id}
              </div>
              <div style={itemMetaStyle}>
                Количество видео: {stats.topCamera.videos_count}
              </div>
              <div style={itemMetaStyle}>
                Это можно показать на защите как базовую аналитику по системе.
              </div>
            </div>
          ) : (
            <div style={emptyStyle}>Недостаточно данных для вывода</div>
          )}
        </div>
      </div>
    </div>
  );
}