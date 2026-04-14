import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { getCamerasGeoJson } from "../api";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const pageStyle = {
  minHeight: "100vh",
  background: "#f3f4f6",
  padding: "24px 16px",
  boxSizing: "border-box",
};

const containerStyle = {
  maxWidth: "1400px",
  margin: "0 auto",
};

const topBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "18px",
  flexWrap: "wrap",
};

const titleStyle = {
  margin: 0,
  fontSize: "28px",
  fontWeight: 800,
  color: "#111827",
};

const buttonRowStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const primaryButtonStyle = {
  border: "none",
  borderRadius: "12px",
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: 700,
  background: "#2563eb",
  color: "#ffffff",
};

const secondaryButtonStyle = {
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: 700,
  background: "#ffffff",
  color: "#111827",
};

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "360px 1fr",
  gap: "18px",
  alignItems: "start",
};

const cardStyle = {
  background: "#ffffff",
  borderRadius: "18px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
  padding: "18px",
};

const filtersTitleStyle = {
  fontSize: "18px",
  fontWeight: 800,
  margin: "0 0 14px 0",
  color: "#111827",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  outline: "none",
  background: "#fff",
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 700,
  color: "#374151",
  marginBottom: "6px",
};

const fieldBlockStyle = {
  marginBottom: "14px",
};

const mapCardStyle = {
  ...cardStyle,
  padding: "10px",
};

const statsStyle = {
  fontSize: "14px",
  color: "#4b5563",
  marginBottom: "12px",
};

const popupTitleStyle = {
  fontWeight: 800,
  fontSize: "16px",
  marginBottom: "8px",
  color: "#111827",
};

const popupLineStyle = {
  margin: "4px 0",
  color: "#374151",
  fontSize: "14px",
};

const popupButtonStyle = {
  marginTop: "10px",
  border: "none",
  borderRadius: "10px",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 700,
  background: "#111827",
  color: "#ffffff",
};

const loadingStyle = {
  fontSize: "15px",
  color: "#374151",
  padding: "12px 0",
};

const errorStyle = {
  fontSize: "14px",
  color: "#b91c1c",
  background: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: "12px",
  padding: "10px 12px",
  marginBottom: "12px",
};

function getFeatureProps(feature) {
  return feature?.properties || {};
}

function toInputNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return "";
  }
  const num = Number(value);
  return Number.isNaN(num) ? "" : num;
}

export default function MapPage({ onLogout, onOpenProfile, onOpenLocation }) {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [draftFilters, setDraftFilters] = useState({
    search: "",
    minVideos: "",
    maxVideos: "",
    model: "",
    cameraType: "",
    cameraClass: "",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    minVideos: "",
    maxVideos: "",
    model: "",
    cameraType: "",
    cameraClass: "",
  });

  useEffect(() => {
    loadCameras(appliedFilters);
  }, [appliedFilters]);

  async function loadCameras(filters) {
    try {
      setLoading(true);
      setError("");

      const data = await getCamerasGeoJson(filters);
      const nextFeatures = Array.isArray(data?.features) ? data.features : [];
      setFeatures(nextFeatures);
    } catch (e) {
      setError(e.message || "Не удалось загрузить камеры");
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  }

  function handleDraftChange(field, value) {
    setDraftFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleApplyFilters() {
    setAppliedFilters({
      search: draftFilters.search,
      minVideos: toInputNumber(draftFilters.minVideos),
      maxVideos: toInputNumber(draftFilters.maxVideos),
      model: draftFilters.model,
      cameraType: draftFilters.cameraType,
      cameraClass: draftFilters.cameraClass,
    });
  }

  function handleResetFilters() {
    const empty = {
      search: "",
      minVideos: "",
      maxVideos: "",
      model: "",
      cameraType: "",
      cameraClass: "",
    };

    setDraftFilters(empty);
    setAppliedFilters(empty);
  }

  const stats = useMemo(() => {
    const total = features.length;
    const withVideo = features.filter((item) => {
      const props = getFeatureProps(item);
      return Number(props.videos_count || 0) > 0;
    }).length;

    const videos = features.reduce((sum, item) => {
      const props = getFeatureProps(item);
      return sum + Number(props.videos_count || 0);
    }, 0);

    return {
      total,
      withVideo,
      videos,
    };
  }, [features]);

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={topBarStyle}>
          <h1 style={titleStyle}>Карта камер и видео</h1>

          <div style={buttonRowStyle}>
            <button type="button" style={secondaryButtonStyle} onClick={onOpenProfile}>
              Личный кабинет
            </button>
            <button type="button" style={secondaryButtonStyle} onClick={onLogout}>
              Выйти
            </button>
          </div>
        </div>

        <div style={layoutStyle}>
          <div style={cardStyle}>
            <h2 style={filtersTitleStyle}>Фильтры</h2>

            {error ? <div style={errorStyle}>{error}</div> : null}

            <div style={statsStyle}>
              Найдено камер: <b>{stats.total}</b>
              <br />
              Камер с видео: <b>{stats.withVideo}</b>
              <br />
              Всего видео: <b>{stats.videos}</b>
            </div>

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Поиск по названию</label>
              <input
                style={inputStyle}
                type="text"
                placeholder="Например: камера 1"
                value={draftFilters.search}
                onChange={(e) => handleDraftChange("search", e.target.value)}
              />
            </div>

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Минимум видео</label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                placeholder="0"
                value={draftFilters.minVideos}
                onChange={(e) => handleDraftChange("minVideos", e.target.value)}
              />
            </div>

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Максимум видео</label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                placeholder="10"
                value={draftFilters.maxVideos}
                onChange={(e) => handleDraftChange("maxVideos", e.target.value)}
              />
            </div>

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Модель</label>
              <input
                style={inputStyle}
                type="text"
                placeholder="Например: Hikvision"
                value={draftFilters.model}
                onChange={(e) => handleDraftChange("model", e.target.value)}
              />
            </div>

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Тип камеры</label>
              <input
                style={inputStyle}
                type="text"
                placeholder="Например: IP"
                value={draftFilters.cameraType}
                onChange={(e) => handleDraftChange("cameraType", e.target.value)}
              />
            </div>

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Класс камеры</label>
              <input
                style={inputStyle}
                type="text"
                placeholder="Например: Городская"
                value={draftFilters.cameraClass}
                onChange={(e) => handleDraftChange("cameraClass", e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button type="button" style={primaryButtonStyle} onClick={handleApplyFilters}>
                Применить
              </button>

              <button type="button" style={secondaryButtonStyle} onClick={handleResetFilters}>
                Сбросить
              </button>
            </div>
          </div>

          <div style={mapCardStyle}>
            {loading ? (
              <div style={loadingStyle}>Загрузка карты и камер...</div>
            ) : (
              <MapContainer
                center={[55.751244, 37.618423]}
                zoom={11}
                style={{
                  height: "78vh",
                  width: "100%",
                  borderRadius: "14px",
                }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {features.map((feature) => {
                  const props = getFeatureProps(feature);
                  const coords = feature?.geometry?.coordinates || [];
                  const longitude = coords[0];
                  const latitude = coords[1];

                  if (
                    typeof latitude !== "number" ||
                    typeof longitude !== "number"
                  ) {
                    return null;
                  }

                  return (
                    <Marker
                      key={props.id || props.camera_id || `${latitude}-${longitude}`}
                      position={[latitude, longitude]}
                    >
                      <Popup>
                        <div>
                          <div style={popupTitleStyle}>
                            {props.camera_name || "Без названия"}
                          </div>

                          <div style={popupLineStyle}>
                            <b>ID:</b> {props.camera_id || "—"}
                          </div>

                          <div style={popupLineStyle}>
                            <b>Видео:</b> {props.videos_count || 0}
                          </div>

                          {props.model ? (
                            <div style={popupLineStyle}>
                              <b>Модель:</b> {props.model}
                            </div>
                          ) : null}

                          {props.camera_type ? (
                            <div style={popupLineStyle}>
                              <b>Тип:</b> {props.camera_type}
                            </div>
                          ) : null}

                          {props.camera_class ? (
                            <div style={popupLineStyle}>
                              <b>Класс:</b> {props.camera_class}
                            </div>
                          ) : null}

                          <button
                            type="button"
                            style={popupButtonStyle}
                            onClick={() => onOpenLocation(feature)}
                          >
                            Открыть локацию
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}