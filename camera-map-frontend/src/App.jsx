import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MapPage from "./pages/MapPage";
import ProfilePage from "./pages/ProfilePage";
import LocationPage from "./pages/LocationPage";

export default function App() {
  const [page, setPage] = useState("login");
  const [token, setToken] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("access_token");

    if (savedToken) {
      setToken(savedToken);
      setPage("map");
    } else {
      setToken("");
      setPage("login");
    }
  }, []);

  function handleLogin(accessToken, refreshToken) {
    localStorage.setItem("access_token", accessToken);

    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    }

    setToken(accessToken);
    setPage("map");
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setToken("");
    setSelectedLocation(null);
    setPage("login");
  }

  function handleOpenRegister() {
    setPage("register");
  }

  function handleOpenLogin() {
    setPage("login");
  }

  function handleOpenProfile() {
    setPage("profile");
  }

  function handleOpenMap() {
    setPage("map");
  }

  function handleOpenLocation(location) {
    setSelectedLocation(location);
    setPage("location");
  }

  if (page === "register") {
    return (
      <RegisterPage
        onRegisterSuccess={handleLogin}
        onOpenLogin={handleOpenLogin}
      />
    );
  }

  if (page === "profile") {
    return (
      <ProfilePage
        token={token}
        onLogout={handleLogout}
        onBack={handleOpenMap}
      />
    );
  }

  if (page === "location") {
    return (
      <LocationPage
        location={selectedLocation}
        onBack={handleOpenMap}
        onOpenProfile={handleOpenProfile}
        onLogout={handleLogout}
      />
    );
  }

  if (page === "map" && token) {
    return (
      <MapPage
        token={token}
        onLogout={handleLogout}
        onOpenProfile={handleOpenProfile}
        onOpenLocation={handleOpenLocation}
      />
    );
  }

  return (
    <LoginPage
      onLoginSuccess={handleLogin}
      onOpenRegister={handleOpenRegister}
    />
  );
}