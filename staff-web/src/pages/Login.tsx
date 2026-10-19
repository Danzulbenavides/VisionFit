import { useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";

import { login, verifyPin } from "../api/auth";
import PinModal from "../components/PinModal";
import { ALLOWED_ROLES } from "../utils/auth";
import { validateEmail } from "../utils/validators";

const errorMessage = (err: unknown) => {
  if (isAxiosError(err)) {
    return (
      err.response?.data?.error?.message || err.message || "Unable to sign in."
    );
  }

  if (err instanceof Error) {
    return err.message;
  }

  return "Unable to sign in.";
};

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Set once the password step succeeds; the PIN modal stays open until the
  // PIN is verified or the user goes back.
  const [challenge, setChallenge] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const emailError = validateEmail(email);

    if (emailError) {
      setError(emailError);
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await login(email.trim(), password);

      if (result.error) {
        setError(result.error.message);
        return;
      }

      const user = result.data?.user;

      if (!user) {
        throw new Error("Login did not return user information.");
      }

      if (!ALLOWED_ROLES.includes(user.role ?? "")) {
        throw new Error("This account does not have staff access. Admins must use the admin website.");
      }

      if (result.data?.requiresPin) {
        if (!result.data.challenge) {
          throw new Error("Login did not return a PIN challenge.");
        }

        setPinError("");
        setChallenge(result.data.challenge);
        return;
      }

      const token = result.data?.token;

      if (!token) {
        throw new Error("Login did not return an authentication token.");
      }

      sessionStorage.setItem("staffToken", token);
      sessionStorage.setItem("staffUser", JSON.stringify(user));

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err: unknown) {
      console.error("Staff login error:", err);

      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPin = async (pin: string) => {
    if (!challenge) {
      return;
    }

    setPinLoading(true);
    setPinError("");

    try {
      const result = await verifyPin(challenge, pin);

      if (result.error) {
        setPinError(result.error.message);
        return;
      }

      const token = result.data?.token;
      const user = result.data?.user;

      if (!token || !user) {
        throw new Error("PIN verification did not return a session.");
      }

      sessionStorage.setItem("staffToken", token);
      sessionStorage.setItem("staffUser", JSON.stringify(user));

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err: unknown) {
      console.error("Staff PIN error:", err);

      setPinError(errorMessage(err));
    } finally {
      setPinLoading(false);
    }
  };

  const handleBackFromPin = () => {
    setChallenge(null);
    setPinError("");
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <p className="login-eyebrow">VISIONFIT STAFF</p>

          <h1>Welcome back</h1>

          <p>
            Sign in to manage VisionFit products, orders, and inventory.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="staff@example.com"
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

      {challenge ? (
        <PinModal
          loading={pinLoading}
          error={pinError}
          onVerify={handleVerifyPin}
          onBack={handleBackFromPin}
          onForgotPin={() => navigate("/forgot-pin")}
        />
      ) : null}
    </div>
  );
}
