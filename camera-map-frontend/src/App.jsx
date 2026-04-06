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

  function handleLogin(accessToken, refreshToken) {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    setToken(accessToken);
    setPage("map");
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setToken("");
    setPage("login");
  }

  if (page === "login") {
    return (
      <LoginPage
        onLogin={handleLogin}
        onGoToRegister={() => setPage("register")}
      />
    );
  }

  if (page === "register") {
    return <RegisterPage onGoToLogin={() => setPage("login")} />;
  }

  if (page === "profile") {
    return (
      <ProfilePage
        token={token}
        onBack={() => setPage("map")}
        onLogout={handleLogout}
      />
    );
  }

  if (page === "map") {
    return (
      <MapPage
        onOpenProfile={() => setPage("profile")}
        onLogout={handleLogout}
      />
    );
  }

  return <div>Приложение работает</div>;
}