import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { login } from "../api/auth";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const result = await login(email.trim(), password);

      if (result.error) {
        setError(result.error.message);
        return;
      }

      const token = result.data?.token;
      const user = result.data?.user;

      if (!token) {
        throw new Error("Login did not return an authentication token.");
      }

      if (!user) {
        throw new Error("Login did not return user information.");
      }

      if (user.role !== "ADMIN") {
        throw new Error("This account does not have administrator access.");
      }

      sessionStorage.setItem("adminToken", token);
      sessionStorage.setItem("adminUser", JSON.stringify(user));

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err: any) {
      console.error("Admin login error:", err);

      setError(
        err?.response?.data?.error?.message ||
          err?.message ||
          "Unable to sign in.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <p className="login-eyebrow">VISIONFIT ADMIN</p>

          <h1>Welcome back</h1>

          <p>
            Sign in to manage VisionFit products, orders, users, and inventory.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <p className="login-error">{error}</p> : null}

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
