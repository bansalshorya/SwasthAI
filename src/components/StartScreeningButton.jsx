import React from "react";
import { ArrowRight, Mic } from "lucide-react";

/**
 * StartScreeningButton
 *
 * Implements requirement #5:
 * A primary CTA with a subtle, continuous idle animation transitioning smoothly
 * between an arrow icon and a microphone icon in a loop.
 *
 * - Idle state: smoothly cross-fades & translates between ArrowRight and Mic
 * - Decorative only: does NOT request mic permissions or start recording
 * - Respects prefers-reduced-motion: shows a stable icon
 * - Keyboard-accessible with visible focus
 * - Width-stable container so button text and layout never shift
 */
export default function StartScreeningButton({
  onClick,
  label = "Start Screening",
  className = "",
  size = "normal", // "normal" | "large"
  ariaLabel,
}) {
  return (
    <button
      type="button"
      className={`start-screening-cta ${size === "large" ? "cta-large" : ""} ${className}`}
      onClick={onClick}
      aria-label={ariaLabel || label}
    >
      <span className="start-screening-label">{label}</span>
      <span className="start-screening-icon-stage" aria-hidden="true">
        <span className="start-screening-icon arrow-phase">
          <ArrowRight size={size === "large" ? 20 : 18} />
        </span>
        <span className="start-screening-icon mic-phase">
          <Mic size={size === "large" ? 20 : 18} />
        </span>
      </span>
    </button>
  );
}
