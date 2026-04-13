import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MapPage from "./pages/MapPage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  const [page, setPage] = useState("login");
  const [token, setToken] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("access_token");
    if (saved) {
      setToken(saved);
      setPage("map");
    }
  }, []);

  function handleLogin(access, refresh) {
    localStorage.setItem("access_token", access);
    if (refresh) localStorage.setItem("refresh_token", refresh);
    setToken(access);
    setPage("map");
  }

  function logout() {
    localStorage.clear();
    setToken("");
    setPage("login");
  }

  if (page === "login") {
    return <LoginPage onLogin={handleLogin} onOpenRegister={() => setPage("register")} />;
  }

  if (page === "register") {
    return <RegisterPage onOpenLogin={() => setPage("login")} />;
  }

  if (page === "profile") {
    return <ProfilePage token={token} onBack={() => setPage("map")} onLogout={logout} />;
  }

  return <MapPage token={token} onLogout={logout} onOpenProfile={() => setPage("profile")} />;
}