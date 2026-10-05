import { useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  FileText,
  HeartPulse,
  LockKeyhole,
  Pencil,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_CONFIG } from "../config/appConfig";
import { localize } from "../config/localize";
import { ui } from "../config/uiCopy";
import { useApp } from "../context/AppContext";
import LanguageSwitch from "../components/LanguageSwitch";
import ThemeToggle from "../components/ThemeToggle";
import { sanitizeDegreeSymbols } from "../services/aiSkillEngine";

export default function Review() {
  const navigate = useNavigate();
  const { language, activeSession, isOnline, showToast } = useApp();
  const copy = ui(language);

  useEffect(() => {
    if (!activeSession) {
      navigate("/home", { replace: true });
    }
  }, [activeSession, navigate]);

  if (!activeSession) return null;

  const answers = activeSession?.inspection?.answers ?? {};
  const symptoms = answers.symptoms?.trim() || "";
  const images = activeSession?.inspection?.images ?? [];

  const questionsList = (APP_CONFIG.questions || []).map((q) => {
    const rawVal = answers[q.key];
    const option = q.options?.find((opt) => opt.value === rawVal);
    return {
      key: q.key,
      title: localize(q.title, language),
      value: option ? localize(option.label, language) : rawVal || null,
    };
  }).filter((item) => item.value !== null);

  function handleStartAnalysis() {
    if (!isOnline) {
      showToast(copy.offlineAlert, "error");
      return;
    }
    navigate("/analysis");
  }

  return (
    <main className="app-screen review-screen">
      <header className="top-row">
        <button
          type="button"
          className="icon-button"
          onClick={() => navigate("/inspection")}
          aria-label={copy.back}
        >
          <ArrowLeft />
        </button>
        <div className="header-actions">
          <div className="step-label" aria-label={copy.reviewStepLabel}>
            {copy.reviewStepLabel}
          </div>
          <LanguageSwitch />
          <ThemeToggle />
        </div>
      </header>

      <div className="progress-track" aria-hidden="true">
        <span style={{ width: "85%" }} />
      </div>

      <section className="review-heading">
        <div className="section-icon">
          <CheckCircle2 size={24} />
        </div>
        <p className="eyebrow">{copy.reviewTitle}</p>
        <h1>{copy.reviewTitle}</h1>
        <p className="review-subtitle">{copy.reviewSubtitle}</p>
      </section>

      <div className="review-content-stack">
        {/* Section 1: Symptoms */}
        <section className="review-card" aria-labelledby="heading-review-symptoms">
          <div className="review-card-header">
            <div className="review-card-title-wrap">
              <HeartPulse size={18} className="review-section-icon" aria-hidden="true" />
              <h2 id="heading-review-symptoms">{copy.reviewSymptomsSection}</h2>
            </div>
            <button
              type="button"
              className="inline-edit-btn"
              onClick={() => navigate("/symptoms")}
              aria-label={`${copy.edit} ${copy.reviewSymptomsSection}`}
              title={copy.edit}
            >
              <Pencil size={14} aria-hidden="true" />
              <span className="edit-btn-text">{copy.edit}</span>
            </button>
          </div>
          <div className="review-card-body">
            {symptoms ? (
              <p className="review-symptoms-text">{sanitizeDegreeSymbols(symptoms)}</p>
            ) : (
              <p className="review-empty-text">{copy.noSymptomsEntered}</p>
            )}
          </div>
        </section>

        {/* Section 2: Question Answers */}
        <section className="review-card" aria-labelledby="heading-review-answers">
          <div className="review-card-header">
            <div className="review-card-title-wrap">
              <FileText size={18} className="review-section-icon" aria-hidden="true" />
              <h2 id="heading-review-answers">{copy.reviewQuestionsSection}</h2>
            </div>
            <button
              type="button"
              className="inline-edit-btn"
              onClick={() => navigate("/questions")}
              aria-label={`${copy.edit} ${copy.reviewQuestionsSection}`}
              title={copy.edit}
            >
              <Pencil size={14} aria-hidden="true" />
              <span className="edit-btn-text">{copy.edit}</span>
            </button>
          </div>
          <div className="review-card-body">
            {questionsList.length > 0 ? (
              <div className="review-qa-grid">
                {questionsList.map((item) => (
                  <div key={item.key} className="review-qa-item">
                    <span className="review-qa-label">{item.title}</span>
                    <strong className="review-qa-val">{sanitizeDegreeSymbols(item.value)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="review-empty-text">{copy.noAnswersProvided}</p>
            )}
          </div>
        </section>

        {/* Section 3: Photo Context */}
        <section className="review-card" aria-labelledby="heading-review-photos">
          <div className="review-card-header">
            <div className="review-card-title-wrap">
              <Camera size={18} className="review-section-icon" aria-hidden="true" />
              <h2 id="heading-review-photos">{copy.reviewPhotoSection}</h2>
            </div>
            <button
              type="button"
              className="inline-edit-btn"
              onClick={() => navigate("/inspection")}
              aria-label={`${copy.edit} ${copy.reviewPhotoSection}`}
              title={copy.edit}
            >
              <Pencil size={14} aria-hidden="true" />
              <span className="edit-btn-text">{copy.edit}</span>
            </button>
          </div>
          <div className="review-card-body">
            {images.length > 0 ? (
              <div className="review-photos-grid">
                {images.map((img, idx) => (
                  <div key={img.id || idx} className="review-photo-item">
                    <img src={img.dataUrl} alt={`Attached context ${idx + 1}`} className="review-photo-thumb" />
                    <span className="review-photo-tag">{copy.photoAttached}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="review-no-photo-box">
                <span className="review-no-photo-badge">{copy.photoOptional}</span>
                <p>{copy.noPhotoAttached}</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="review-trust-banner">
        <LockKeyhole size={16} aria-hidden="true" />
        <p>{copy.reviewPrivacyNotice}</p>
      </div>

      <div className="review-cta-row">
        <button
          type="button"
          className="accent-button review-primary-cta"
          onClick={handleStartAnalysis}
        >
          <Sparkles size={18} aria-hidden="true" />
          <span>{copy.startAnalysisCta}</span>
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </main>
  );
}
