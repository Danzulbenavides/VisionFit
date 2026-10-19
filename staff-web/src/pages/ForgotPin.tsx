import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";

import { forgotPin, resetPin, verifyPinCode } from "../api/auth";
import SixDigitInput from "../components/SixDigitInput";

type Step = "email" | "code" | "newPin" | "done";

const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPin() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("email");
  const [accountEmail, setAccountEmail] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    cooldownRef.current = setInterval(() => {
      setCooldown((seconds) => {
        if (seconds <= 1) {
          if (cooldownRef.current) {
            clearInterval(cooldownRef.current);
          }

          return 0;
        }

        return seconds - 1;
      });
    }, 1000);

    return () => {
      if (cooldownRef.current) {
        clearInterval(cooldownRef.current);
      }
    };
  }, [cooldown]);

  const errorMessage = (err: unknown) => {
    if (isAxiosError(err)) {
      return (
        err.response?.data?.error?.message || err.message || "Something went wrong."
      );
    }

    if (err instanceof Error) {
      return err.message;
    }

    return "Something went wrong.";
  };

  const requestCode = async () => {
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const result = await forgotPin(
        accountEmail.trim(),
        recoveryEmail.trim(),
      );

      if (result.error) {
        setError(result.error.message);
        return;
      }

      setInfo(
        result.data?.message ||
          `A 6-digit reset code was sent to ${recoveryEmail.trim().toLowerCase()}.`,
      );
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setCode("");
      setStep("code");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await requestCode();
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) {
      return;
    }

    setLoading(true);
    setError("");
    setInfo("");

    try {
      const result = await forgotPin(
        accountEmail.trim(),
        recoveryEmail.trim(),
      );

      if (result.error) {
        setError(result.error.message);
        return;
      }

      setInfo("A new code has been sent.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setCode("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (code.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await verifyPinCode(accountEmail.trim(), code);

      if (result.error) {
        setError(result.error.message);
        return;
      }

      setInfo("");
      setPin("");
      setConfirmPin("");
      setStep("newPin");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (pin.length !== 6) {
      setError("PIN must be exactly 6 digits.");
      return;
    }

    if (pin !== confirmPin) {
      setError("PINs do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await resetPin(accountEmail.trim(), code, pin);

      if (result.error) {
        setError(result.error.message);
        return;
      }

      setInfo("");
      setStep("done");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <p className="login-eyebrow">VISIONFIT PIN RECOVERY</p>

          <h1>
            {step === "email"
              ? "Forgot PIN?"
              : step === "code"
                ? "Enter the code"
                : step === "newPin"
                  ? "Set a new PIN"
                  : "PIN updated"}
          </h1>

          <p>
            {step === "email"
              ? "Enter the account whose PIN you want to change and an authorized recovery email. We will send a 6-digit code there."
              : step === "code"
                ? `We sent a 6-digit code to ${recoveryEmail}. It expires in 10 minutes.`
                : step === "newPin"
                  ? `Choose a new 6-digit PIN for ${accountEmail}.`
                  : "Your PIN has been changed. You can now sign in with it."}
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={handleEmailSubmit} noValidate>
            <label>
              Account email
              <input
                type="email"
                value={accountEmail}
                onChange={(event) => setAccountEmail(event.target.value)}
                placeholder="admin@visionfit.com"
                autoComplete="email"
                required
              />
            </label>

            <label>
              Recovery email
              <input
                type="email"
                value={recoveryEmail}
                onChange={(event) => setRecoveryEmail(event.target.value)}
                placeholder="your-recovery@gmail.com"
                autoComplete="email"
                required
              />
            </label>

            {error ? <p className="login-error">{error}</p> : null}

            <button
              type="submit"
              disabled={loading || !accountEmail.trim() || !recoveryEmail.trim()}
            >
              {loading ? "Sending..." : "Send Code"}
            </button>
          </form>
        ) : null}

        {step === "code" ? (
          <form onSubmit={handleCodeSubmit} noValidate>
            <label>
              Verification code
              <SixDigitInput
                value={code}
                onChange={setCode}
                disabled={loading}
                autoFocus
                ariaLabel="Verification code"
              />
            </label>

            {info ? <p className="pin-info">{info}</p> : null}
            {error ? <p className="login-error">{error}</p> : null}

            <button type="submit" disabled={loading || code.length !== 6}>
              {loading ? "Verifying..." : "Verify Code"}
            </button>

            <div className="pin-actions">
              <button
                type="button"
                className="pin-link"
                onClick={() => {
                  setStep("email");
                  setError("");
                  setInfo("");
                  setCode("");
                }}
                disabled={loading}
              >
                Change emails
              </button>

              <button
                type="button"
                className="pin-link"
                onClick={handleResend}
                disabled={loading || cooldown > 0}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          </form>
        ) : null}

        {step === "newPin" ? (
          <form onSubmit={handlePinSubmit} noValidate>
            <label>
              New 6-digit PIN
              <SixDigitInput
                value={pin}
                onChange={setPin}
                disabled={loading}
                autoFocus
                ariaLabel="New PIN"
              />
            </label>

            <label>
              Confirm new PIN
              <SixDigitInput
                value={confirmPin}
                onChange={setConfirmPin}
                disabled={loading}
                ariaLabel="Confirm new PIN"
              />
            </label>

            {error ? <p className="login-error">{error}</p> : null}

            <button
              type="submit"
              disabled={loading || pin.length !== 6 || confirmPin.length !== 6}
            >
              {loading ? "Saving..." : "Save New PIN"}
            </button>
          </form>
        ) : null}

        {step === "done" ? (
          <div className="pin-done">
            <p className="pin-info">Your new PIN is ready to use.</p>

            <button type="button" onClick={() => navigate("/login")}>
              Back to Sign In
            </button>
          </div>
        ) : null}

        {step !== "done" ? (
          <p className="pin-footer">
            <Link to="/login">Back to sign in</Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
