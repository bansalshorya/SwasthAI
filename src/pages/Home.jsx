import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpDown,
  ClipboardList,
  HeartPulse,
  LockKeyhole,
  Mic,
  Pencil,
  RotateCcw,
  Search,
  ShieldCheck,
  Stethoscope,
  Trash2,
  WifiOff,
  X,
} from "lucide-react";
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
  const {
    language,
    startInspection,
    pastSessions,
    loadPastSession,
    deleteSession,
    clearAllSessions,
    isOnline,
    hasIncompleteSession,
    activeSession,
    discardActiveSession,
    showToast,
  } = useApp();
  const copy = ui(language);

  const [showStartNewModal, setShowStartNewModal] = useState(false);
  const [deleteModalTarget, setDeleteModalTarget] = useState(null); // null | { type: 'single', sessionId: string } | { type: 'all' }
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all"); // 'all' | 'low' | 'moderate' | 'high' | 'emergency'
  const [sortOrder, setSortOrder] = useState("newest"); // 'newest' | 'oldest'

  // Keyboard accessibility for modals (Escape key closes)
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setShowStartNewModal(false);
        setDeleteModalTarget(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter and sort historical sessions
  const processedSessions = useMemo(() => {
    let result = [...pastSessions];

    // 1. Text Search across condition name and symptoms
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((session) => {
        const rawCondition = session.result?.possibleConditions?.[0]?.name || "";
        const condition = localizeConditionName(rawCondition, language) || "";
        const rawSymptoms = session.inspection?.answers?.symptoms || "";
        const symptoms = localizeSymptoms(rawSymptoms, language) || "";
        return condition.toLowerCase().includes(query) || symptoms.toLowerCase().includes(query);
      });
    }

    // 2. Severity Filter
    if (severityFilter !== "all") {
      result = result.filter((session) => {
        const risk = (session.result?.riskLevel || "moderate").toLowerCase();
        if (severityFilter === "moderate") {
          return risk === "moderate" || risk === "medium";
        }
        return risk === severityFilter;
      });
    }

    // 3. Sort Order
    result.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return sortOrder === "oldest" ? timeA - timeB : timeB - timeA;
    });

    return result;
  }, [pastSessions, searchQuery, severityFilter, sortOrder, language]);

  function handleInitiateScreening() {
    if (!isOnline) {
      showToast(copy.offlineAlert, "error");
      return;
    }
    if (hasIncompleteSession) {
      setShowStartNewModal(true);
      return;
    }
    startInspection();
    navigate("/symptoms");
  }

  function confirmStartNew() {
    setShowStartNewModal(false);
    discardActiveSession();
    startInspection();
    navigate("/symptoms");
  }

  function resumeIncomplete() {
    const answers = activeSession?.inspection?.answers;
    const symptoms = answers?.symptoms?.trim();
    if (!symptoms) {
      navigate("/symptoms");
      return;
    }
    const questionsAnswered = APP_CONFIG.questions.every((q) => answers[q.key]);
    if (questionsAnswered) {
      navigate("/inspection");
    } else {
      navigate("/questions");
    }
  }

  function discardIncomplete() {
    discardActiveSession();
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

  function requestDeleteSession(event, sessionId) {
    event.stopPropagation();
    setDeleteModalTarget({ type: "single", sessionId });
  }

  function requestClearAll() {
    setDeleteModalTarget({ type: "all" });
  }

  function confirmDelete() {
    if (!deleteModalTarget) return;
    if (deleteModalTarget.type === "all") {
      clearAllSessions();
      showToast(copy.toastAllCleared, "success");
    } else if (deleteModalTarget.sessionId) {
      deleteSession(deleteModalTarget.sessionId);
      showToast(copy.toastScreeningDeleted, "success");
    }
    setDeleteModalTarget(null);
  }

  const count = pastSessions.length;
  const countLabel = count === 1 ? copy.screeningSingular : copy.screeningPlural;
  const isFilteringActive = searchQuery.trim() !== "" || severityFilter !== "all";

  return (
    <main className="app-screen home-screen">
      <header className="top-row home-header">
        <div className="brand-row home-brand">
          <button
            type="button"
            className="brand-mark small"
            onClick={handleInitiateScreening}
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

      {!isOnline && (
        <div className="offline-banner" role="status" aria-live="polite">
          <WifiOff size={18} className="offline-banner-icon" aria-hidden="true" />
          <div className="offline-banner-text">
            <strong>{copy.offlineBannerTitle}</strong>
            <p>{copy.offlineBannerDesc}</p>
          </div>
        </div>
      )}

      <div className="home-dashboard-layout">
        <div className="home-primary-col">
          {hasIncompleteSession && (
            <section className="resume-screening-card" aria-label={copy.resumeTitle}>
              <div className="resume-card-header">
                <div className="resume-icon-badge" aria-hidden="true">
                  <Activity size={18} />
                </div>
                <div>
                  <h3 className="resume-title">{copy.resumeTitle}</h3>
                  <p className="resume-desc">{copy.resumeDesc}</p>
                </div>
              </div>
              {activeSession?.inspection?.answers?.symptoms && (
                <div className="resume-symptom-preview">
                  <strong>{copy.symptomsLabel}:</strong>{" "}
                  <span>{activeSession.inspection.answers.symptoms}</span>
                </div>
              )}
              <div className="resume-actions">
                <button
                  type="button"
                  className="primary-button small"
                  onClick={resumeIncomplete}
                >
                  <span>{copy.resumeBtn}</span>
                  <ArrowRight size={15} />
                </button>
                <button
                  type="button"
                  className="secondary-button small"
                  onClick={discardIncomplete}
                >
                  <RotateCcw size={14} />
                  <span>{copy.startOverBtn}</span>
                </button>
              </div>
            </section>
          )}

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
            <button
              type="button"
              className="accent-button hero-cta"
              onClick={handleInitiateScreening}
            >
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
                  onClick={requestClearAll}
                  aria-label={copy.clearAll}
                >
                  {copy.clearAll}
                </button>
              )}
            </div>

            {count > 0 && (
              <div className="history-toolbar">
                <div className="history-search-wrap">
                  <Search size={15} className="history-search-icon" aria-hidden="true" />
                  <input
                    type="search"
                    className="history-search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={copy.searchPlaceholder}
                    aria-label={copy.searchAriaLabel}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="history-clear-search-btn"
                      onClick={() => setSearchQuery("")}
                      aria-label={copy.clearFilters}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="history-filters-bar">
                  <div className="severity-filter-chips" role="radiogroup" aria-label={copy.filterBySeverity}>
                    {[
                      { key: "all", label: copy.filterAll },
                      { key: "low", label: copy.low, dotClass: "low" },
                      { key: "moderate", label: copy.moderate, dotClass: "moderate" },
                      { key: "high", label: copy.high, dotClass: "high" },
                      { key: "emergency", label: copy.emergency, dotClass: "emergency" },
                    ].map((pill) => {
                      const isSelected = severityFilter === pill.key;
                      return (
                        <button
                          key={pill.key}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          className={`filter-chip ${isSelected ? "active" : ""}`}
                          onClick={() => setSeverityFilter(pill.key)}
                        >
                          {pill.dotClass && <span className={`severity-dot ${pill.dotClass}`} aria-hidden="true" />}
                          <span>{pill.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    className="history-sort-btn"
                    onClick={() => setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))}
                    aria-label={`${copy.sortBy}: ${sortOrder === "newest" ? copy.sortNewest : copy.sortOldest}`}
                    title={`${copy.sortBy}: ${sortOrder === "newest" ? copy.sortNewest : copy.sortOldest}`}
                  >
                    <ArrowUpDown size={13} aria-hidden="true" />
                    <span>{sortOrder === "newest" ? copy.sortNewest : copy.sortOldest}</span>
                  </button>
                </div>
              </div>
            )}

            {!pastSessions.length ? (
              <div className="empty-history-state">
                <div className="empty-icon-bubble" aria-hidden="true">
                  <ClipboardList size={34} />
                </div>
                <h3>{copy.noScreeningsTitle}</h3>
                <p>{copy.noScreeningsDesc}</p>
                <button
                  type="button"
                  className="secondary-button empty-cta"
                  onClick={handleInitiateScreening}
                >
                  <span>{copy.startScreeningCta}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : !processedSessions.length ? (
              <div className="empty-history-state search-empty">
                <div className="empty-icon-bubble" aria-hidden="true">
                  <Search size={30} />
                </div>
                <h3>{copy.noSearchResultsTitle}</h3>
                <p>{copy.noSearchResultsDesc}</p>
                <button
                  type="button"
                  className="secondary-button empty-cta"
                  onClick={() => {
                    setSearchQuery("");
                    setSeverityFilter("all");
                  }}
                >
                  <RotateCcw size={14} />
                  <span>{copy.clearFilters}</span>
                </button>
              </div>
            ) : (
              <div className="session-cards-list">
                {processedSessions.map((session) => {
                  const rawSymptoms = session.inspection?.answers?.symptoms;
                  const localizedSymptomStr = localizeSymptoms(rawSymptoms, language);
                  const symptomsList = localizedSymptomStr
                    ? localizedSymptomStr.split(/[,、/]+/).map((s) => s.trim()).filter(Boolean)
                    : [];
                  const rawCondition = session.result?.possibleConditions?.[0]?.name;
                  const primaryCondition =
                    localizeConditionName(rawCondition, language) || APP_CONFIG.app.name;
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
                            {symptomsList.slice(0, 3).map((sym, idx) => (
                              <span className="symptom-tag" key={`${sym}-${idx}`}>
                                {sym}
                              </span>
                            ))}
                            {symptomsList.length > 3 && (
                              <span
                                className="symptom-tag more"
                                title={symptomsList.slice(3).join(", ")}
                                aria-label={`${symptomsList.length - 3} more symptoms`}
                              >
                                +{symptomsList.length - 3}
                              </span>
                            )}
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
                            onClick={(e) => requestDeleteSession(e, session.sessionId)}
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

      {/* Confirmation Modal for Starting New Screening when Incomplete Exists */}
      {showStartNewModal && (
        <div className="modal-backdrop" onClick={() => setShowStartNewModal(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-new-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-header">
              <h3 id="start-new-title">{copy.startNewConfirmTitle}</h3>
              <button
                type="button"
                className="icon-button small"
                onClick={() => setShowStartNewModal(false)}
                aria-label={copy.cancel}
              >
                <X size={18} />
              </button>
            </header>
            <p className="modal-body">{copy.startNewConfirmDesc}</p>
            <footer className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowStartNewModal(false)}
              >
                {copy.cancel}
              </button>
              <button
                type="button"
                className="primary-button danger"
                onClick={confirmStartNew}
              >
                {copy.confirmStartNew}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Screenings */}
      {deleteModalTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteModalTarget(null)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-header">
              <h3 id="delete-dialog-title">
                {deleteModalTarget.type === "all" ? copy.clearAllModalTitle : copy.deleteModalTitle}
              </h3>
              <button
                type="button"
                className="icon-button small"
                onClick={() => setDeleteModalTarget(null)}
                aria-label={copy.cancel}
              >
                <X size={18} />
              </button>
            </header>
            <p className="modal-body">
              {deleteModalTarget.type === "all" ? copy.clearAllModalDesc : copy.deleteModalDesc}
            </p>
            <footer className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setDeleteModalTarget(null)}
              >
                {copy.cancel}
              </button>
              <button
                type="button"
                className="primary-button danger"
                onClick={confirmDelete}
              >
                {deleteModalTarget.type === "all" ? copy.confirmClearAllBtn : copy.confirmDelete}
              </button>
            </footer>
          </div>
        </div>
      )}
    </main>
  );
}
