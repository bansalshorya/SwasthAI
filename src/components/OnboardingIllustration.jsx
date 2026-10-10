import React from "react";
import { Mic, ClipboardList, Camera, Sparkles, CheckCircle2 } from "lucide-react";

/**
 * OnboardingIllustration
 *
 * Provides a clean, cohesive, bespoke vector illustration for each of the 3 onboarding steps:
 * 1. Describe symptoms (Mic + Soundwaves + Care speech bubble)
 * 2. Useful questions (Clean questionnaire clipboard with clean checkbox bullet lines - replaces broken glyphs/marks)
 * 3. Photo is optional (Restrained camera viewfinder + gentle shield + sparkles)
 */
export default function OnboardingIllustration({ stepIndex = 0 }) {
  if (stepIndex === 0) {
    // Step 1: Voice & Symptom description
    return (
      <div className="onboarding-illu-stage" aria-hidden="true">
        <div className="illu-canvas">
          <div className="illu-glow" />
          <div className="illu-badge-circle primary">
            <Mic size={42} strokeWidth={1.75} />
          </div>
          <div className="illu-wave illu-wave-1" />
          <div className="illu-wave illu-wave-2" />
          <div className="illu-pill-tag tag-top">
            <span className="illu-dot" />
            <span>Voice or text</span>
          </div>
          <div className="illu-pill-tag tag-bottom">
            <span>हिंदी / English</span>
          </div>
        </div>
      </div>
    );
  }

  if (stepIndex === 1) {
    // Step 2: A few useful questions - Clean medical questionnaire
    return (
      <div className="onboarding-illu-stage" aria-hidden="true">
        <div className="illu-canvas">
          <div className="illu-glow" />
          <div className="illu-questionnaire-card">
            <div className="illu-card-header">
              <span className="illu-card-bar" />
              <span className="illu-card-dot" />
            </div>
            <div className="illu-card-row active">
              <span className="illu-check-box checked">
                <CheckCircle2 size={13} strokeWidth={2.5} />
              </span>
              <span className="illu-row-line line-wide" />
            </div>
            <div className="illu-card-row">
              <span className="illu-check-box" />
              <span className="illu-row-line line-med" />
            </div>
            <div className="illu-card-row">
              <span className="illu-check-box" />
              <span className="illu-row-line line-short" />
            </div>
          </div>
          <div className="illu-floating-icon right">
            <ClipboardList size={22} strokeWidth={2} />
          </div>
          <div className="illu-pill-tag tag-bottom">
            <span>Duration & severity</span>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Photo is optional
  return (
    <div className="onboarding-illu-stage" aria-hidden="true">
      <div className="illu-canvas">
        <div className="illu-glow" />
        <div className="illu-camera-viewfinder">
          <div className="viewfinder-corner tl" />
          <div className="viewfinder-corner tr" />
          <div className="viewfinder-corner bl" />
          <div className="viewfinder-corner br" />
          <div className="illu-lens-circle">
            <Camera size={38} strokeWidth={1.8} />
          </div>
        </div>
        <div className="illu-floating-icon star-icon">
          <Sparkles size={18} strokeWidth={2} />
        </div>
        <div className="illu-pill-tag tag-bottom">
          <span>100% Optional</span>
        </div>
      </div>
    </div>
  );
}
