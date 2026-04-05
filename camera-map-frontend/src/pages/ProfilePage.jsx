import { useEffect, useState } from "react";
import { getMe } from "../services/api";

export default function ProfilePage({ token, onGoToMap, onLogout }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        setError("");

        const userData = await getMe(token);
        setUser(userData);
      } catch (err) {
        setError(err.message || "Ошибка загрузки профиля");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadUser();
    } else {
      setLoading(false);
      setError("Токен не найден");
    }
  }, [token]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h2>Личный кабинет</h2>

        <div style={styles.buttons}>
          <button onClick={onGoToMap} style={styles.secondaryButton}>
            На главную
          </button>
          <button onClick={onLogout} style={styles.button}>
            Выйти
          </button>
        </div>
      </div>

      {loading && <p>Загрузка...</p>}
      {error && <p style={styles.error}>{error}</p>}

      {!loading && !error && user && (
        <div style={styles.card}>
          <h3>Информация о пользователе</h3>
          <p><b>Email:</b> {user.email}</p>
          <p><b>ФИО:</b> {user.full_name}</p>
          <p><b>Организация:</b> {user.organization || "-"}</p>
          <p><b>ID:</b> {user.id}</p>
          <p><b>Активен:</b> {user.is_active ? "Да" : "Нет"}</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    padding: "24px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  buttons: {
    display: "flex",
    gap: "10px",
  },
  card: {
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "16px",
    background: "#fafafa",
    marginBottom: "20px",
  },
  button: {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    background: "#222",
    color: "#fff",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    background: "#fff",
    color: "#222",
    cursor: "pointer",
  },
  error: {
    color: "red",
  },
};