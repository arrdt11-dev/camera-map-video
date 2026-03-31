import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function CameraMap() {
  useEffect(() => {
    const map = L.map("map").setView([55.751244, 37.618423], 10);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    fetch("http://localhost:8000/cameras/geojson")
      .then((res) => res.json())
      .then((data) => {
        data.features.forEach((feature) => {
          const coords = feature.geometry.coordinates;
          const props = feature.properties;

          const lat = coords[1];
          const lng = coords[0];

          const color = props.has_video ? "red" : "blue";

          const marker = L.circleMarker([lat, lng], {
            radius: props.has_video ? 10 : 5,
            color,
          }).addTo(map);

          marker.bindPopup(`
            <b>${props.camera_name}</b><br/>
            Videos: ${props.videos_count}<br/>
            Has video: ${props.has_video}
          `);
        });
      })
      .catch((error) => {
        console.error("Failed to load cameras:", error);
      });

    return () => map.remove();
  }, []);

  return <div id="map" style={{ height: "600px", width: "100%" }}></div>;
}
