import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getCamerasGeoJson, getVideos } from "../api";

const defaultCenter = [55.751244, 37.618423];

const blueIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FlyToCamera({ camera }) {
  const map = useMap();

  useEffect(() => {
    if (!camera) return;

    const coordinates = camera?.geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) return;

    const [lng, lat] = coordinates;
    if (typeof lat !== "number" || typeof lng !== "number") return;

    map.flyTo([lat, lng], 14, { duration: 0.8 });
  }, [camera, map]);

  return null;
}

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function safeNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("ru-RU");
}

function getPreviewUrl(video) {
  return (
    video.preview_url ||
    video.previewUrl ||
    video.preview ||
    video.thumbnail_url ||
    video.thumbnailUrl ||
    ""
  );
}

function getVideoUrl(video) {
  return (
    video.video_url ||
    video.videoUrl ||
    video.file_url ||
    video.fileUrl ||
    video.url ||
    ""
  );
}

function getCameraDisplayName(camera) {
  const p = camera?.properties || {};
  return (
    p.camera_name ||
    p.name ||
    p.title ||
    p.camera_id ||
    p.id ||
    "Камера"
  );
}

function getCameraCode(camera) {
  const p = camera?.properties || {};
  return p.camera_id || p.code || p.external_id || "—";
}

function getCameraAddress(camera) {
  const p = camera?.properties || {};
  return p.camera_place || p.address || p.location || "—";
}

function getCameraModel(camera) {
  const p = camera?.properties || {};
  return p.model || "—";
}

function getCameraType(camera) {
  const p = camera?.properties || {};
  return p.camera_type || p.type || "—";
}

function getCameraClass(camera) {
  const p = camera?.properties || {};
  return p.camera_class || p.class_name || p.class || "—";
}

function getCameraVideoCount(camera) {
  const p = camera?.properties || {};
  return Number(p.videos_count || p.video_count || 0);
}

function getCameraInternalId(camera) {
  const p = camera?.properties || {};
  return p.id || p.camera_uuid || p.uuid || null;
}

function getCameraMatchValues(camera) {
  const p = camera?.properties || {};
  return {
    name: normalizeText(getCameraDisplayName(camera)),
    code: normalizeText(getCameraCode(camera)),
    address: normalizeText(getCameraAddress(camera)),
    model: normalizeText(getCameraModel(camera)),
    type: normalizeText(getCameraType(camera)),
    className: normalizeText(getCameraClass(camera)),
  };
}

function getVideoCameraId(video) {
  return video.camera_id || video.cameraId || null;
}

function getVideoFileName(video) {
  return video.filename || video.name || video.original_filename || "Видео";
}

function getVideoUserName(video) {
  if (video.user?.full_name) return video.user.full_name;
  if (video.user_name) return video.user_name;
  if (video.full_name) return video.full_name;
  return "—";
}

function getVideoUserEmail(video) {
  if (video.user?.email) return video.user.email;
  if (video.user_email) return video.user_email;
  if (video.email) return video.email;
  return "—";
}

function getVideoStatus(video) {
  return video.status || "—";
}

export default function MapPage({ onLogout, onOpenProfile, onImport }) {
  const [allCameras, setAllCameras] = useState([]);
  const [allVideos, setAllVideos] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cameraSearch, setCameraSearch] = useState("");
  const [cameraModelFilter, setCameraModelFilter] = useState("");
  const [cameraTypeFilter, setCameraTypeFilter] = useState("");
  const [cameraClassFilter, setCameraClassFilter] = useState("");
  const [videoCountFrom, setVideoCountFrom] = useState("");
  const [videoCountTo, setVideoCountTo] = useState("");

  const [videoTitleFilter, setVideoTitleFilter] = useState("");
  const [videoUserFilter, setVideoUserFilter] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [geoJsonData, videosData] = await Promise.all([
          getCamerasGeoJson(),
          typeof getVideos === "function" ? getVideos() : Promise.resolve([]),
        ]);

        const features = Array.isArray(geoJsonData?.features)
          ? geoJsonData.features
          : [];

        const videos = Array.isArray(videosData)
          ? videosData
          : Array.isArray(videosData?.items)
          ? videosData.items
          : Array.isArray(videosData?.results)
          ? videosData.results
          : [];

        setAllCameras(features);
        setAllVideos(videos);

        if (features.length > 0) {
          const firstCameraId =
            getCameraInternalId(features[0]) || getCameraCode(features[0]);
          setSelectedCameraId(firstCameraId);
        }
      } catch (e) {
        console.error("Ошибка загрузки карты:", e);
        setError(e.message || "Ошибка загрузки данных");
        setAllCameras([]);
        setAllVideos([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const modelOptions = useMemo(() => {
    const values = allCameras
      .map((camera) => getCameraModel(camera))
      .filter((value) => value && value !== "—");

    return [...new Set(values)].sort((a, b) => a.localeCompare(b, "ru"));
  }, [allCameras]);

  const typeOptions = useMemo(() => {
    const values = allCameras
      .map((camera) => getCameraType(camera))
      .filter((value) => value && value !== "—");

    return [...new Set(values)].sort((a, b) => a.localeCompare(b, "ru"));
  }, [allCameras]);

  const classOptions = useMemo(() => {
    const values = allCameras
      .map((camera) => getCameraClass(camera))
      .filter((value) => value && value !== "—");

    return [...new Set(values)].sort((a, b) => a.localeCompare(b, "ru"));
  }, [allCameras]);

  const filteredCameras = useMemo(() => {
    const search = normalizeText(cameraSearch);
    const model = normalizeText(cameraModelFilter);
    const type = normalizeText(cameraTypeFilter);
    const className = normalizeText(cameraClassFilter);
    const from = safeNumber(videoCountFrom);
    const to = safeNumber(videoCountTo);

    return allCameras.filter((camera) => {
      const values = getCameraMatchValues(camera);
      const videoCount = getCameraVideoCount(camera);

      const matchesSearch =
        !search ||
        values.name.includes(search) ||
        values.code.includes(search) ||
        values.address.includes(search);

      const matchesModel = !model || values.model === model;
      const matchesType = !type || values.type === type;
      const matchesClass = !className || values.className === className;
      const matchesFrom = from === null || videoCount >= from;
      const matchesTo = to === null || videoCount <= to;

      return (
        matchesSearch &&
        matchesModel &&
        matchesType &&
        matchesClass &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [
    allCameras,
    cameraSearch,
    cameraModelFilter,
    cameraTypeFilter,
    cameraClassFilter,
    videoCountFrom,
    videoCountTo,
  ]);

  useEffect(() => {
    if (filteredCameras.length === 0) {
      setSelectedCameraId(null);
      return;
    }

    const existsInFiltered = filteredCameras.some((camera) => {
      const cameraId = getCameraInternalId(camera) || getCameraCode(camera);
      return cameraId === selectedCameraId;
    });

    if (!existsInFiltered) {
      const nextId =
        getCameraInternalId(filteredCameras[0]) ||
        getCameraCode(filteredCameras[0]);
      setSelectedCameraId(nextId);
    }
  }, [filteredCameras, selectedCameraId]);

  const selectedCamera = useMemo(() => {
    return (
      filteredCameras.find((camera) => {
        const cameraId = getCameraInternalId(camera) || getCameraCode(camera);
        return cameraId === selectedCameraId;
      }) || null
    );
  }, [filteredCameras, selectedCameraId]);

  const selectedCameraVideos = useMemo(() => {
    if (!selectedCamera) return [];

    const selectedInternalId = getCameraInternalId(selectedCamera);
    const selectedCode = getCameraCode(selectedCamera);

    return allVideos.filter((video) => {
      const videoCameraId = getVideoCameraId(video);
      if (!videoCameraId) return false;

      return (
        videoCameraId === selectedInternalId ||
        String(videoCameraId) === String(selectedInternalId) ||
        String(videoCameraId) === String(selectedCode)
      );
    });
  }, [allVideos, selectedCamera]);

  const filteredSelectedCameraVideos = useMemo(() => {
    const titleFilter = normalizeText(videoTitleFilter);
    const userFilter = normalizeText(videoUserFilter);

    return selectedCameraVideos.filter((video) => {
      const fileName = normalizeText(getVideoFileName(video));
      const userName = normalizeText(getVideoUserName(video));
      const email = normalizeText(getVideoUserEmail(video));

      const matchesTitle = !titleFilter || fileName.includes(titleFilter);
      const matchesUser =
        !userFilter ||
        userName.includes(userFilter) ||
        email.includes(userFilter);

      return matchesTitle && matchesUser;
    });
  }, [selectedCameraVideos, videoTitleFilter, videoUserFilter]);

  function handleSelectCamera(camera) {
    const cameraId = getCameraInternalId(camera) || getCameraCode(camera);
    setSelectedCameraId(cameraId);
  }

  function resetCameraFilters() {
    setCameraSearch("");
    setCameraModelFilter("");
    setCameraTypeFilter("");
    setCameraClassFilter("");
    setVideoCountFrom("");
    setVideoCountTo("");
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <h1 style={styles.title}>Карта с камерами и видео</h1>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <h1 style={styles.title}>Карта с камерами и видео</h1>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Карта с камерами и видео</h1>

      <div style={styles.topButtons}>
        <button type="button" onClick={onOpenProfile} style={styles.smallButton}>
          Личный кабинет
        </button>

        <button type="button" onClick={onLogout} style={styles.smallButton}>
          Выйти
        </button>

        <button
          type="button"
          onClick={onImport}
          style={styles.smallButton}
        >
          Импорт
        </button>
      </div>

      <div style={styles.filtersGrid}>
        <input
          type="text"
          placeholder="Поиск по названию / id / адресу"
          value={cameraSearch}
          onChange={(e) => setCameraSearch(e.target.value)}
          style={styles.input}
        />

        <select
          value={cameraModelFilter}
          onChange={(e) => setCameraModelFilter(e.target.value)}
          style={styles.input}
        >
          <option value="">Модель камеры</option>
          {modelOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={cameraTypeFilter}
          onChange={(e) => setCameraTypeFilter(e.target.value)}
          style={styles.input}
        >
          <option value="">Тип камеры</option>
          {typeOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={cameraClassFilter}
          onChange={(e) => setCameraClassFilter(e.target.value)}
          style={styles.input}
        >
          <option value="">Класс камеры</option>
          {classOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Видео от"
          value={videoCountFrom}
          onChange={(e) => setVideoCountFrom(e.target.value)}
          style={styles.input}
          min="0"
        />

        <input
          type="number"
          placeholder="Видео до"
          value={videoCountTo}
          onChange={(e) => setVideoCountTo(e.target.value)}
          style={styles.input}
          min="0"
        />
      </div>

      <div style={styles.filterActions}>
        <div style={styles.filterInfo}>
          Найдено камер: <strong>{filteredCameras.length}</strong>
        </div>

        <button type="button" onClick={resetCameraFilters} style={styles.resetButton}>
          Сбросить фильтры
        </button>
      </div>

      <div style={styles.content}>
        <div style={styles.mapWrapper}>
          <MapContainer
            center={defaultCenter}
            zoom={12}
            style={styles.map}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FlyToCamera camera={selectedCamera} />

            {filteredCameras.map((camera) => {
              const coordinates = camera?.geometry?.coordinates;

              if (!Array.isArray(coordinates) || coordinates.length < 2) {
                return null;
              }

              const [lng, lat] = coordinates;
              if (typeof lat !== "number" || typeof lng !== "number") {
                return null;
              }

              const cameraId = getCameraInternalId(camera) || getCameraCode(camera);
              const isSelected = cameraId === selectedCameraId;

              return (
                <Marker
                  key={cameraId}
                  position={[lat, lng]}
                  icon={isSelected ? redIcon : blueIcon}
                  eventHandlers={{
                    click: () => handleSelectCamera(camera),
                  }}
                >
                  <Popup>
                    <div>
                      <strong>{getCameraDisplayName(camera)}</strong>
                      <br />
                      Код камеры: {getCameraCode(camera)}
                      <br />
                      Видео: {getCameraVideoCount(camera)}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        <div style={styles.sidebar}>
          <h2 style={styles.sidebarTitle}>Навигация</h2>

          {selectedCamera ? (
            <>
              <div style={styles.cameraCard}>
                <div style={styles.cameraName}>
                  {getCameraDisplayName(selectedCamera)}
                </div>
                <div><strong>Код:</strong> {getCameraCode(selectedCamera)}</div>
                <div><strong>Адрес:</strong> {getCameraAddress(selectedCamera)}</div>
                <div><strong>Модель:</strong> {getCameraModel(selectedCamera)}</div>
                <div><strong>Тип:</strong> {getCameraType(selectedCamera)}</div>
                <div><strong>Класс:</strong> {getCameraClass(selectedCamera)}</div>
                <div><strong>Видео:</strong> {getCameraVideoCount(selectedCamera)}</div>
              </div>

              <div style={styles.tabsRow}>
                <button type="button" style={styles.tabActive}>
                  Видео
                </button>
                <button type="button" style={styles.tabButton}>
                  Анализы
                </button>
              </div>
            </>
          ) : (
            <p>Камеры по текущим фильтрам не найдены.</p>
          )}

          <h3 style={styles.sectionTitle}>Список камер</h3>
          <div style={styles.cameraList}>
            {filteredCameras.length === 0 ? (
              <div style={styles.emptyText}>Ничего не найдено</div>
            ) : (
              filteredCameras.map((camera) => {
                const cameraId =
                  getCameraInternalId(camera) || getCameraCode(camera);
                const isSelected = cameraId === selectedCameraId;

                return (
                  <button
                    key={cameraId}
                    type="button"
                    onClick={() => handleSelectCamera(camera)}
                    style={{
                      ...styles.cameraListItem,
                      ...(isSelected ? styles.cameraListItemActive : {}),
                    }}
                  >
                    <div style={styles.cameraListName}>
                      {getCameraDisplayName(camera)}
                    </div>
                    <div>Видео: {getCameraVideoCount(camera)}</div>
                  </button>
                );
              })
            )}
          </div>

          <h3 style={styles.sectionTitle}>Видео выбранной камеры</h3>

          <div style={styles.videoFilters}>
            <input
              type="text"
              placeholder="Фильтр по названию видео"
              value={videoTitleFilter}
              onChange={(e) => setVideoTitleFilter(e.target.value)}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Фильтр по пользователю"
              value={videoUserFilter}
              onChange={(e) => setVideoUserFilter(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.videoList}>
            {filteredSelectedCameraVideos.length === 0 ? (
              <div style={styles.emptyText}>
                Для этой камеры видео не найдены.
              </div>
            ) : (
              filteredSelectedCameraVideos.map((video) => {
                const previewUrl = getPreviewUrl(video);
                const videoUrl = getVideoUrl(video);

                return (
                  <div key={video.id} style={styles.videoCard}>
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={getVideoFileName(video)}
                        style={styles.preview}
                      />
                    ) : (
                      <div style={styles.previewStub}>Нет превью</div>
                    )}

                    <div style={styles.videoName}>{getVideoFileName(video)}</div>
                    <div>
                      <strong>Пользователь:</strong> {getVideoUserName(video)}
                    </div>
                    <div>
                      <strong>Email:</strong> {getVideoUserEmail(video)}
                    </div>
                    <div>
                      <strong>Дата загрузки:</strong> {formatDate(video.uploaded_at)}
                    </div>
                    <div>
                      <strong>Статус:</strong> {getVideoStatus(video)}
                    </div>

                    <div style={styles.videoActions}>
                      {videoUrl ? (
                        <a
                          href={videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.link}
                        >
                          Открыть видео
                        </a>
                      ) : (
                        <span style={styles.disabledLink}>Видео недоступно</span>
                      )}

                      <button type="button" style={styles.deleteButton}>
                        Удалить
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f7f7f7",
    minHeight: "100vh",
    boxSizing: "border-box",
  },
  title: {
    fontSize: "28px",
    marginBottom: "20px",
  },
  topButtons: {
    display: "flex",
    gap: "10px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  smallButton: {
    padding: "8px 14px",
    borderRadius: "8px",
    border: "1px solid #d0d0d0",
    background: "#ffffff",
    cursor: "pointer",
  },
  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "12px",
    marginBottom: "12px",
  },
  filterActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
    gap: "12px",
    flexWrap: "wrap",
  },
  filterInfo: {
    color: "#333",
  },
  resetButton: {
    padding: "8px 14px",
    borderRadius: "8px",
    border: "1px solid #d0d0d0",
    background: "#fff",
    cursor: "pointer",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d9d9d9",
    boxSizing: "border-box",
    background: "#fff",
  },
  content: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "18px",
    alignItems: "start",
  },
  mapWrapper: {
    background: "#fff",
    border: "1px solid #e3e3e3",
    borderRadius: "16px",
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "760px",
  },
  sidebar: {
    background: "#fff",
    border: "1px solid #e3e3e3",
    borderRadius: "16px",
    padding: "18px",
  },
  sidebarTitle: {
    fontSize: "24px",
    marginTop: 0,
    marginBottom: "18px",
  },
  cameraCard: {
    display: "grid",
    gap: "10px",
    marginBottom: "14px",
  },
  cameraName: {
    fontWeight: "700",
    fontSize: "18px",
  },
  tabsRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "18px",
  },
  tabButton: {
    padding: "6px 12px",
    borderRadius: "8px",
    border: "1px solid #d0d0d0",
    background: "#f2f2f2",
    cursor: "pointer",
  },
  tabActive: {
    padding: "6px 12px",
    borderRadius: "8px",
    border: "1px solid #d0d0d0",
    background: "#e9e9e9",
    cursor: "pointer",
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: "18px",
    marginTop: "22px",
    marginBottom: "12px",
  },
  cameraList: {
    display: "grid",
    gap: "10px",
  },
  cameraListItem: {
    textAlign: "left",
    border: "1px solid #e0e0e0",
    borderRadius: "12px",
    padding: "12px",
    background: "#fff",
    cursor: "pointer",
  },
  cameraListItemActive: {
    border: "1px solid #bdbdbd",
    background: "#f7f7f7",
  },
  cameraListName: {
    fontWeight: "700",
    marginBottom: "4px",
  },
  videoFilters: {
    display: "grid",
    gap: "10px",
    marginBottom: "14px",
  },
  videoList: {
    display: "grid",
    gap: "14px",
  },
  videoCard: {
    border: "1px solid #e0e0e0",
    borderRadius: "14px",
    padding: "14px",
    background: "#fff",
  },
  preview: {
    width: "100%",
    height: "220px",
    objectFit: "cover",
    borderRadius: "12px",
    marginBottom: "12px",
    display: "block",
  },
  previewStub: {
    width: "100%",
    height: "220px",
    borderRadius: "12px",
    marginBottom: "12px",
    background: "#efefef",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#777",
  },
  videoName: {
    fontSize: "18px",
    fontWeight: "700",
    marginBottom: "8px",
  },
  videoActions: {
    display: "flex",
    gap: "14px",
    alignItems: "center",
    marginTop: "12px",
    flexWrap: "wrap",
  },
  link: {
    color: "#6a3dc7",
    textDecoration: "underline",
  },
  disabledLink: {
    color: "#999",
  },
  deleteButton: {
    border: "none",
    background: "transparent",
    color: "#666",
    cursor: "pointer",
    padding: 0,
  },
  emptyText: {
    color: "#555",
  },
  error: {
    color: "red",
  },
};