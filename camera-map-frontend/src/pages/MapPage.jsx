import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function MapPage({ onLogout, onGoToProfile }) {
  const [videos, setVideos] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [selectedCameraName, setSelectedCameraName] = useState("");
  const [titleFilter, setTitleFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [videosError, setVideosError] = useState("");

  useEffect(() => {
    let map;
    let geoJsonLayer;

    map = L.map("map").setView([55.751244, 37.618423], 10);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    fetch(`${API_BASE_URL}/cameras/geojson`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Не удалось загрузить камеры");
        }
        return res.json();
      })
      .then((data) => {
        geoJsonLayer = L.geoJSON(data, {
          pointToLayer: (feature, latlng) => {
            const hasVideo = feature.properties.has_video;

            return L.circleMarker(latlng, {
              radius: hasVideo ? 10 : 5,
              color: hasVideo ? "red" : "blue",
              fillOpacity: 0.7,
            });
          },
          onEachFeature: (feature, layer) => {
            const props = feature.properties;

            layer.on("click", () => {
              setSelectedCameraId(props.id || null);
              setSelectedCameraName(props.camera_name || "Без названия");
            });

            layer.bindPopup(`
              <div>
                <b>${props.camera_name || "Без названия"}</b><br/>
                Camera ID: ${props.camera_id || "-"}<br/>
                Место: ${props.camera_place || "-"}<br/>
                Видео: ${props.has_video ? "есть" : "нет"}<br/>
                Кол-во видео: ${props.videos_count ?? 0}
              </div>
            `);
          },
        }).addTo(map);
      })
      .catch((err) => {
        console.error("Ошибка загрузки GeoJSON:", err);
      });

    return () => {
      if (geoJsonLayer) {
        geoJsonLayer.remove();
      }
      if (map) {
        map.remove();
      }
    };
  }, []);

  useEffect(() => {
    setLoadingVideos(true);
    setVideosError("");

    fetch(`${API_BASE_URL}/videos/`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Не удалось загрузить видео");
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setVideos(data);
        } else {
          setVideos([]);
        }
      })
      .catch((err) => {
        console.error("Ошибка загрузки видео:", err);
        setVideosError(err.message);
      })
      .finally(() => {
        setLoadingVideos(false);
      });
  }, []);

  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      const matchesCamera = selectedCameraId
        ? video.camera_id === selectedCameraId
        : true;

      const matchesTitle = titleFilter
        ? (video.filename || "").toLowerCase().includes(titleFilter.toLowerCase())
        : true;

      const matchesUser = userFilter
        ? (video.user_id || "").toLowerCase().includes(userFilter.toLowerCase())
        : true;

      return matchesCamera && matchesTitle && matchesUser;
    });
  }, [videos, selectedCameraId, titleFilter, userFilter]);

  function clearCameraFilter() {
    setSelectedCameraId(null);
    setSelectedCameraName("");
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h2>Карта с камерами и видео</h2>

        <div style={styles.headerButtons}>
          <button onClick={onGoToProfile} style={styles.secondaryButton}>
            Личный кабинет
          </button>
          <button onClick={onLogout} style={styles.button}>
            Выйти
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <div id="map" style={styles.mapBox}></div>

        <div style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>Видео</h3>

          <input
            type="text"
            placeholder="Фильтр по названию"
            value={titleFilter}
            onChange={(e) => setTitleFilter(e.target.value)}
            style={styles.input}
          />

          <input
            type="text"
            placeholder="Фильтр по user_id"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            style={styles.input}
          />

          {selectedCameraId && (
            <div style={styles.selectedCameraBox}>
              <div>
                Выбрана камера: <b>{selectedCameraName}</b>
              </div>
              <div style={styles.selectedCameraId}>
                ID: {selectedCameraId}
              </div>
              <button onClick={clearCameraFilter} style={styles.clearButton}>
                Сбросить фильтр камеры
              </button>
            </div>
          )}

          {loadingVideos && <p>Загрузка видео...</p>}
          {videosError && <p style={styles.error}>{videosError}</p>}

          {!loadingVideos && !filteredVideos.length && <p>Видео не найдены</p>}

          <div style={styles.videoList}>
            {filteredVideos.map((video) => (
              <div key={video.id} style={styles.videoCard}>
                <div style={styles.videoTitle}>
                  {video.filename || "Без названия"}
                </div>
                <div><b>ID:</b> {video.id}</div>
                <div><b>User:</b> {video.user_id || "-"}</div>
                <div><b>Camera:</b> {video.camera_id || "-"}</div>
                <div><b>Status:</b> {video.status || "-"}</div>
                <div><b>Uploaded:</b> {video.uploaded_at || "-"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    padding: "24px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  headerButtons: {
    display: "flex",
    gap: "10px",
  },
  content: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "20px",
    alignItems: "start",
  },
  mapBox: {
    height: "600px",
    borderRadius: "12px",
    border: "1px solid #ccc",
  },
  sidebar: {
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "16px",
    background: "#fafafa",
    minHeight: "600px",
    boxSizing: "border-box",
    maxHeight: "600px",
    overflowY: "auto",
  },
  sidebarTitle: {
    marginTop: 0,
    marginBottom: "12px",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
  },
  selectedCameraBox: {
    marginBottom: "12px",
    padding: "12px",
    borderRadius: "8px",
    background: "#f0f0f0",
    fontSize: "14px",
  },
  selectedCameraId: {
    marginTop: "6px",
    color: "#555",
    wordBreak: "break-word",
  },
  clearButton: {
    marginTop: "10px",
    display: "block",
    padding: "8px 10px",
    borderRadius: "8px",
    border: "none",
    background: "#222",
    color: "#fff",
    cursor: "pointer",
  },
  videoList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "12px",
  },
  videoCard: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    background: "#fff",
    fontSize: "14px",
    lineHeight: "1.6",
    wordBreak: "break-word",
  },
  videoTitle: {
    fontWeight: "bold",
    marginBottom: "8px",
    fontSize: "16px",
  },
  button: {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    background: "#222",
    color: "#fff",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    background: "#fff",
    color: "#222",
    cursor: "pointer",
  },
  error: {
    color: "red",
  },
};