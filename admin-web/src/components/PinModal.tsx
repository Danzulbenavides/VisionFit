import { useState } from "react";

import SixDigitInput from "./SixDigitInput";

interface PinModalProps {
  loading: boolean;
  error: string;
  onVerify: (pin: string) => void | Promise<void>;
  onBack: () => void;
  onForgotPin: () => void;
}

export default function PinModal({
  loading,
  error,
  onVerify,
  onBack,
  onForgotPin,
}: PinModalProps) {
  const [pin, setPin] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (pin.length !== 6 || loading) {
      return;
    }

    await onVerify(pin);

    // The parent reports a wrong PIN through `error`; always clear the
    // boxes after an attempt so a rejection retypes cleanly.
    setPin("");
  };

  return (
    <div className="pin-overlay" role="dialog" aria-modal="true">
      <div className="login-card pin-modal">
        <div className="login-header">
          <p className="login-eyebrow">VISIONFIT SECURITY CHECK</p>

          <h1>Enter your PIN</h1>

          <p>Your password was accepted. Enter your 6-digit PIN to finish
            signing in.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <SixDigitInput
            value={pin}
            onChange={setPin}
            disabled={loading}
            autoFocus
            ariaLabel="PIN"
          />

          {error ? <p className="login-error">{error}</p> : null}

          <button type="submit" disabled={loading || pin.length !== 6}>
            {loading ? "Verifying..." : "Verify PIN"}
          </button>

          <div className="pin-actions">
            <button
              type="button"
              className="pin-link"
              onClick={onBack}
              disabled={loading}
            >
              Back to password
            </button>

            <button
              type="button"
              className="pin-link"
              onClick={onForgotPin}
              disabled={loading}
            >
              Forgot PIN?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
