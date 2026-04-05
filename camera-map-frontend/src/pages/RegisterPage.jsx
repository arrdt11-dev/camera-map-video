import { useState } from "react";
import { registerUser } from "../services/api";

export default function RegisterPage({ onGoToLogin }) {
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    password: "",
    organization: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      await registerUser(form);
      setMessage("Регистрация успешна. Теперь войди.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <form style={styles.form} onSubmit={handleSubmit}>
        <h2>Регистрация</h2>

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          style={styles.input}
          required
        />

        <input
          name="full_name"
          type="text"
          placeholder="ФИО"
          value={form.full_name}
          onChange={handleChange}
          style={styles.input}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Пароль"
          value={form.password}
          onChange={handleChange}
          style={styles.input}
          required
        />

        <input
          name="organization"
          type="text"
          placeholder="Организация (необязательно)"
          value={form.organization}
          onChange={handleChange}
          style={styles.input}
        />

        {message && <p style={styles.success}>{message}</p>}
        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Сохраняем..." : "Зарегистрироваться"}
        </button>

        <button
          type="button"
          style={styles.linkButton}
          onClick={onGoToLogin}
        >
          Назад ко входу
        </button>
      </form>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f5f5",
  },
  form: {
    width: "360px",
    background: "#fff",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#222",
    color: "#fff",
    cursor: "pointer",
  },
  linkButton: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    background: "#fff",
    cursor: "pointer",
  },
  error: {
    color: "red",
    margin: 0,
  },
  success: {
    color: "green",
    margin: 0,
  },
};