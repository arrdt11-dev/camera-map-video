import { useEffect, useState } from "react";
import { getCamerasGeoJson } from "../api";

export default function MapPage({ onLogout, onOpenProfile }) {
  const [cameras, setCameras] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCameras() {
      try {
        setLoading(true);
        setError("");

        if (typeof getCamerasGeoJson !== "function") {
          throw new Error("Функция getCamerasGeoJson не найдена");
        }

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

    loadCameras();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Карта с камерами и видео</h1>

      <div style={{ marginBottom: "16px", display: "flex", gap: "10px" }}>
        <button type="button" onClick={onOpenProfile}>
          Личный кабинет
        </button>
        <button type="button" onClick={onLogout}>
          Выйти
        </button>
      </div>

      {loading && <p>Загрузка камер...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "16px",
        }}
      >
        <h2>Камеры</h2>

        {!loading && cameras.length === 0 && <p>Камеры не найдены</p>}

        {cameras.map((cam, index) => {
          const props = cam?.properties || {};
          const coords = Array.isArray(cam?.geometry?.coordinates)
            ? cam.geometry.coordinates
            : null;

          const key = props.id || props.camera_id || index;

          return (
            <div
              key={key}
              style={{
                borderBottom: "1px solid #eee",
                padding: "8px 0",
              }}
            >
              <strong>{props.camera_name || "Без названия"}</strong>
              <div>Модель: {props.model || "—"}</div>
              <div>Видео: {props.videos_count ?? 0}</div>
              <div>
                Координаты: {coords ? `${coords[1]}, ${coords[0]}` : "—"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}