import { useEffect, useState } from "react";
import { getMe, getVideos, deleteVideo } from "../api";

export default function ProfilePage({ token, onBack, onLogout }) {
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [titleFilter, setTitleFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [error, setError] = useState("");

  async function loadProfileData() {
    const actualToken = token || localStorage.getItem("access_token");

    if (!actualToken) {
      setError("Нет токена авторизации");
      setLoadingUser(false);
      setLoadingVideos(false);
      return;
    }

    try {
      setError("");
      setLoadingUser(true);
      setLoadingVideos(true);

      const [userData, videosData] = await Promise.all([
        getMe(actualToken),
        getVideos(actualToken),
      ]);

      setUser(userData);
      setVideos(Array.isArray(videosData) ? videosData : []);
    } catch (e) {
      console.error(e);
      setError(e.message || "Не удалось загрузить данные профиля");
    } finally {
      setLoadingUser(false);
      setLoadingVideos(false);
    }
  }

  useEffect(() => {
    loadProfileData();
  }, [token]);

  async function handleApplyFilters() {
    const actualToken = token || localStorage.getItem("access_token");

    if (!actualToken) {
      setError("Нет токена авторизации");
      return;
    }

    try {
      setError("");
      setLoadingVideos(true);

      const data = await getVideos(actualToken, {
        title: titleFilter.trim() || undefined,
        user: userFilter.trim() || undefined,
      });

      setVideos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError(e.message || "Не удалось применить фильтры");
    } finally {
      setLoadingVideos(false);
    }
  }

  async function handleResetFilters() {
    setTitleFilter("");
    setUserFilter("");

    const actualToken = token || localStorage.getItem("access_token");

    if (!actualToken) {
      setError("Нет токена авторизации");
      return;
    }

    try {
      setError("");
      setLoadingVideos(true);

      const data = await getVideos(actualToken);
      setVideos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError(e.message || "Не удалось сбросить фильтры");
    } finally {
      setLoadingVideos(false);
    }
  }

  async function handleDelete(videoId) {
    const actualToken = token || localStorage.getItem("access_token");

    if (!actualToken) {
      setError("Нет токена авторизации");
      return;
    }

    const confirmed = window.confirm("Удалить это видео?");
    if (!confirmed) {
      return;
    }

    try {
      setError("");
      await deleteVideo(actualToken, videoId);
      await handleApplyFilters();
    } catch (e) {
      console.error(e);
      setError(e.message || "Не удалось удалить видео");
    }
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>
      <h1>Личный кабинет</h1>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <button onClick={onBack}>На главную</button>
        <button onClick={onLogout}>Выйти</button>
      </div>

      {error ? <p style={{ color: "red" }}>{error}</p> : null}

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "24px",
        }}
      >
        <h2>Пользователь</h2>

        {loadingUser ? (
          <p>Загрузка пользователя...</p>
        ) : user ? (
          <div>
            <p>
              <strong>ФИО:</strong> {user.full_name}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Организация:</strong> {user.organization || "—"}
            </p>
            <p>
              <strong>Статус:</strong> {user.is_active ? "Активен" : "Неактивен"}
            </p>
          </div>
        ) : (
          <p>Не удалось получить пользователя</p>
        )}
      </section>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "24px",
        }}
      >
        <h2>Фильтры видео</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
            alignItems: "end",
          }}
        >
          <div>
            <label style={{ display: "block", marginBottom: "6px" }}>
              По названию
            </label>
            <input
              type="text"
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              placeholder="Например, video"
              style={{ width: "100%", padding: "8px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px" }}>
              По пользователю
            </label>
            <input
              type="text"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              placeholder="Например, Test User"
              style={{ width: "100%", padding: "8px" }}
            />
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleApplyFilters}>Применить</button>
            <button onClick={handleResetFilters}>Сбросить</button>
          </div>
        </div>
      </section>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "12px",
          padding: "16px",
        }}
      >
        <h2>Последние загруженные видео</h2>

        {loadingVideos ? (
          <p>Загрузка видео...</p>
        ) : videos.length === 0 ? (
          <p>Видео пока нет</p>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {videos.map((video) => (
              <div
                key={video.id}
                style={{
                  border: "1px solid #e5e5e5",
                  borderRadius: "12px",
                  padding: "16px",
                }}
              >
                <p>
                  <strong>Файл:</strong> {video.filename}
                </p>
                <p>
                  <strong>Пользователь:</strong>{" "}
                  {video.user_full_name || video.user_email || "—"}
                </p>
                <p>
                  <strong>Email:</strong> {video.user_email || "—"}
                </p>
                <p>
                  <strong>Камера ID:</strong> {video.camera_id || "—"}
                </p>
                <p>
                  <strong>Статус:</strong> {video.status}
                </p>
                <p>
                  <strong>Дата загрузки:</strong>{" "}
                  {video.uploaded_at
                    ? new Date(video.uploaded_at).toLocaleString()
                    : "—"}
                </p>

                {video.preview_url ? (
                  <div style={{ margin: "12px 0" }}>
                    <img
                      src={video.preview_url}
                      alt={video.filename}
                      style={{
                        width: "200px",
                        maxWidth: "100%",
                        height: "200px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid #ddd",
                        display: "block",
                      }}
                    />
                  </div>
                ) : null}

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

                  <button onClick={() => handleDelete(video.id)}>
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}