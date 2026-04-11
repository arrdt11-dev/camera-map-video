import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MapPage from "./pages/MapPage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  const [page, setPage] = useState("login");
  const [token, setToken] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("access_token");

    if (savedToken) {
      setToken(savedToken);
      setPage("map");
    } else {
      setPage("login");
    }
  }, []);

  function handleLogin(accessToken) {
    localStorage.setItem("access_token", accessToken);
    setToken(accessToken);
    setPage("map");
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setToken("");
    setPage("login");
  }

  function openRegister() {
    setPage("register");
  }

  function openLogin() {
    setPage("login");
  }

  function openProfile() {
    setPage("profile");
  }

  function openMap() {
    setPage("map");
  }

  if (page === "register") {
    return <RegisterPage onOpenLogin={openLogin} />;
  }

  if (page === "profile") {
    return (
      <ProfilePage
        token={token}
        onBack={openMap}
        onLogout={handleLogout}
      />
    );
  }

  if (page === "map" && token) {
    return (
      <MapPage
        token={token}
        onLogout={handleLogout}
        onOpenProfile={openProfile}
      />
    );
  }

  return (
    <LoginPage
      onLogin={handleLogin}
      onOpenRegister={openRegister}
    />
  );
}