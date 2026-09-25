import { Activity, ArrowRight, ChevronRight, HeartPulse, LockKeyhole, Mic, Pencil, ShieldCheck, Stethoscope, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_CONFIG } from "../config/appConfig";
import { ui } from "../config/uiCopy";
import { useApp } from "../context/AppContext";
import LanguageSwitch from "../components/LanguageSwitch";
import ThemeToggle from "../components/ThemeToggle";
import { localizeConditionName, localizeSymptoms } from "../services/medicalTranslation";

function formatSessionDate(dateString, lang) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString(lang, { hour: "numeric", minute: "2-digit" });
    if (isToday) {
      return `${lang === "hi" ? "आज" : "Today"} · ${timeStr}`;
    }
    return `${date.toLocaleDateString(lang, { month: "short", day: "numeric" })} · ${timeStr}`;
  } catch {
    return dateString;
  }
}

export default function Home() {
  const navigate = useNavigate();
  const { language, startInspection, pastSessions, loadPastSession, deleteSession, clearAllSessions } = useApp();
  const copy = ui(language);

  function start() {
    startInspection();
    navigate("/symptoms");
  }

  function openPastSession(session) {
    loadPastSession(session);
    navigate("/result");
  }

  function editPastSymptoms(event, session) {
    event.stopPropagation();
    loadPastSession(session);
    navigate("/symptoms");
  }

  function handleDeleteSession(event, sessionId) {
    event.stopPropagation();
    if (window.confirm(copy.confirmDeleteSession)) {
      deleteSession(sessionId);
    }
  }

  function handleClearAll() {
    if (window.confirm(copy.confirmClearAll)) {
      clearAllSessions();
    }
  }

  const count = pastSessions.length;
  const countLabel = count === 1 ? copy.screeningSingular : copy.screeningPlural;

  return (
    <main className="app-screen home-screen">
      <header className="top-row home-header">
        <div className="brand-row home-brand">
          <button
            type="button"
            className="brand-mark small"
            onClick={start}
            aria-label={copy.newScreeningTooltip}
            title={copy.newScreeningTooltip}
          >
            +
          </button>
          <div>
            <strong>{APP_CONFIG.app.name}</strong>
            <small>{copy.notDiagnosis}</small>
          </div>
        </div>
        <div className="header-actions">
          <LanguageSwitch />
          <ThemeToggle />
        </div>
      </header>

      <div className="home-dashboard-layout">
        <div className="home-primary-col">
          <section className="hero-card">
            <div className="hero-medical-icons" aria-hidden="true">
              <div className="hero-orb primary">
                <HeartPulse size={26} />
              </div>
              <div className="hero-orb secondary">
                <Stethoscope size={20} />
              </div>
            </div>
            <p className="eyebrow">
              <Activity size={14} className="eyebrow-icon" /> {copy.aiHealthScreening}
            </p>
            <h1>{copy.howAreYouFeeling}</h1>
            <p>{copy.howAreYouFeelingHint}</p>
            <button className="accent-button hero-cta" onClick={start}>
              <span>{copy.startInspection}</span>
              <ArrowRight size={18} className="cta-arrow" />
            </button>
          </section>

          <div className="feature-chips-row" role="region" aria-label="Key features">
            <div className="feature-chip">
              <HeartPulse size={14} className="feature-chip-icon" />
              <span>{copy.healthCheckBadge}</span>
            </div>
            <div className="feature-chip">
              <Stethoscope size={14} className="feature-chip-icon" />
              <span>{copy.safeGuidanceBadge}</span>
            </div>
            <div className="feature-chip">
              <Mic size={14} className="feature-chip-icon" />
              <span>{copy.voiceEnabled}</span>
            </div>
            <div className="feature-chip">
              <LockKeyhole size={14} className="feature-chip-icon" />
              <span>{copy.privateAndSecure}</span>
            </div>
            <div className="feature-chip">
              <ShieldCheck size={14} className="feature-chip-icon" />
              <span>{copy.photoOptional}</span>
            </div>
          </div>
        </div>

        <aside className="home-secondary-col">
          <section className="history-section">
            <div className="section-header-row">
              <div className="section-title-wrap">
                <h2>{copy.previousInspections}</h2>
                {count > 0 && (
                  <span className="screenings-count-badge">
                    {count} {countLabel}
                  </span>
                )}
              </div>
              {count > 0 && (
                <button
                  type="button"
                  className="clear-all-btn"
                  onClick={handleClearAll}
                  aria-label={copy.clearAll}
                >
                  {copy.clearAll}
                </button>
              )}
            </div>

            {!pastSessions.length ? (
              <div className="empty-history-state">
                <p className="muted">{copy.noInspections}</p>
              </div>
            ) : (
              <div className="session-cards-list">
                {pastSessions.slice(0, 5).map((session) => {
                  const rawSymptoms = session.inspection?.answers?.symptoms;
                  const localizedSymptomStr = localizeSymptoms(rawSymptoms, language);
                  const symptomsList = localizedSymptomStr
                    ? localizedSymptomStr.split(/[,、/]+/).map((s) => s.trim()).filter(Boolean)
                    : [];
                  const rawCondition = session.result?.possibleConditions?.[0]?.name;
                  const primaryCondition = localizeConditionName(rawCondition, language) || APP_CONFIG.app.name;
                  const riskLevel = session.result?.riskLevel || "moderate";

                  return (
                    <article
                      className="session-card clickable"
                      key={session.sessionId}
                      onClick={() => openPastSession(session)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openPastSession(session);
                        }
                      }}
                    >
                      <div className="session-card-header">
                        <h3 className="session-card-title">{primaryCondition}</h3>
                        <span className={`severity-badge ${riskLevel}`}>
                          <span className="severity-dot" aria-hidden="true" />
                          <span>{copy[riskLevel] || riskLevel}</span>
                        </span>
                      </div>

                      {symptomsList.length > 0 && (
                        <div className="session-symptoms-row">
                          <div className="symptom-tag-list">
                            {symptomsList.map((sym, idx) => (
                              <span className="symptom-tag" key={`${sym}-${idx}`}>
                                {sym}
                              </span>
                            ))}
                          </div>
                          <button
                            type="button"
                            className="inline-edit-btn"
                            onClick={(e) => editPastSymptoms(e, session)}
                            aria-label={copy.editSymptoms}
                            title={copy.editSymptoms}
                          >
                            <Pencil size={12} aria-hidden="true" />
                          </button>
                        </div>
                      )}

                      <div className="session-card-footer">
                        <span className="session-date">
                          {formatSessionDate(session.createdAt, language)}
                        </span>
                        <div className="session-actions">
                          <button
                            type="button"
                            className="session-delete-btn"
                            onClick={(e) => handleDeleteSession(e, session.sessionId)}
                            aria-label={copy.deleteSession}
                            title={copy.deleteSession}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                          <span className="session-view-link">
                            <span>{copy.view}</span>
                            <ArrowRight size={13} aria-hidden="true" />
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

