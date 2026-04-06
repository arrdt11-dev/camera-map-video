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

        const me = await getMe(token);
        setUser(me);

        const allVideos = await getVideos(token);
        setVideos(allVideos.slice(0, 5));
      } catch (err) {
        setError(err.message || "Не удалось получить пользователя");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadProfile();
    } else {
      setError("Токен отсутствует");
      setLoading(false);
    }
  }, [token]);

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto" }}>
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button onClick={onBack}>На главную</button>
        <button onClick={onLogout}>Выйти</button>
      </div>

      <h1>Личный кабинет</h1>

      {loading && <p>Загрузка...</p>}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {user && (
        <div style={{ marginBottom: "24px" }}>
          <p><strong>ФИО:</strong> {user.full_name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Организация:</strong> {user.organization || "—"}</p>
        </div>
      )}

      <h2>Последние загруженные видео</h2>

      {videos.length === 0 ? (
        <p>Видео пока нет</p>
      ) : (
        <ul>
          {videos.map((video) => (
            <li key={video.id}>
              {video.filename}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}