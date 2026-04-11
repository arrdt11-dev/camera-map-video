import { useState } from "react";
import { loginUser } from "../api";

export default function LoginPage({ onLogin, onOpenRegister }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(form);

      if (!data.access_token) {
        throw new Error("Сервер не вернул access_token");
      }

      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }

      onLogin(data.access_token);
    } catch (e) {
      setError(e.message || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "24px", maxWidth: "420px", margin: "0 auto" }}>
      <h1>Авторизация</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "12px" }}>
          <label>Email</label>
          <br />
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label>Пароль</label>
          <br />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        {error && (
          <p style={{ color: "red" }}>{error}</p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Входим..." : "Войти"}
        </button>
      </form>

      <div style={{ marginTop: "16px" }}>
        <button type="button" onClick={onOpenRegister}>
          Регистрация
        </button>
      </div>
    </div>
  );
}