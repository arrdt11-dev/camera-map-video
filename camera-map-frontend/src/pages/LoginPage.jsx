import { useState } from "react";
import { loginUser } from "../api";

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f3f4f6",
  padding: "20px",
  boxSizing: "border-box",
};

const cardStyle = {
  width: "100%",
  maxWidth: "460px",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "28px",
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
};

const titleStyle = {
  margin: "0 0 24px 0",
  fontSize: "32px",
  fontWeight: 800,
  color: "#111827",
  textAlign: "center",
};

const fieldWrapStyle = {
  marginBottom: "16px",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontSize: "15px",
  fontWeight: 700,
  color: "#374151",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  fontSize: "15px",
  outline: "none",
};

const errorStyle = {
  marginBottom: "16px",
  padding: "12px 14px",
  borderRadius: "12px",
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#b91c1c",
  fontSize: "14px",
  fontWeight: 600,
};

const actionsStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "8px",
};

const primaryButtonStyle = {
  border: "none",
  borderRadius: "12px",
  padding: "12px 18px",
  cursor: "pointer",
  fontWeight: 700,
  background: "#2563eb",
  color: "#ffffff",
};

const secondaryButtonStyle = {
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  padding: "12px 18px",
  cursor: "pointer",
  fontWeight: 700,
  background: "#ffffff",
  color: "#111827",
};

export default function LoginPage({ onLoginSuccess, onOpenRegister }) {
  const [email, setEmail] = useState("test@test.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const data = await loginUser({
        email,
        password,
      });

      if (typeof onLoginSuccess !== "function") {
        throw new Error("Функция onLoginSuccess не передана в LoginPage");
      }

      onLoginSuccess(data.access_token, data.refresh_token);
    } catch (e) {
      setError(e.message || "Ошибка авторизации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <form style={cardStyle} onSubmit={handleSubmit}>
        <h1 style={titleStyle}>Авторизация</h1>

        {error ? <div style={errorStyle}>{error}</div> : null}

        <div style={fieldWrapStyle}>
          <label style={labelStyle}>Email</label>
          <input
            style={inputStyle}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Введите email"
            required
          />
        </div>

        <div style={fieldWrapStyle}>
          <label style={labelStyle}>Пароль</label>
          <input
            style={inputStyle}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите пароль"
            required
          />
        </div>

        <div style={actionsStyle}>
          <button type="submit" style={primaryButtonStyle} disabled={loading}>
            {loading ? "Вход..." : "Войти"}
          </button>

          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={onOpenRegister}
            disabled={loading}
          >
            Регистрация
          </button>
        </div>
      </form>
    </div>
  );
}