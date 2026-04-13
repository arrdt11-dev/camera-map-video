import { useEffect, useState } from "react";
import { getCamerasGeoJson, uploadVideo, getVideos } from "../api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
});

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
});

export default function MapPage({ token, onLogout, onOpenProfile }) {
  const [cameras, setCameras] = useState([]);
  const [cameraVideos, setCameraVideos] = useState({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = await getCamerasGeoJson();
    setCameras(data.features || []);
  }

  async function loadVideos(cameraId) {
    const t = token || localStorage.getItem("access_token");
    if (!t) return;

    const data = await getVideos(t, { camera_id: cameraId });

    setCameraVideos((p) => ({ ...p, [cameraId]: data }));
  }

  async function handleUpload(e, id) {
    e.preventDefault();
    const t = token || localStorage.getItem("access_token");

    const input = e.target.querySelector("input");
    if (!input.files[0]) return alert("Выбери файл");

    await uploadVideo(t, {
      file: input.files[0],
      camera_id: id,
    });

    alert("Загружено");
    input.value = "";
    await load();
    await loadVideos(id);
  }

  return (
    <div style={{ height: "100vh" }}>
      <div style={{ position: "absolute", zIndex: 1000 }}>
        <button onClick={onOpenProfile}>ЛК</button>
        <button onClick={onLogout}>Выйти</button>
      </div>

      <MapContainer center={[55.75, 37.61]} zoom={12} style={{ height: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {cameras.map((c) => {
          const [lng, lat] = c.geometry.coordinates;
          const p = c.properties;

          return (
            <Marker
              key={p.id}
              position={[lat, lng]}
              icon={p.has_video ? redIcon : new L.Icon.Default()}
              eventHandlers={{
                click: () => loadVideos(p.id),
              }}
            >
              <Popup>
                <h3>{p.camera_name}</h3>
                <p>Видео: {p.videos_count}</p>

                <form onSubmit={(e) => handleUpload(e, p.id)}>
                  <input type="file" />
                  <button>Импорт</button>
                </form>

                {cameraVideos[p.id]?.map((v) => (
                  <div key={v.id}>
                    <img src={v.preview_url} width="120" />
                    <a href={v.video_url} target="_blank">Открыть</a>
                  </div>
                ))}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}