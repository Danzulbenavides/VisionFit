import { useRef } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";

interface SixDigitInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  ariaLabel?: string;
}

const BOX_COUNT = 6;

export default function SixDigitInput({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  ariaLabel = "6-digit code",
}: SixDigitInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const digits = value.padEnd(BOX_COUNT, " ").slice(0, BOX_COUNT).split("");

  const focusBox = (index: number) => {
    inputsRef.current[index]?.focus();
    inputsRef.current[index]?.select();
  };

  const handleChange = (index: number, raw: string) => {
    const entered = raw.replace(/\D/g, "");

    if (!entered) {
      return;
    }

    const next = value.padEnd(BOX_COUNT, " ").split("");
    let lastFilled = index;

    for (const digit of entered) {
      next[index] = digit;
      lastFilled = index;
      index += 1;

      if (index >= BOX_COUNT) {
        break;
      }
    }

    const newValue = next.join("").replace(/\s+$/, "").trimEnd();

    onChange(newValue);

    focusBox(Math.min(lastFilled + 1, BOX_COUNT - 1));
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();

      const next = value.padEnd(BOX_COUNT, " ").split("");

      if (next[index].trim()) {
        next[index] = " ";
        onChange(next.join("").trimEnd());
      } else if (index > 0) {
        next[index - 1] = " ";
        onChange(next.join("").trimEnd());
        focusBox(index - 1);
      }

      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusBox(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < BOX_COUNT - 1) {
      event.preventDefault();
      focusBox(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();

    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");

    if (!pasted) {
      return;
    }

    onChange(pasted.slice(0, BOX_COUNT));
    focusBox(Math.min(pasted.length, BOX_COUNT) - 1);
  };

  return (
    <div className="pin-boxes">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
          }}
          className="pin-input"
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={BOX_COUNT}
          value={digit.trim()}
          disabled={disabled}
          aria-label={`${ariaLabel} digit ${index + 1}`}
          autoFocus={autoFocus && index === 0}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
        />
      ))}
    </div>
  );
}
