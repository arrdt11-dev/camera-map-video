import { useEffect, useState } from "react";
import { getMe, getVideos } from "../api";

export default function ProfilePage({ token, onBack, onLogout }) {
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        if (!token) {
          throw new Error("Токен отсутствует");
        }

        const userData = await getMe(token);
        setUser(userData);

        const videosData = await getVideos(token);
        setVideos(Array.isArray(videosData) ? videosData : []);
      } catch (e) {
        console.error("Ошибка загрузки профиля:", e);
        setError(e.message || "Не удалось получить пользователя");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [token]);

  return (
    <div style={{ padding: "24px" }}>
      <h1>Личный кабинет</h1>

      <div style={{ marginBottom: "16px" }}>
        <button onClick={onBack} style={{ marginRight: "8px" }}>
          На главную
        </button>
        <button onClick={onLogout}>
          Выйти
        </button>
      </div>

      {loading && <p>Загрузка...</p>}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && user && (
        <div style={{ marginBottom: "24px" }}>
          <p><strong>ФИО:</strong> {user.full_name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Организация:</strong> {user.organization || "—"}</p>
        </div>
      )}

      {!loading && !error && (
        <div>
          <h2>Последние загруженные видео</h2>

          {videos.length === 0 ? (
            <p>Видео пока нет</p>
          ) : (
            <ul>
              {videos.map((video) => (
                <li key={video.id}>
                  {video.filename || video.original_filename || video.id}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}