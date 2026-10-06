import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Apple,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  FileText,
  HeartPulse,
  HelpCircle,
  Home,
  Loader2,
  Pencil,
  PhoneCall,
  Printer,
  RotateCcw,
  Share2,
  ShieldCheck,
  Volume2,
  VolumeX,
  Stethoscope,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_CONFIG } from "../config/appConfig";
import { FOLLOW_UP_BY_KEY } from "../config/followUpQuestions";
import { localize } from "../config/localize";
import { ui } from "../config/uiCopy";
import { useApp } from "../context/AppContext";
import { hydrateSession, sanitizeDegreeSymbols } from "../services/aiSkillEngine";
import { compareScreenings } from "../services/progress";
import { applyReportTranslations, reportTextEntries, requestReportTranslation, validateReportTranslations } from "../services/resultTranslation";
import { stopSpeaking } from "../services/speech";
import DoctorReport from "../components/DoctorReport";
import LanguageSwitch from "../components/LanguageSwitch";
import ThemeToggle from "../components/ThemeToggle";

const TRANSLATION_RETRY_KEY = "swasthai_translation_retry_after";

function formatReportDate(dateString, lang) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString(lang, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

function BulletList({ items = [] }) {
  if (!items.length) return null;
  return (
    <ul className="bullet-list">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{sanitizeDegreeSymbols(item)}</li>
      ))}
    </ul>
  );
}

function CollapsibleCard({
  id,
  title,
  icon: Icon,
  className = "",
  children,
  defaultOpen = true,
  collapseLabel,
  expandLabel,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`result-card collapsible-card ${className}`} id={id}>
      <button
        type="button"
        className="section-title-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={`${id}-content`}
      >
        <div className="section-title">
          <Icon size={20} aria-hidden="true" />
          <h2>{title}</h2>
        </div>
        <span className="toggle-affordance">
          <span className="toggle-text">{open ? collapseLabel : expandLabel}</span>
          {open ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
        </span>
      </button>

      {open && (
        <div id={`${id}-content`} className="section-collapsible-content">
          {children}
        </div>
      )}
    </section>
  );
}

function WhyThisResultCard({ session, result, copy, language }) {
  const [open, setOpen] = useState(true);
  const symptoms = session?.inspection?.answers?.symptoms;
  const topCondition = result?.possibleConditions?.[0];
  const doctor = result?.doctorRecommendation;
  const imageConsistency = result?.imageConsistency;
  const durationAnswer = session?.inspection?.answers?.duration;
  const severityAnswer = session?.inspection?.answers?.severity;
  const progressionAnswer = session?.inspection?.answers?.progression;

  const durationQuestion = APP_CONFIG.questions.find((q) => q.key === "duration");
  const durationOption = durationQuestion?.options?.find((o) => o.value === durationAnswer);
  const durationLabel = durationOption ? localize(durationOption.label, language) : durationAnswer;

  const severityQuestion = APP_CONFIG.questions.find((q) => q.key === "severity");
  const severityOption = severityQuestion?.options?.find((o) => o.value === severityAnswer);
  const severityLabel = severityOption ? localize(severityOption.label, language) : severityAnswer;

  const progressionQuestion = APP_CONFIG.questions.find((q) => q.key === "progression");
  const progressionOption = progressionQuestion?.options?.find((o) => o.value === progressionAnswer);
  const progressionLabel = progressionOption ? localize(progressionOption.label, language) : progressionAnswer;

  return (
    <section className="result-card why-result-card" id="section-why-result">
      <button
        type="button"
        className="section-title-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls="why-result-content"
      >
        <div className="section-title">
          <HelpCircle size={20} className="why-result-icon" aria-hidden="true" />
          <h2>{copy.whyThisResultTitle}</h2>
        </div>
        <span className="toggle-affordance">
          <span className="toggle-text">{open ? copy.collapseSection : copy.expandSection}</span>
          {open ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
        </span>
      </button>

      {open && (
        <div id="why-result-content" className="section-collapsible-content why-result-content">
          <p className="why-result-lead">{copy.whyThisResultSubtitle}</p>

          <div className="why-result-grid">
            {symptoms && (
              <div className="why-result-box">
                <div className="why-factor-header">
                  <HeartPulse size={15} aria-hidden="true" />
                  <strong>{copy.reportedSymptomsFactor}</strong>
                </div>
                <p>{sanitizeDegreeSymbols(symptoms)}</p>
              </div>
            )}

            {(durationLabel || severityLabel || progressionLabel) && (
              <div className="why-result-box">
                <div className="why-factor-header">
                  <FileText size={15} aria-hidden="true" />
                  <strong>{copy.clinicalTimelineFactor}</strong>
                </div>
                <p>
                  {[
                    durationLabel ? `${localize({ hi: "अवधि", en: "Timeline" }, language)}: ${durationLabel}` : "",
                    severityLabel ? `${localize({ hi: "प्रभाव", en: "Impact" }, language)}: ${severityLabel}` : "",
                    progressionLabel ? `${localize({ hi: "प्रवृत्ति", en: "Trend" }, language)}: ${progressionLabel}` : "",
                  ].filter(Boolean).join(" · ")}
                </p>
              </div>
            )}

            {imageConsistency && (
              <div className="why-result-box">
                <div className="why-factor-header">
                  <Eye size={15} aria-hidden="true" />
                  <strong>{copy.visualContextFactor}</strong>
                </div>
                <p>{sanitizeDegreeSymbols(imageConsistency.explanation)}</p>
              </div>
            )}
          </div>

          {topCondition?.reason && (
            <div className="why-rationale-block">
              <strong>{copy.patternRationaleTitle}:</strong>
              <p>{sanitizeDegreeSymbols(topCondition.reason)}</p>
            </div>
          )}

          {doctor?.timeframe && (
            <div className="why-rationale-block next-step">
              <strong>{copy.whyNextStepTitle}:</strong>
              <p>
                {sanitizeDegreeSymbols(
                  language === "hi"
                    ? `लक्षणों की गंभीरता और स्थिति को देखते हुए ${doctor.specialist || "चिकित्सक"} से ${doctor.timeframe} संपर्क करने का सुझाव दिया गया है।`
                    : `Given your symptom severity and timeline, consultation with ${doctor.specialist ? "a " + doctor.specialist : "a clinician"} is advised (${doctor.timeframe}).`
                )}
              </p>
            </div>
          )}

          <div className="why-result-footnote" role="note">
            <ShieldCheck size={14} aria-hidden="true" />
            <span>{copy.whyResultNotice}</span>
          </div>
        </div>
      )}
    </section>
  );
}

export default function Result() {
  const navigate = useNavigate();
  const { language: selectedLanguage, setLanguage, activeSession, pastSessions, startInspection, startFollowUp, speakText, muted, showToast, storeResultTranslation } = useApp();
  const [isReading, setIsReading] = useState(false);
  const translationRequests = useRef(new Map());
  const [translationCooldownUntil, setTranslationCooldownUntil] = useState(() => {
    try {
      const saved = Number(sessionStorage.getItem(TRANSLATION_RETRY_KEY));
      return Number.isFinite(saved) && saved > Date.now() ? saved : 0;
    } catch { return 0; }
  });
  const sourceLanguage = activeSession?.language === "hi" ? "hi" : "en";
  const sourceSession = useMemo(
    () => activeSession ? hydrateSession(activeSession, sourceLanguage) : null,
    [activeSession, sourceLanguage],
  );
  const entries = useMemo(() => reportTextEntries(sourceSession), [sourceSession]);
  const cachedItems = activeSession?.resultTranslations?.[selectedLanguage];
  const cachedTranslations = useMemo(() => cachedItems
    ? validateReportTranslations(entries, entries.map(({ id }) => ({ id, text: cachedItems[id] })))
    : null, [cachedItems, entries]);
  const isDemo = Boolean(sourceSession?.result?.prototype);
  const needsTranslation = Boolean(sourceSession?.result && !isDemo
    && selectedLanguage !== sourceLanguage && entries.length && !cachedTranslations);
  const blockedLanguages = !isDemo && translationCooldownUntil > Date.now()
    ? [sourceLanguage === "hi" ? "en" : "hi"].filter((code) => !activeSession?.resultTranslations?.[code])
    : [];
  const language = needsTranslation ? sourceLanguage : selectedLanguage;
  const copy = ui(language);
  const session = isDemo && selectedLanguage !== sourceLanguage
    ? hydrateSession(activeSession, selectedLanguage)
    : selectedLanguage !== sourceLanguage && cachedTranslations
      ? applyReportTranslations(sourceSession, cachedTranslations, selectedLanguage)
      : sourceSession;
  const result = session?.result;
  const parent = session?.parentSessionId ? pastSessions.find((item) => item.sessionId === session.parentSessionId) : null;
  const comparison = compareScreenings(parent, session);

  useEffect(() => () => stopSpeaking(), []);

  useEffect(() => {
    stopSpeaking();
    setIsReading(false);
  }, [selectedLanguage]);

  useEffect(() => {
    if (!translationCooldownUntil) return undefined;
    const remaining = translationCooldownUntil - Date.now();
    if (remaining <= 0) {
      setTranslationCooldownUntil(0);
      return undefined;
    }
    const timer = setTimeout(() => {
      setTranslationCooldownUntil(0);
      try { sessionStorage.removeItem(TRANSLATION_RETRY_KEY); } catch { /* storage unavailable */ }
    }, remaining);
    return () => clearTimeout(timer);
  }, [translationCooldownUntil]);

  useEffect(() => {
    if (!needsTranslation) return undefined;
    // Reuse the in-flight request across React StrictMode's effect replay and
    // quick language toggles, avoiding extra provider calls on a free-tier key.
    const requestKey = JSON.stringify([sourceSession.sessionId, selectedLanguage, entries]);
    let request = translationRequests.current.get(requestKey);
    if (!request) {
      request = requestReportTranslation(entries, sourceLanguage, selectedLanguage);
      translationRequests.current.set(requestKey, request);
      request.then(() => translationRequests.current.delete(requestKey),
        () => translationRequests.current.delete(requestKey));
    }
    let active = true;
    request.then((translations) => {
      if (active) storeResultTranslation(sourceSession.sessionId, selectedLanguage, translations);
    }, (error) => {
      if (active) {
        console.warn("Report translation unavailable:", error);
        const errorCopy = ui(sourceLanguage);
        if (error.code === "AI_RATE_LIMITED") {
          const seconds = Math.min(3600, Math.max(5, Number(error.retryAfterSeconds) || 60));
          const retryAt = Date.now() + seconds * 1000;
          setTranslationCooldownUntil(retryAt);
          try { sessionStorage.setItem(TRANSLATION_RETRY_KEY, String(retryAt)); } catch { /* storage unavailable */ }
          showToast(errorCopy.translationRateLimited, "error", 7000);
        } else if (error.code === "AI_PROVIDER_REJECTED" || error.code === "AI_INVALID_KEY") {
          showToast(errorCopy.translationProviderRejected, "error", 7000);
        } else {
          showToast(errorCopy.translationUnavailable, "error", 6000);
        }
        setLanguage(sourceLanguage);
      }
    });
    return () => { active = false; };
  }, [needsTranslation, sourceLanguage, selectedLanguage, entries, sourceSession?.sessionId, storeResultTranslation, setLanguage, showToast]);

  if (!result) {
    return (
      <main className="center-screen">
        <p>{copy.resultUnavailable}</p>
        <button
          type="button"
          className="primary-button"
          onClick={() => navigate("/home")}
        >
          {copy.home}
        </button>
      </main>
    );
  }

  function restart() {
    startInspection();
    navigate("/symptoms");
  }

  function handlePrint() {
    if (needsTranslation) return;
    window.print();
  }

  function toggleReading() {
    if (needsTranslation) return;
    if (isReading) { stopSpeaking(); setIsReading(false); return; }
    if (muted) { showToast(copy.unmuteToRead, "info"); return; }
    const speech = [result.summary, ...(result.redFlags || []), result.doctorRecommendation?.specialist, result.doctorRecommendation?.timeframe]
      .filter(Boolean).join(". ");
    setIsReading(true);
    speakText(speech, { onEnd: () => setIsReading(false) });
  }

  function beginFollowUp() {
    stopSpeaking();
    startFollowUp(session);
    navigate("/symptoms");
  }

  async function handleShareOrCopy() {
    if (needsTranslation) return;
    const conditionLines = (result.possibleConditions || [])
      .slice(0, 3)
      .map((c) => `- ${c.name} (${copy[c.confidence] ?? c.confidence})`)
      .join("\n");

    const doctorLine = result.doctorRecommendation?.specialist
      ? `${result.doctorRecommendation.specialist} (${result.doctorRecommendation.timeframe || ""})`
      : "";
    const imageMatchLine = result.imageConsistency?.status
      ? `${imageConsistencyLabel}: ${result.imageConsistency.explanation}`
      : "";

    const summaryText = [
      `SwasthAI - ${copy.doctorReportTitle}`,
      `${copy.screenedOn}: ${formatReportDate(session?.createdAt, language)}`,
      `${copy.risk}: ${riskLabel}`,
      reportedSymptoms ? `${copy.symptomsLabel}: ${reportedSymptoms}` : "",
      imageMatchLine ? `${copy.imageConsistencyTitle}: ${imageMatchLine}` : "",
      conditionLines ? `\n${copy.possibleOnly}:\n${conditionLines}` : "",
      doctorLine ? `\n${copy.reportNextSteps}:\n${doctorLine}` : "",
      `\n${copy.notDiagnosis}: ${copy.printDisclaimer}`,
    ].filter(Boolean).join("\n");

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `SwasthAI - ${copy.doctorReportTitle}`,
          text: summaryText,
        });
        showToast(copy.reportShared, "success");
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(summaryText);
        showToast(copy.reportCopied, "success");
      } catch {
        showToast(copy.shareNotSupported, "info");
      }
    } else {
      showToast(copy.shareNotSupported, "info");
    }
  }

  const riskLabel = copy[result.riskLevel] ?? result.riskLevel;
  const reportedSymptoms = session?.inspection?.answers?.symptoms;
  const isHighRisk = result.riskLevel === "emergency" || result.riskLevel === "high";
  const imageConsistencyStatus = result.imageConsistency?.status || "not_provided";
  const imageConsistencyLabel = copy[`imageStatus_${imageConsistencyStatus}`] ?? imageConsistencyStatus;

  const allQuestions = [...APP_CONFIG.questions, ...(session.inspection?.followUpIds || [])
    .map((id) => FOLLOW_UP_BY_KEY.get(id)).filter(Boolean)
    .map((item) => ({ ...item, key: `followUp_${item.key}` }))];
  const contextItems = allQuestions.map((q) => {
    const rawVal = session?.inspection?.answers?.[q.key];
    if (!rawVal) return null;
    const option = q.options?.find((opt) => opt.value === rawVal);
    return {
      key: q.key,
      label: localize(q.title, language),
      value: option ? localize(option.label, language) : rawVal,
    };
  }).filter(Boolean);

  return (
    <main className="app-screen result-screen">
      {/* Print-only Header */}
      <div className="print-only-header" aria-hidden="true">
        <div className="print-brand-row">
          <h1>SwasthAI</h1>
          <span>{copy.notDiagnosis}</span>
        </div>
        <div className="print-meta-row">
          <span>{copy.screenedOn}: {formatReportDate(session?.createdAt, language)}</span>
        </div>
      </div>

      <header className="top-row result-header no-print">
        <button
          type="button"
          className="icon-button"
          onClick={() => navigate("/home")}
          aria-label={copy.home}
        >
          <ArrowLeft />
        </button>
        <div className="header-actions">
          <div className="step-label" aria-label={copy.stepFourOfFour}>
            {copy.stepFourOfFour}
          </div>
          <LanguageSwitch disabledCodes={blockedLanguages} disabledTitle={ui(sourceLanguage).translationRateLimited} />
          <ThemeToggle />
        </div>
      </header>

      {needsTranslation && (
        <div className="result-translation-status no-print" role="status" aria-live="polite">
          <Loader2 size={17} className="spin" aria-hidden="true" />
          <span>{copy.translatingReport}</span>
        </div>
      )}

      {/* Export / Share Toolbar */}
      <div className="report-action-bar no-print">
        <button
          type="button"
          className="report-action-btn"
          onClick={handlePrint}
          disabled={needsTranslation}
          aria-label={copy.savePdf}
          title={copy.savePdf}
        >
          <Printer size={15} aria-hidden="true" />
          <span>{copy.savePdf}</span>
        </button>
        <button type="button" className="report-action-btn" onClick={toggleReading}
          disabled={needsTranslation}
          aria-label={isReading ? copy.stopReading : copy.readResults}>
          {isReading ? <VolumeX size={15} aria-hidden="true" /> : <Volume2 size={15} aria-hidden="true" />}
          <span>{isReading ? copy.stopReading : copy.readResults}</span>
        </button>
        <button
          type="button"
          className="report-action-btn"
          onClick={handleShareOrCopy}
          disabled={needsTranslation}
          aria-label={copy.shareReport}
          title={copy.shareReport}
        >
          <Share2 size={15} aria-hidden="true" />
          <span>{copy.shareReport}</span>
        </button>
      </div>

      <div className="progress-track no-print" aria-hidden="true">
        <span style={{ width: "100%" }} />
      </div>

      <div className="result-dashboard-grid">
        <div className="result-col-primary">
          <section className={`result-hero ${result.riskLevel || "moderate"}`}>
            <div className="result-status-row">
              <span className="result-check">
                <HeartPulse size={24} aria-hidden="true" />
              </span>
              <div className="result-status-tags">
                {session?.createdAt && (
                  <span className="historical-screening-badge">
                    <Calendar size={12} aria-hidden="true" />
                    <span>{formatReportDate(session.createdAt, language)}</span>
                  </span>
                )}
                {result.prototype && (
                  <span className="prototype-badge">{copy.demoHint}</span>
                )}
              </div>
            </div>
            <p className="eyebrow">{copy.possibleOnly}</p>
            <h1>
              {riskLabel} {copy.risk}
            </h1>
            <p>{sanitizeDegreeSymbols(result.summary)}</p>
            <div className="result-meta">
              <span>
                {copy.risk}: {riskLabel}
              </span>
              <span>
                {copy.confidence}: {copy[result.confidence] ?? result.confidence}
              </span>
            </div>
          </section>

          {comparison && (
            <section className="result-card progress-comparison-card" aria-label={copy.progressTrackerTitle}>
              <div className="section-title"><HeartPulse size={19} aria-hidden="true" /><h2>{copy.progressTrackerTitle}</h2></div>
              <p><strong>{copy.reportedChange}: {copy[`trend_${comparison.change}`]}</strong></p>
              <p>{copy.progressComparisonHint}</p>
              <div className="progress-comparison-grid">
                {[parent, session].map((item, index) => <div key={item.sessionId}>
                  <strong>{index === 0 ? copy.previousCheck : copy.currentCheck}</strong>
                  <p>{formatReportDate(item.createdAt, language)}</p>
                  <p>{copy.symptomsLabel}: {item.inspection?.answers?.symptoms}</p>
                  <p>{copy.risk}: {copy[item.result?.riskLevel] || item.result?.riskLevel || copy.notProvided}</p>
                  {(item.inspection?.images || []).map((photo, photoIndex) => (photo.dataUrl || photo.thumbnailDataUrl)
                    ? <img key={photo.id || photoIndex} src={photo.dataUrl || photo.thumbnailDataUrl} alt={`${index === 0 ? copy.previousCheck : copy.currentCheck} ${photoIndex + 1}`} />
                    : <p key={photo.id || photoIndex}>{copy.photoNotSaved}</p>)}
                </div>)}
              </div>
            </section>
          )}

          {reportedSymptoms && (
            <div className="result-symptoms-bar">
              <div className="result-symptoms-text">
                <strong>{copy.symptomsLabel}:</strong> {sanitizeDegreeSymbols(reportedSymptoms)}
              </div>
              <button
                type="button"
                className="inline-edit-btn no-print"
                onClick={() => navigate("/symptoms")}
                aria-label={copy.editSymptoms}
                title={copy.editSymptoms}
              >
                <Pencil size={14} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Why This Result: Clinical Reasoning Synthesis */}
          <WhyThisResultCard session={session} result={result} copy={copy} language={language} />

          {/* Possible Conditions: Core finding */}
          <section className="result-section">
            <div className="section-title">
              <Stethoscope size={20} aria-hidden="true" />
              <h2>{localize(APP_CONFIG.results.possibleTitle, language)}</h2>
            </div>
            <div className="condition-list">
              {result.possibleConditions?.map((condition, index) => (
                <article className="condition-card" key={`${condition.name}-${index}`}>
                  <div className="condition-rank">{index + 1}</div>
                  <div>
                    <div className="condition-heading">
                      <h3>{condition.name}</h3>
                      <span>{copy[condition.confidence] ?? condition.confidence}</span>
                    </div>
                    <p>{sanitizeDegreeSymbols(condition.reason)}</p>
                    <div className="symptom-tags">
                      {condition.commonSymptoms?.map((symptom) => (
                        <span key={symptom}>{sanitizeDegreeSymbols(symptom)}</span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Reasons & Evidence (Collapsible) */}
          <CollapsibleCard
            id="section-evidence"
            title={localize(APP_CONFIG.results.reasonsTitle, language)}
            icon={CheckCircle2}
            defaultOpen={true}
            collapseLabel={copy.collapseSection}
            expandLabel={copy.expandSection}
          >
            <BulletList items={result.evidence} />
            {(result.imageConsistency || result.imageAssessment) && (
              <div className={`image-consistency-card image-status-${imageConsistencyStatus}`}>
                <div className="image-consistency-heading">
                  <span className="image-consistency-title">
                    <Eye size={17} aria-hidden="true" />
                    <strong>{copy.imageConsistencyTitle}</strong>
                  </span>
                  <span className="image-consistency-badge">{imageConsistencyLabel}</span>
                </div>
                {result.imageConsistency?.explanation && (
                  <p>{sanitizeDegreeSymbols(result.imageConsistency.explanation)}</p>
                )}
                {result.imageAssessment && (
                  <div className="image-consistency-detail">
                    <strong>{copy.imageObserved}:</strong> {sanitizeDegreeSymbols(result.imageAssessment)}
                  </div>
                )}
                {result.imageConsistency?.recommendedAction && (
                  <div className="image-consistency-action">
                    <strong>{copy.imageNextStep}:</strong> {sanitizeDegreeSymbols(result.imageConsistency.recommendedAction)}
                  </div>
                )}
              </div>
            )}
          </CollapsibleCard>

          {/* Clinical Context Review (Answers to Questions) */}
          {contextItems.length > 0 && (
            <CollapsibleCard
              id="section-context"
              title={copy.clinicalContextTitle}
              icon={FileText}
              defaultOpen={false}
              collapseLabel={copy.collapseSection}
              expandLabel={copy.expandSection}
            >
              <div className="clinical-answers-grid">
                {contextItems.map((item) => (
                  <div key={item.key} className="clinical-answer-box">
                    <span className="clinical-answer-label">{item.label}</span>
                    <strong className="clinical-answer-value">{item.value}</strong>
                  </div>
                ))}
              </div>
            </CollapsibleCard>
          )}
          {(session.inspection?.answers?.medications || session.inspection?.answers?.allergies || (session.inspection?.answers?.subjectRelation && session.inspection?.answers?.subjectRelation !== "self")) && (
            <section className="result-card safety-context-result">
              <div className="section-title"><FileText size={19} aria-hidden="true" /><h2>{copy.safetyContextTitle}</h2></div>
              <p>{copy.caregiverTitle}: {copy[`relation_${session.inspection?.answers?.subjectRelation || "self"}`]}</p>
              <p>{copy.currentMedicines}: {session.inspection?.answers?.medications || copy.notProvided}</p>
              <p>{copy.knownAllergies}: {session.inspection?.answers?.allergies || copy.notProvided}</p>
            </section>
          )}
        </div>

        <div className="result-col-secondary">
          {/* Red Flags / Emergency Warnings: Non-collapsible and high-visibility */}
          <section className="result-card red-flag-card" role="region" aria-label={localize(APP_CONFIG.results.redFlagsTitle, language)}>
            <div className="section-title">
              <AlertTriangle size={20} aria-hidden="true" />
              <h2>{localize(APP_CONFIG.results.redFlagsTitle, language)}</h2>
            </div>
            <BulletList items={result.redFlags} />
          </section>

          {/* Emergency Call Action: Prominent and immediately accessible */}
          {isHighRisk && (
            <a className="emergency-call compact" href="tel:112">
              <PhoneCall size={19} aria-hidden="true" />
              <span>{copy.callNow}</span>
            </a>
          )}

          {/* Doctor Consultation Recommendation: Non-collapsible */}
          <section className="doctor-card">
            <Stethoscope size={22} aria-hidden="true" />
            <div>
              <span>{copy.doctorConsultRecommendation || localize(APP_CONFIG.results.doctorTitle, language)}</span>
              <strong>{result.doctorRecommendation?.specialist}</strong>
              <p>{result.doctorRecommendation?.timeframe}</p>
            </div>
          </section>

          {/* Recommendations & Self-Care (Collapsible) */}
          <CollapsibleCard
            id="section-care"
            title={localize(APP_CONFIG.results.recommendationsTitle, language)}
            icon={HeartPulse}
            className="care-card"
            defaultOpen={true}
            collapseLabel={copy.collapseSection}
            expandLabel={copy.expandSection}
          >
            <BulletList items={result.homeCare} />
          </CollapsibleCard>

          {/* Diet & Hydration (Collapsible) */}
          <CollapsibleCard
            id="section-diet"
            title={localize(APP_CONFIG.results.dietTitle, language)}
            icon={Apple}
            className="diet-card"
            defaultOpen={true}
            collapseLabel={copy.collapseSection}
            expandLabel={copy.expandSection}
          >
            <div className="diet-grid">
              <div>
                <strong>{copy.eat}</strong>
                <BulletList items={result.dietPlan?.eat} />
              </div>
              <div>
                <strong>{copy.avoid}</strong>
                <BulletList items={result.dietPlan?.avoid} />
              </div>
            </div>
          </CollapsibleCard>

          {/* Symptoms to Monitor (Collapsible) */}
          <CollapsibleCard
            id="section-monitor"
            title={localize(APP_CONFIG.results.monitorTitle, language)}
            icon={Eye}
            defaultOpen={true}
            collapseLabel={copy.collapseSection}
            expandLabel={copy.expandSection}
          >
            <BulletList items={result.monitorSymptoms} />
          </CollapsibleCard>
        </div>
      </div>

      <DoctorReport session={session} result={result} language={language} copy={copy} parent={parent} />

      <p className="disclaimer no-print">
        {result.disclaimer || localize(APP_CONFIG.results.disclaimer, language)}
      </p>

      {/* Print-only Disclaimer */}
      <div className="print-only-disclaimer" aria-hidden="true">
        <p>{copy.printDisclaimer}</p>
      </div>

      <div className="result-actions-row no-print">
        {result.riskLevel !== "emergency" && result.riskLevel !== "high" && (
          <button type="button" className="secondary-button" onClick={beginFollowUp}>
            <HeartPulse size={16} aria-hidden="true" /><span>{result.riskLevel === "low" ? copy.repeatScreening : copy.repeatScreeningSoon}</span>
          </button>
        )}
        <button type="button" className="primary-button" onClick={restart}>
          <RotateCcw size={16} aria-hidden="true" />
          <span>{copy.newScreeningBtn || copy.newInspection}</span>
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate("/home")}
        >
          <Home size={16} aria-hidden="true" />
          <span>{copy.returnHomeBtn || copy.home}</span>
        </button>
      </div>
    </main>
  );
}
