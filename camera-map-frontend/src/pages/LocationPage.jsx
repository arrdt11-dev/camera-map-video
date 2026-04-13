import { useEffect, useMemo, useState } from "react";
import { getVideos, deleteVideo } from "../api";

const cardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "18px",
  background: "#fff",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
};

const buttonStyle = {
  border: "none",
  borderRadius: "10px",
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 600,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  outline: "none",
  boxSizing: "border-box",
};

export default function LocationPage({ token, cameraId, onBack }) {
  const [videos, setVideos] = useState([]);
  const [tab, setTab] = useState("videos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [videoFilters, setVideoFilters] = useState({
    title: "",
    user: "",
  });

  const actualToken = useMemo(
    () => token || localStorage.getItem("access_token"),
    [token]
  );

  async function loadLocationData(customFilters = videoFilters) {
    if (!actualToken) {
      setError("Нет токена авторизации");
      setLoading(false);
      return;
    }

    if (!cameraId) {
      setError("Камера не выбрана");
      setLoading(false);
      return;
    }

    try {
      setError("");
      setLoading(true);

      const data = await getVideos(actualToken, {
        camera_id: cameraId,
        title: customFilters.title,
        user: customFilters.user,
      });

      setVideos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError(e.message || "Не удалось загрузить данные локации");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLocationData();
  }, [cameraId, token]);

  async function handleApplyVideoFilters() {
    await loadLocationData(videoFilters);
  }

  async function handleResetVideoFilters() {
    const reset = { title: "", user: "" };
    setVideoFilters(reset);
    await loadLocationData(reset);
  }

  async function handleDelete(videoId) {
    if (!actualToken) {
      setError("Нет токена авторизации");
      return;
    }

    const confirmed = window.confirm("Удалить это видео?");
    if (!confirmed) {
      return;
    }

    try {
      setNotice("");
      await deleteVideo(actualToken, videoId);
      setNotice("Видео удалено");
      await loadLocationData();
    } catch (e) {
      console.error(e);
      setError(e.message || "Не удалось удалить видео");
    }
  }

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "1200px",
        margin: "0 auto",
        background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "18px" }}>
        <button
          onClick={onBack}
          style={{ ...buttonStyle, background: "#e5e7eb", color: "#111827" }}
        >
          Назад к карте
        </button>

        <div style={{ alignSelf: "center", color: "#374151", fontWeight: 600 }}>
          Локация камеры: {cameraId || "—"}
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: 0, fontSize: "44px", lineHeight: 1.1 }}>
          Информация о локации
        </h1>
      </div>

      {error ? (
        <div
          style={{
            ...cardStyle,
            borderColor: "#fecaca",
            background: "#fef2f2",
            color: "#991b1b",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      ) : null}

      {notice ? (
        <div
          style={{
            ...cardStyle,
            borderColor: "#bfdbfe",
            background: "#eff6ff",
            color: "#1d4ed8",
            marginBottom: "16px",
          }}
        >
          {notice}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => setTab("videos")}
          style={{
            ...buttonStyle,
            background: tab === "videos" ? "#111827" : "#e5e7eb",
            color: tab === "videos" ? "#fff" : "#111827",
          }}
        >
          Видео
        </button>

        <button
          onClick={() => setTab("analytics")}
          style={{
            ...buttonStyle,
            background: tab === "analytics" ? "#111827" : "#e5e7eb",
            color: tab === "analytics" ? "#fff" : "#111827",
          }}
        >
          Анализы
        </button>
      </div>

      {tab === "videos" ? (
        <>
          <div style={{ ...cardStyle, marginBottom: "18px" }}>
            <h2 style={{ marginTop: 0 }}>Фильтры видео</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "12px",
                alignItems: "end",
              }}
            >
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>
                  По названию
                </label>
                <input
                  style={inputStyle}
                  placeholder="Например, video"
                  value={videoFilters.title}
                  onChange={(e) =>
                    setVideoFilters((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>
                  По пользователю
                </label>
                <input
                  style={inputStyle}
                  placeholder="Например, Test User"
                  value={videoFilters.user}
                  onChange={(e) =>
                    setVideoFilters((prev) => ({ ...prev, user: e.target.value }))
                  }
                />
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleApplyVideoFilters}
                  style={{ ...buttonStyle, background: "#111827", color: "#fff" }}
                >
                  Применить
                </button>
                <button
                  onClick={handleResetVideoFilters}
                  style={{ ...buttonStyle, background: "#e5e7eb", color: "#111827" }}
                >
                  Сбросить
                </button>
              </div>
            </div>
          </div>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Видео по локации</h2>

            {loading ? (
              <p>Загрузка...</p>
            ) : videos.length === 0 ? (
              <p>Для этой локации пока нет видео</p>
            ) : (
              <div style={{ display: "grid", gap: "16px" }}>
                {videos.map((video) => (
                  <div
                    key={video.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "16px",
                      padding: "16px",
                      background: "#fafafa",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(220px, 260px) 1fr",
                        gap: "18px",
                        alignItems: "start",
                      }}
                    >
                      <div>
                        {video.preview_url ? (
                          <img
                            src={video.preview_url}
                            alt={video.filename}
                            style={{
                              width: "100%",
                              aspectRatio: "1 / 1",
                              objectFit: "cover",
                              borderRadius: "14px",
                              border: "1px solid #ddd",
                              display: "block",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              aspectRatio: "1 / 1",
                              borderRadius: "14px",
                              border: "1px dashed #cbd5e1",
                              display: "grid",
                              placeItems: "center",
                              color: "#64748b",
                              background: "#fff",
                            }}
                          >
                            Нет превью
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={{ display: "grid", gap: "8px", marginBottom: "12px" }}>
                          <div>
                            <strong>Файл:</strong> {video.filename}
                          </div>
                          <div>
                            <strong>Пользователь:</strong>{" "}
                            {video.user_full_name || video.user_email || "—"}
                          </div>
                          <div>
                            <strong>Email:</strong> {video.user_email || "—"}
                          </div>
                          <div>
                            <strong>Статус:</strong> {video.status}
                          </div>
                          <div>
                            <strong>Дата загрузки:</strong>{" "}
                            {video.uploaded_at
                              ? new Date(video.uploaded_at).toLocaleString()
                              : "—"}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {video.video_url ? (
                            <a href={video.video_url} target="_blank" rel="noreferrer">
                              Открыть видео
                            </a>
                          ) : null}

                          {video.preview_url ? (
                            <a href={video.preview_url} target="_blank" rel="noreferrer">
                              Открыть превью
                            </a>
                          ) : null}

                          <button
                            onClick={() => handleDelete(video.id)}
                            style={{
                              ...buttonStyle,
                              background: "#fee2e2",
                              color: "#991b1b",
                            }}
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Анализы</h2>

          {loading ? (
            <p>Загрузка...</p>
          ) : videos.length === 0 ? (
            <p>Нет данных для анализа</p>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {videos.map((video) => (
                <div
                  key={video.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "16px",
                    padding: "16px",
                    background: "#fafafa",
                  }}
                >
                  <div style={{ display: "grid", gap: "8px" }}>
                    <div>
                      <strong>Видео:</strong> {video.filename}
                    </div>
                    <div>
                      <strong>Автор:</strong>{" "}
                      {video.user_full_name || video.user_email || "—"}
                    </div>
                    <div>
                      <strong>Длительность:</strong> 00:10:00
                    </div>
                    <div>
                      <strong>Разрешение:</strong> 1920x1080
                    </div>
                    <div>
                      <strong>FPS:</strong> 30
                    </div>
                    <div>
                      <strong>Время суток:</strong> день
                    </div>
                    <div>
                      <strong>Обработка трасс:</strong> готово
                    </div>
                    <div>
                      <strong>Количество расчетов:</strong> 1
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}