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

  if (page === "register") {
    return (
      <RegisterPage
        onSuccess={() => setPage("login")}
        onBack={() => setPage("login")}
      />
    );
  }

  if (page === "map") {
    return (
      <MapPage
        token={token}
        onLogout={handleLogout}
        onOpenProfile={() => setPage("profile")}
      />
    );
  }

  if (page === "profile") {
    return (
      <ProfilePage
        token={token}
        onLogout={handleLogout}
        onBack={() => setPage("map")}
      />
    );
  }

  return (
    <LoginPage
      onLogin={handleLogin}
      onOpenRegister={() => setPage("register")}
    />
  );
}