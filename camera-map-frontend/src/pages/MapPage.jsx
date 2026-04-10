import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  getCamerasGeoJson,
  getVideos,
  uploadVideo,
  deleteVideo,
} from "../api";

function MapBounds({ cameras }) {
  const map = useMap();

  useEffect(() => {
    if (!Array.isArray(cameras) || cameras.length === 0) return;

    const points = cameras
      .map((camera) => {
        const coords = camera?.geometry?.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) return null;
        return [coords[1], coords[0]];
      })
      .filter(Boolean);

    if (points.length === 0) return;

    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }

    map.fitBounds(points, { padding: [30, 30] });
  }, [cameras, map]);

  return null;
}

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString("ru-RU");
  } catch {
    return value;
  }
}

function isMp4File(file) {
  if (!file) return false;

  const lowerName = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();

  return (
    lowerName.endsWith(".mp4") ||
    type === "video/mp4" ||
    type.includes("mp4")
  );
}

export default function MapPage({ onLogout, onOpenProfile }) {
  const fileInputRef = useRef(null);

  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);

  const [cameraVideos, setCameraVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosError, setVideosError] = useState("");

  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [uploading, setUploading] = useState(false);

  const [deleteError, setDeleteError] = useState("");
  const [deletingVideoId, setDeletingVideoId] = useState("");

  const [search, setSearch] = useState("");
  const [videoSearch, setVideoSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadCameras() {
    try {
      setLoading(true);
      setError("");

      const data = await getCamerasGeoJson();
      const features = Array.isArray(data?.features) ? data.features : [];
      setCameras(features);
    } catch (e) {
      console.error("Ошибка загрузки камер:", e);
      setError(e.message || "Ошибка загрузки камер");
      setCameras([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadVideosForSelectedCamera(camera) {
    const cameraId = camera?.properties?.camera_id;

    if (!cameraId) {
      setCameraVideos([]);
      return;
    }

    try {
      setVideosLoading(true);
      setVideosError("");
      setDeleteError("");

      const videos = await getVideos({
        camera_id: cameraId,
      });

      setCameraVideos(Array.isArray(videos) ? videos : []);
    } catch (e) {
      console.error("Ошибка загрузки видео камеры:", e);
      setVideosError(e.message || "Ошибка загрузки видео");
      setCameraVideos([]);
    } finally {
      setVideosLoading(false);
    }
  }

  useEffect(() => {
    loadCameras();
  }, []);

  useEffect(() => {
    loadVideosForSelectedCamera(selectedCamera);
  }, [selectedCamera]);

  const filteredCameras = useMemo(() => {
    return cameras.filter((camera) => {
      const name = camera?.properties?.camera_name || "";
      return name.toLowerCase().includes(search.toLowerCase());
    });
  }, [cameras, search]);

  const filteredVideos = useMemo(() => {
    return cameraVideos.filter((video) => {
      const fileName = (video?.filename || "").toLowerCase();
      const userName = (
        video?.user_full_name ||
        video?.user_email ||
        ""
      ).toLowerCase();

      const matchesTitle = fileName.includes(videoSearch.toLowerCase());
      const matchesUser = userName.includes(userSearch.toLowerCase());

      return matchesTitle && matchesUser;
    });
  }, [cameraVideos, videoSearch, userSearch]);

  function handleImportClick() {
    setUploadError("");
    setUploadSuccess("");

    if (!selectedCamera) {
      return;
    }

    fileInputRef.current?.click();
  }

  async function handleFilesSelected(event) {
    const files = Array.from(event.target.files || []);
    const actualToken = localStorage.getItem("access_token");
    const cameraId = selectedCamera?.properties?.camera_id;

    setUploadError("");
    setUploadSuccess("");

    if (!cameraId) {
      setUploadError("Сначала выберите камеру.");
      event.target.value = "";
      return;
    }

    if (!actualToken) {
      setUploadError("Токен авторизации не найден.");
      event.target.value = "";
      return;
    }

    if (files.length === 0) {
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);

      for (const file of files) {
        if (!isMp4File(file)) {
          throw new Error(`Файл ${file.name} не является mp4.`);
        }

        try {
          await file.arrayBuffer();
        } catch {
          throw new Error(`Файл ${file.name} не удалось прочитать.`);
        }

        await uploadVideo({
          token: actualToken,
          cameraId,
          file,
        });
      }

      setUploadSuccess("Видео успешно загружены.");
      await loadCameras();
      await loadVideosForSelectedCamera(selectedCamera);
    } catch (e) {
      console.error("Ошибка загрузки файлов:", e);
      setUploadError(e.message || "Ошибка загрузки видео");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleDeleteVideo(videoId) {
    const actualToken = localStorage.getItem("access_token");

    if (!actualToken) {
      setDeleteError("Токен авторизации не найден.");
      return;
    }

    const confirmed = window.confirm("Удалить это видео?");
    if (!confirmed) {
      return;
    }

    try {
      setDeleteError("");
      setDeletingVideoId(videoId);

      await deleteVideo({
        token: actualToken,
        videoId,
      });

      await loadCameras();
      await loadVideosForSelectedCamera(selectedCamera);
    } catch (e) {
      console.error("Ошибка удаления видео:", e);
      setDeleteError(e.message || "Не удалось удалить видео");
    } finally {
      setDeletingVideoId("");
    }
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Карта с камерами и видео</h1>

      <div
        style={{
          marginBottom: "16px",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <button onClick={onOpenProfile}>Личный кабинет</button>
        <button onClick={onLogout}>Выйти</button>

        <button
          onClick={handleImportClick}
          disabled={!selectedCamera || uploading}
          style={{
            opacity: !selectedCamera || uploading ? 0.6 : 1,
            cursor: !selectedCamera || uploading ? "not-allowed" : "pointer",
          }}
        >
          {uploading ? "Загрузка..." : "Импорт"}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".mp4,video/mp4"
          multiple
          style={{ display: "none" }}
          onChange={handleFilesSelected}
        />
      </div>

      {!selectedCamera && (
        <p style={{ marginTop: "-4px", marginBottom: "12px", color: "#666" }}>
          Импорт доступен только после выбора камеры.
        </p>
      )}

      {uploadError && <p style={{ color: "red" }}>{uploadError}</p>}
      {uploadSuccess && <p style={{ color: "green" }}>{uploadSuccess}</p>}

      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Поиск по названию камеры"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "10px",
            fontSize: "16px",
          }}
        />
      </div>

      {loading && <p>Загрузка камер...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "700px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <MapContainer
            center={[55.751244, 37.618423]}
            zoom={10}
            style={{ width: "100%", height: "100%" }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapBounds cameras={filteredCameras} />

            {filteredCameras.map((camera) => {
              const coords = camera?.geometry?.coordinates;
              if (!Array.isArray(coords) || coords.length < 2) return null;

              const cameraId = camera?.properties?.camera_id;
              const cameraName =
                camera?.properties?.camera_name || "Без названия";
              const videosCount = camera?.properties?.videos_count || 0;

              return (
                <CircleMarker
                  key={cameraId || `${coords[0]}-${coords[1]}`}
                  center={[coords[1], coords[0]]}
                  radius={videosCount > 0 ? 10 : 7}
                  pathOptions={{
                    color: "#ffffff",
                    weight: 2,
                    fillColor: videosCount > 0 ? "#dc2626" : "#2563eb",
                    fillOpacity: 1,
                  }}
                  eventHandlers={{
                    click: () => setSelectedCamera(camera),
                  }}
                >
                  <Popup>
                    <div>
                      <strong>{cameraName}</strong>
                      <br />
                      Видео: {videosCount}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "16px",
            minHeight: "700px",
            background: "#fff",
            overflow: "hidden",
          }}
        >
          <h2>Навигация</h2>

          {selectedCamera ? (
            <div style={{ marginBottom: "20px" }}>
              <h3>{selectedCamera?.properties?.camera_name || "Без названия"}</h3>

              <p>
                <strong>Модель:</strong>{" "}
                {selectedCamera?.properties?.model || "—"}
              </p>

              <p>
                <strong>Видео:</strong>{" "}
                {selectedCamera?.properties?.videos_count || 0}
              </p>

              <p>
                <strong>Координаты:</strong>{" "}
                {selectedCamera?.geometry?.coordinates?.[1]},{" "}
                {selectedCamera?.geometry?.coordinates?.[0]}
              </p>
            </div>
          ) : (
            <p>Выберите камеру на карте.</p>
          )}

          <h3>Список камер</h3>

          <div
            style={{
              maxHeight: "180px",
              overflowY: "auto",
              marginBottom: "20px",
            }}
          >
            {filteredCameras.length === 0 ? (
              <p>Камеры не найдены.</p>
            ) : (
              filteredCameras.map((camera) => (
                <div
                  key={camera?.properties?.camera_id}
                  onClick={() => setSelectedCamera(camera)}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid #eee",
                    cursor: "pointer",
                  }}
                >
                  <strong>{camera?.properties?.camera_name || "Без названия"}</strong>
                  <div>Видео: {camera?.properties?.videos_count || 0}</div>
                </div>
              ))
            )}
          </div>

          <h3>Видео выбранной камеры</h3>

          {selectedCamera && (
            <div
              style={{
                marginBottom: "12px",
                display: "grid",
                gap: "8px",
              }}
            >
              <input
                type="text"
                placeholder="Фильтр по названию видео"
                value={videoSearch}
                onChange={(e) => setVideoSearch(e.target.value)}
                style={{ padding: "10px", fontSize: "14px" }}
              />

              <input
                type="text"
                placeholder="Фильтр по пользователю"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ padding: "10px", fontSize: "14px" }}
              />
            </div>
          )}

          {videosLoading && <p>Загрузка видео...</p>}
          {videosError && <p style={{ color: "red" }}>{videosError}</p>}
          {deleteError && <p style={{ color: "red" }}>{deleteError}</p>}

          {!selectedCamera ? (
            <p>Сначала выберите камеру.</p>
          ) : filteredVideos.length === 0 ? (
            <p>Для этой камеры видео не найдены.</p>
          ) : (
            <div style={{ maxHeight: "320px", overflowY: "auto" }}>
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "12px",
                  }}
                >
                  {video.preview_url ? (
                    <img
                      src={video.preview_url}
                      alt={video.filename}
                      style={{
                        width: "100%",
                        height: "140px",
                        objectFit: "cover",
                        borderRadius: "6px",
                        marginBottom: "10px",
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "140px",
                        background: "#eee",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "6px",
                        marginBottom: "10px",
                        fontSize: "14px",
                        color: "#666",
                      }}
                    >
                      Нет превью
                    </div>
                  )}

                  <div style={{ marginBottom: "6px" }}>
                    <strong>{video.filename}</strong>
                  </div>

                  <div style={{ fontSize: "14px", marginBottom: "4px" }}>
                    <strong>Пользователь:</strong>{" "}
                    {video.user_full_name || video.user_email || "—"}
                  </div>

                  <div style={{ fontSize: "14px", marginBottom: "4px" }}>
                    <strong>Email:</strong> {video.user_email || "—"}
                  </div>

                  <div style={{ fontSize: "14px", marginBottom: "4px" }}>
                    <strong>Дата загрузки:</strong> {formatDate(video.uploaded_at)}
                  </div>

                  <div style={{ fontSize: "14px", marginBottom: "10px" }}>
                    <strong>Статус:</strong> {video.status || "—"}
                  </div>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {video.video_url ? (
                      <a
                        href={video.video_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: "14px" }}
                      >
                        Открыть видео
                      </a>
                    ) : null}

                    <button
                      onClick={() => handleDeleteVideo(video.id)}
                      disabled={deletingVideoId === video.id}
                    >
                      {deletingVideoId === video.id ? "Удаление..." : "Удалить"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}