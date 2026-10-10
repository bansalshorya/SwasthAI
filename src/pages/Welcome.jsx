import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  HeartPulse,
  LockKeyhole,
  Mic,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { APP_CONFIG } from "../config/appConfig";
import { localize } from "../config/localize";
import { ui } from "../config/uiCopy";
import { useApp } from "../context/AppContext";
import LanguageSwitch from "../components/LanguageSwitch";
import ThemeToggle from "../components/ThemeToggle";
import StartScreeningButton from "../components/StartScreeningButton";

export default function Welcome() {
  const navigate = useNavigate();
  const { language, speakText } = useApp();
  const copy = ui(language);

  useEffect(() => {
    speakText(localize(APP_CONFIG.welcome.voicePrompt, language));
  }, [language, speakText]);

  const previewSymptomChip = language === "hi" ? "बुखार और बदन दर्द" : "Fever & body ache";
  const previewStatusTriage = language === "hi" ? "मूल्यांकन जारी" : "Evaluating";
  const previewClarification =
    language === "hi"
      ? "2 दिन से शुरू · तापमान 101°F · गले में खराश"
      : "Started 2 days ago · 101°F · Mild sore throat";
  const previewResultNote =
    language === "hi"
      ? "सुरक्षित देखभाल सलाह एवं उचित क्लिनिकल मार्गदर्शन"
      : "Structured triage with safety-first next steps";

  return (
    <div className="welcome-page">
      {/* Editorial Top Navigation Header */}
      <header className="welcome-header">
        <div className="welcome-header-inner">
          <div className="welcome-brand">
            <span className="welcome-brand-icon" aria-hidden="true">
              <HeartPulse size={22} strokeWidth={2.2} />
            </span>
            <div className="welcome-brand-text">
              <span className="welcome-brand-name">{APP_CONFIG.app.name}</span>
              <span className="welcome-brand-tagline">Clinical Triage</span>
            </div>
          </div>

          <div className="welcome-header-controls">
            <LanguageSwitch />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="welcome-hero-container">
        <div className="welcome-hero-grid">
          {/* Left Column: Editorial Headline, Subtitle, Emerald CTA, Trust Indicators */}
          <section className="welcome-hero-content">
            <div className="welcome-kicker">
              <span className="welcome-kicker-dot" aria-hidden="true" />
              <span>{copy.decisionSupportEyebrow || "AI Decision Support & Triage"}</span>
            </div>

            <h1 className="welcome-headline">
              {localize(APP_CONFIG.welcome.title, language)}
            </h1>

            <p className="welcome-subtitle">
              {localize(APP_CONFIG.welcome.subtitle, language)}
            </p>

            <div className="welcome-cta-group">
              <StartScreeningButton
                className="welcome-primary-cta"
                label={localize(APP_CONFIG.welcome.startLabel, language)}
                onClick={() => navigate("/onboarding")}
                size="large"
              />
              <span className="welcome-cta-microcopy">
                {language === "hi"
                  ? "लगभग 2 मिनट · कोई साइन-अप आवश्यक नहीं"
                  : "Takes ~2 minutes · No sign-up required"}
              </span>
            </div>

            <div className="welcome-trust-row" aria-label="Privacy and safety assurances">
              <div className="welcome-trust-item">
                <ShieldCheck size={16} aria-hidden="true" />
                <span>{copy.privateAndSecure}</span>
              </div>
              <span className="welcome-trust-sep" aria-hidden="true">·</span>
              <div className="welcome-trust-item">
                <Mic size={16} aria-hidden="true" />
                <span>{copy.voiceEnabled}</span>
              </div>
              <span className="welcome-trust-sep" aria-hidden="true">·</span>
              <div className="welcome-trust-item">
                <LockKeyhole size={15} aria-hidden="true" />
                <span>{copy.photoOptional}</span>
              </div>
            </div>
          </section>

          {/* Right Column: Integrated Screening Preview Card (replaces giant detached panel) */}
          <aside
            className="screening-preview-card"
            aria-label={copy.aiHealthScreening || "Screening preview"}
          >
            <div className="preview-card-header">
              <div className="preview-card-status">
                <span className="preview-pulse-dot" aria-hidden="true" />
                <span className="preview-status-text">
                  {language === "hi" ? "एआई स्वास्थ्य जाँच पूर्वावलोकन" : "Clinical Screening Flow"}
                </span>
              </div>
              <span className="preview-badge-secure">
                <ShieldCheck size={13} aria-hidden="true" />
                <span>{copy.decisionSupportDisclaimer || "Decision Support"}</span>
              </span>
            </div>

            <div className="preview-card-body">
              {/* Step 1: Voice / Text Input */}
              <div className="preview-step-item is-completed">
                <div className="preview-step-marker">
                  <CheckCircle2 size={16} aria-hidden="true" />
                </div>
                <div className="preview-step-content">
                  <div className="preview-step-label">
                    <span>{copy.workflowStep1Title}</span>
                    <span className="preview-step-time">0:00</span>
                  </div>
                  <div className="preview-chip-row">
                    <span className="preview-symptom-chip">
                      <Mic size={13} aria-hidden="true" />
                      {previewSymptomChip}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 2: Contextual Clarification */}
              <div className="preview-step-item is-active">
                <div className="preview-step-marker">
                  <span className="preview-step-number">2</span>
                </div>
                <div className="preview-step-content">
                  <div className="preview-step-label">
                    <span>{copy.workflowStep2Title}</span>
                    <span className="preview-tag-evaluating">{previewStatusTriage}</span>
                  </div>
                  <p className="preview-step-subtext">{previewClarification}</p>
                </div>
              </div>

              {/* Step 3: Clear Triage Guidance */}
              <div className="preview-step-item is-upcoming">
                <div className="preview-step-marker">
                  <span className="preview-step-number">3</span>
                </div>
                <div className="preview-step-content">
                  <div className="preview-step-label">
                    <span>{copy.workflowStep3Title}</span>
                  </div>
                  <p className="preview-step-subtext">{previewResultNote}</p>
                </div>
              </div>
            </div>

            {/* Preview Card Footer */}
            <div className="preview-card-footer">
              <div className="preview-footer-note">
                <Sparkles size={14} aria-hidden="true" />
                <span>{copy.notDiagnosis}</span>
              </div>
              <button
                type="button"
                className="preview-quick-start-btn"
                onClick={() => navigate("/onboarding")}
              >
                <span>{language === "hi" ? "शुरू करें" : "Start now"}</span>
                <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
