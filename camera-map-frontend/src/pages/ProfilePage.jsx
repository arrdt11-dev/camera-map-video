import { useEffect, useMemo, useState } from "react";
import { getMe, getVideos, deleteVideo } from "../api";

export default function ProfilePage({ token, onLogout, onBack }) {
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [searchFilename, setSearchFilename] = useState("");
  const [searchUser, setSearchUser] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const userData = await getMe(token);
        setUser(userData);

        const videosData = await getVideos(token);
        setVideos(Array.isArray(videosData) ? videosData : []);
      } catch (e) {
        if (e.message === "INVALID_TOKEN") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.reload();
          return;
        }

        setError(e.message || "Ошибка загрузки профиля");
        setUser(null);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadData();
    } else {
      setLoading(false);
      setError("Токен отсутствует");
    }
  }, [token]);

  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      const filename = String(video?.filename || "").toLowerCase();
      const userFullName = String(video?.user_full_name || "").toLowerCase();

      return (
        filename.includes(searchFilename.toLowerCase()) &&
        userFullName.includes(searchUser.toLowerCase())
      );
    });
  }, [videos, searchFilename, searchUser]);

  async function handleDelete(videoId) {
    const confirmed = window.confirm("Удалить это видео?");
    if (!confirmed) return;

    try {
      await deleteVideo(videoId, token);
      setVideos((prev) => prev.filter((video) => video.id !== videoId));
    } catch (e) {
      if (e.message === "INVALID_TOKEN") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.reload();
        return;
      }

      alert(e.message || "Ошибка удаления видео");
    }
  }

  function handleOpenVideo(video) {
    const url =
      video?.video_url ||
      video?.file_url ||
      video?.url ||
      (video?.storage_key
        ? `http://localhost:9000/videos/${video.storage_key}`
        : "");

    if (!url) {
      alert("Видео недоступно");
      return;
    }

    window.open(url, "_blank");
  }

  function getPreviewUrl(video) {
    return (
      video?.preview_url ||
      video?.thumbnail_url ||
      (video?.preview_key
        ? `http://localhost:9000/previews/${video.preview_key}`
        : "")
    );
  }

  return (
    <div style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
      <h1>Личный кабинет</h1>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={onBack}>На главную</button>
        <button onClick={onLogout} style={{ marginLeft: "10px" }}>
          Выйти
        </button>
      </div>

      {error ? (
        <div style={{ color: "red", marginBottom: "20px" }}>{error}</div>
      ) : null}

      <div style={{ marginBottom: "24px" }}>
        <h2>Профиль</h2>
        <p>
          <strong>Имя:</strong> {user?.full_name || "-"}
        </p>
        <p>
          <strong>Email:</strong> {user?.email || "-"}
        </p>
        <p>
          <strong>Организация:</strong> {user?.organization || "-"}
        </p>
        <p>
          <strong>Статус:</strong> {user?.is_active ? "Активен" : "Неактивен"}
        </p>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <h2>Поиск по видео</h2>

        <input
          type="text"
          placeholder="Поиск по filename"
          value={searchFilename}
          onChange={(e) => setSearchFilename(e.target.value)}
          style={{ marginRight: "10px", padding: "8px", width: "220px" }}
        />

        <input
          type="text"
          placeholder="Поиск по user_full_name"
          value={searchUser}
          onChange={(e) => setSearchUser(e.target.value)}
          style={{ padding: "8px", width: "220px" }}
        />
      </div>

      <div>
        <h2>Последние видео</h2>

        {loading ? (
          <p>Загрузка...</p>
        ) : filteredVideos.length === 0 ? (
          <p>Видео не найдены</p>
        ) : (
          filteredVideos.map((video) => {
            const previewUrl = getPreviewUrl(video);

            return (
              <div
                key={video.id}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "10px",
                  padding: "16px",
                  marginBottom: "16px",
                }}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={video?.filename || "preview"}
                    style={{
                      width: "220px",
                      height: "140px",
                      objectFit: "cover",
                      display: "block",
                      marginBottom: "12px",
                    }}
                  />
                ) : null}

                <p>
                  <strong>Файл:</strong> {video?.filename || "-"}
                </p>
                <p>
                  <strong>Пользователь:</strong> {video?.user_full_name || "-"}
                </p>
                <p>
                  <strong>Камера:</strong> {video?.camera_id || "-"}
                </p>
                <p>
                  <strong>Дата загрузки:</strong> {video?.uploaded_at || "-"}
                </p>
                <p>
                  <strong>Статус:</strong> {video?.status || "-"}
                </p>

                <button onClick={() => handleOpenVideo(video)}>
                  Смотреть видео
                </button>

                <button
                  onClick={() => handleDelete(video.id)}
                  style={{ marginLeft: "10px", color: "red" }}
                >
                  Удалить
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}