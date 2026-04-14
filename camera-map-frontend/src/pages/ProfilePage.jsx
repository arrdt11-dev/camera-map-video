import { useEffect, useMemo, useState } from "react";
import { deleteVideo, getMe, getVideos } from "../api";

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

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "24px",
  flexWrap: "wrap",
};

const titleBlockStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const titleStyle = {
  margin: 0,
  fontSize: "28px",
  fontWeight: 800,
  color: "#111827",
};

const subtitleStyle = {
  margin: 0,
  fontSize: "15px",
  color: "#6b7280",
};

const actionsStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const primaryButtonStyle = {
  border: "none",
  borderRadius: "12px",
  padding: "11px 16px",
  cursor: "pointer",
  fontWeight: 700,
  background: "#111827",
  color: "#ffffff",
};

const secondaryButtonStyle = {
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  padding: "11px 16px",
  cursor: "pointer",
  fontWeight: 700,
  background: "#ffffff",
  color: "#111827",
};

const errorStyle = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#b91c1c",
  borderRadius: "12px",
  padding: "12px 14px",
  marginBottom: "18px",
};

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "320px 1fr",
  gap: "20px",
  alignItems: "start",
};

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "20px",
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
};

const sectionTitleStyle = {
  margin: "0 0 18px 0",
  fontSize: "20px",
  fontWeight: 800,
  color: "#111827",
};

const infoRowStyle = {
  marginBottom: "14px",
  color: "#374151",
  fontSize: "15px",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "12px",
  marginBottom: "18px",
};

const statCardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "14px",
  background: "#f9fafb",
};

const statValueStyle = {
  fontSize: "18px",
  fontWeight: 800,
  color: "#111827",
  marginBottom: "4px",
};

const statLabelStyle = {
  fontSize: "13px",
  color: "#6b7280",
};

const filtersRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
  marginBottom: "18px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  fontSize: "15px",
  outline: "none",
  background: "#ffffff",
};

const emptyStyle = {
  border: "1px dashed #d1d5db",
  borderRadius: "14px",
  padding: "24px",
  textAlign: "center",
  color: "#6b7280",
  fontWeight: 600,
};

const videoListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

const videoCardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "14px",
  background: "#ffffff",
};

const videoHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
  alignItems: "flex-start",
};

const videoTitleStyle = {
  margin: "0 0 8px 0",
  fontSize: "16px",
  fontWeight: 800,
  color: "#111827",
  wordBreak: "break-word",
};

const metaStyle = {
  fontSize: "14px",
  color: "#4b5563",
  margin: "4px 0",
};

const videoActionsStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

const openButtonStyle = {
  border: "none",
  borderRadius: "10px",
  padding: "9px 12px",
  cursor: "pointer",
  fontWeight: 700,
  background: "#2563eb",
  color: "#ffffff",
};

const deleteButtonStyle = {
  border: "1px solid #fecaca",
  borderRadius: "10px",
  padding: "9px 12px",
  cursor: "pointer",
  fontWeight: 700,
  background: "#ffffff",
  color: "#b91c1c",
};

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function getVideoUrl(video) {
  return (
    video?.video_url ||
    video?.file_url ||
    video?.url ||
    video?.public_url ||
    video?.download_url ||
    null
  );
}

function getPreviewUrl(video) {
  return (
    video?.preview_url ||
    video?.thumbnail_url ||
    video?.preview ||
    null
  );
}

export default function ProfilePage({ onLogout, onBack }) {
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchUser, setSearchUser] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const me = await getMe();
      setUser(me);

      const vids = await getVideos();
      setVideos(Array.isArray(vids) ? vids : []);
    } catch (e) {
      const message = e.message || "Ошибка загрузки профиля";

      if (message.toLowerCase().includes("token")) {
        onLogout();
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(videoId) {
    const confirmed = window.confirm("Удалить это видео?");
    if (!confirmed) {
      return;
    }

    try {
      await deleteVideo(videoId);
      setVideos((prev) => prev.filter((item) => item.id !== videoId));
    } catch (e) {
      alert(e.message || "Не удалось удалить видео");
    }
  }

  function handleOpenVideo(video) {
    const url = getVideoUrl(video);

    if (!url) {
      alert("У этого видео нет ссылки для открытия");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      const filename = (video?.filename || "").toLowerCase();
      const owner = (
        video?.user_full_name ||
        video?.owner_name ||
        video?.uploaded_by ||
        ""
      ).toLowerCase();

      const byName = filename.includes(searchName.trim().toLowerCase());
      const byUser = owner.includes(searchUser.trim().toLowerCase());

      return byName && byUser;
    });
  }, [videos, searchName, searchUser]);

  const stats = useMemo(() => {
    const myEmail = (user?.email || "").toLowerCase();

    const mine = videos.filter((video) => {
      const ownerEmail = (video?.user_email || "").toLowerCase();
      return myEmail && ownerEmail === myEmail;
    });

    return {
      total: videos.length,
      filtered: filteredVideos.length,
      mine: mine.length,
    };
  }, [videos, filteredVideos, user]);

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div style={titleBlockStyle}>
            <h1 style={titleStyle}>Личный кабинет</h1>
            <p style={subtitleStyle}>
              Информация о пользователе и все доступные видео
            </p>
          </div>

          <div style={actionsStyle}>
            <button type="button" style={secondaryButtonStyle} onClick={onBack}>
              ← Назад к карте
            </button>
            <button type="button" style={primaryButtonStyle} onClick={onLogout}>
              Выйти
            </button>
          </div>
        </div>

        {error ? <div style={errorStyle}>{error}</div> : null}

        <div style={layoutStyle}>
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Пользователь</h2>

            <div style={infoRowStyle}>
              <b>ФИО:</b> {user?.full_name || "—"}
            </div>
            <div style={infoRowStyle}>
              <b>Email:</b> {user?.email || "—"}
            </div>
            <div style={infoRowStyle}>
              <b>Организация:</b> {user?.organization || "—"}
            </div>
            <div style={infoRowStyle}>
              <b>Статус:</b> {user?.is_active ? "Активен" : "Неактивен"}
            </div>
            <div style={infoRowStyle}>
              <b>Дата регистрации:</b> {formatDate(user?.created_at)}
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Видео</h2>

            <div style={statsGridStyle}>
              <div style={statCardStyle}>
                <div style={statValueStyle}>{stats.total}</div>
                <div style={statLabelStyle}>Всего видео</div>
              </div>

              <div style={statCardStyle}>
                <div style={statValueStyle}>{stats.filtered}</div>
                <div style={statLabelStyle}>Найдено по фильтрам</div>
              </div>

              <div style={statCardStyle}>
                <div style={statValueStyle}>{stats.mine}</div>
                <div style={statLabelStyle}>Моих видео</div>
              </div>
            </div>

            <div style={filtersRowStyle}>
              <input
                style={inputStyle}
                type="text"
                placeholder="Поиск по названию видео"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
              <input
                style={inputStyle}
                type="text"
                placeholder="Поиск по пользователю"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
              />
            </div>

            {loading ? (
              <div style={emptyStyle}>Загрузка видео...</div>
            ) : filteredVideos.length === 0 ? (
              <div style={emptyStyle}>Видео не найдены</div>
            ) : (
              <div style={videoListStyle}>
                {filteredVideos.map((video) => {
                  const previewUrl = getPreviewUrl(video);
                  const ownerName =
                    video?.user_full_name ||
                    video?.owner_name ||
                    video?.uploaded_by ||
                    "—";

                  return (
                    <div key={video.id} style={videoCardStyle}>
                      <div style={videoHeaderStyle}>
                        <div style={{ flex: 1, minWidth: "260px" }}>
                          <h3 style={videoTitleStyle}>
                            {video?.filename || "Без названия"}
                          </h3>

                          <div style={metaStyle}>
                            <b>Пользователь:</b> {ownerName}
                          </div>

                          <div style={metaStyle}>
                            <b>Камера:</b>{" "}
                            {video?.camera_name ||
                              video?.camera_id ||
                              "Не привязано"}
                          </div>

                          <div style={metaStyle}>
                            <b>Статус:</b> {video?.status || "—"}
                          </div>

                          <div style={metaStyle}>
                            <b>Загружено:</b> {formatDate(video?.uploaded_at)}
                          </div>
                        </div>

                        <div style={videoActionsStyle}>
                          <button
                            type="button"
                            style={openButtonStyle}
                            onClick={() => handleOpenVideo(video)}
                          >
                            Открыть
                          </button>

                          <button
                            type="button"
                            style={deleteButtonStyle}
                            onClick={() => handleDelete(video.id)}
                          >
                            Удалить
                          </button>
                        </div>
                      </div>

                      {previewUrl ? (
                        <div style={{ marginTop: "12px" }}>
                          <img
                            src={previewUrl}
                            alt={video?.filename || "preview"}
                            style={{
                              width: "100%",
                              maxWidth: "320px",
                              borderRadius: "12px",
                              border: "1px solid #e5e7eb",
                              display: "block",
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}