import { useEffect, useMemo, useState } from "react";
import { getMe, getVideos } from "../api";

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString("ru-RU");
  } catch {
    return value;
  }
}

export default function ProfilePage({ token, onBack, onLogout }) {
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);

  const [titleFilter, setTitleFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");

  const [error, setError] = useState("");
  const [videosError, setVideosError] = useState("");

  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const actualToken = token || localStorage.getItem("access_token");

      if (!actualToken) {
        setError("Токен отсутствует");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const me = await getMe(actualToken);
        setUser(me);
      } catch (err) {
        setError(err.message || "Не удалось получить пользователя");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [token]);

  useEffect(() => {
    async function loadVideos() {
      try {
        setVideosLoading(true);
        setVideosError("");

        const allVideos = await getVideos();
        setVideos(Array.isArray(allVideos) ? allVideos : []);
      } catch (err) {
        setVideosError(err.message || "Не удалось получить видео");
        setVideos([]);
      } finally {
        setVideosLoading(false);
      }
    }

    loadVideos();
  }, []);

  const myVideos = useMemo(() => {
    if (!user?.email) return [];

    return videos.filter((video) => video?.user_email === user.email);
  }, [videos, user]);

  const filteredAllVideos = useMemo(() => {
    return videos.filter((video) => {
      const fileName = (video?.filename || "").toLowerCase();
      const userName = (
        video?.user_full_name ||
        video?.user_email ||
        ""
      ).toLowerCase();

      const matchesTitle = fileName.includes(titleFilter.toLowerCase());
      const matchesUser = userName.includes(userFilter.toLowerCase());

      return matchesTitle && matchesUser;
    });
  }, [videos, titleFilter, userFilter]);

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "30px auto",
        padding: "0 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button onClick={onBack}>На главную</button>
        <button onClick={onLogout}>Выйти</button>
      </div>

      <h1>Личный кабинет</h1>

      {loading && <p>Загрузка профиля...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {user && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
            background: "#fff",
          }}
        >
          <h2>Информация о пользователе</h2>
          <p><strong>ФИО:</strong> {user.full_name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Организация:</strong> {user.organization || "—"}</p>
          <p><strong>Статус:</strong> {user.is_active ? "Активен" : "Неактивен"}</p>
          <p><strong>Дата регистрации:</strong> {formatDate(user.created_at)}</p>
        </div>
      )}

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "24px",
          background: "#fff",
        }}
      >
        <h2>Мои последние загруженные видео</h2>

        {videosLoading && <p>Загрузка видео...</p>}
        {videosError && <p style={{ color: "red" }}>{videosError}</p>}

        {!videosLoading && !videosError && myVideos.length === 0 && (
          <p>У вас пока нет загруженных видео.</p>
        )}

        {!videosLoading && !videosError && myVideos.length > 0 && (
          <div style={{ display: "grid", gap: "12px" }}>
            {myVideos.slice(0, 5).map((video) => (
              <div
                key={video.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  padding: "12px",
                }}
              >
                <div style={{ marginBottom: "6px" }}>
                  <strong>{video.filename}</strong>
                </div>
                <div><strong>Камера:</strong> {video.camera_id || "—"}</div>
                <div><strong>Дата загрузки:</strong> {formatDate(video.uploaded_at)}</div>
                <div><strong>Статус:</strong> {video.status || "—"}</div>

                {video.video_url ? (
                  <div style={{ marginTop: "8px" }}>
                    <a href={video.video_url} target="_blank" rel="noreferrer">
                      Открыть видео
                    </a>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "16px",
          background: "#fff",
        }}
      >
        <h2>Все видео</h2>

        <div
          style={{
            display: "grid",
            gap: "10px",
            marginBottom: "16px",
          }}
        >
          <input
            type="text"
            placeholder="Фильтр по названию видео"
            value={titleFilter}
            onChange={(e) => setTitleFilter(e.target.value)}
            style={{ padding: "10px", fontSize: "14px" }}
          />

          <input
            type="text"
            placeholder="Фильтр по пользователю"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            style={{ padding: "10px", fontSize: "14px" }}
          />
        </div>

        {videosLoading && <p>Загрузка видео...</p>}
        {videosError && <p style={{ color: "red" }}>{videosError}</p>}

        {!videosLoading && !videosError && filteredAllVideos.length === 0 ? (
          <p>Видео не найдены.</p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {filteredAllVideos.map((video) => (
              <div
                key={video.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  padding: "12px",
                }}
              >
                {video.preview_url ? (
                  <img
                    src={video.preview_url}
                    alt={video.filename}
                    style={{
                      width: "100%",
                      maxWidth: "320px",
                      height: "180px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      marginBottom: "10px",
                    }}
                  />
                ) : null}

                <div style={{ marginBottom: "6px" }}>
                  <strong>{video.filename}</strong>
                </div>

                <div><strong>Пользователь:</strong> {video.user_full_name || "—"}</div>
                <div><strong>Email:</strong> {video.user_email || "—"}</div>
                <div><strong>Камера:</strong> {video.camera_id || "—"}</div>
                <div><strong>Дата загрузки:</strong> {formatDate(video.uploaded_at)}</div>
                <div><strong>Статус:</strong> {video.status || "—"}</div>

                {video.video_url ? (
                  <div style={{ marginTop: "8px" }}>
                    <a href={video.video_url} target="_blank" rel="noreferrer">
                      Открыть видео
                    </a>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}