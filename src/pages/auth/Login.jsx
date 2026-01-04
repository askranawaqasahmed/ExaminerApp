import React, { useMemo, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { createApiClient } from "@/utils/apiClient";

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState("superadmin@examiner.com");
  const [password, setPassword] = useState("SuperAdmin@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const API_BASE = import.meta.env.VITE_API_BASE || "https://examiner.ideageek.pk";
  const client = useMemo(() => createApiClient({ baseUrl: API_BASE }), [API_BASE]);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Please provide both username and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await client({
        path: "/api/auth/login",
        method: "POST",
        body: { username, password },
        skipToken: true,
      });
      if (!res.success) {
        throw new Error(res.message || "Invalid credentials");
      }
      const payload = res.value ?? res.data ?? {};
      const token =
        payload.token ||
        payload.accessToken ||
        payload.access_token ||
        payload.data?.token ||
        payload.data?.accessToken ||
        payload.data?.access_token;
      if (!token) {
        throw new Error("Auth response missing token");
      }
      const userEmail = payload.user?.email || payload.email || username;
      login({ token, email: userEmail });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-dot" />
          <div>
            <h1>Examiner Login</h1>
            <p>Access the dashboard and API console.</p>
          </div>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="superadmin@examiner.com"
              autoComplete="username"
            />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="SuperAdmin@123"
              autoComplete="current-password"
            />
          </label>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Signing in..." : "Continue"}
          </button>
        </form>
        <div className="auth-footnote">This is a placeholder login. Hook it to your real auth later.</div>
      </div>
    </div>
  );
};

export default Login;
