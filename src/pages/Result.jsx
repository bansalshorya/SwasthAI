import { useState } from "react";
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
  Pencil,
  PhoneCall,
  Printer,
  Share2,
  Stethoscope,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_CONFIG } from "../config/appConfig";
import { localize } from "../config/localize";
import { ui } from "../config/uiCopy";
import { useApp } from "../context/AppContext";
import { hydrateSession } from "../services/aiSkillEngine";
import LanguageSwitch from "../components/LanguageSwitch";
import ThemeToggle from "../components/ThemeToggle";

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
        <li key={`${item}-${index}`}>{item}</li>
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

export default function Result() {
  const navigate = useNavigate();
  const { language, activeSession, startInspection, showToast } = useApp();
  const copy = ui(language);
  const session = activeSession ? hydrateSession(activeSession, language) : null;
  const result = session?.result;

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
    window.print();
  }

  async function handleShareOrCopy() {
    const conditionLines = (result.possibleConditions || [])
      .slice(0, 3)
      .map((c) => `- ${c.name} (${copy[c.confidence] ?? c.confidence})`)
      .join("\n");

    const doctorLine = result.doctorRecommendation?.specialist
      ? `${result.doctorRecommendation.specialist} (${result.doctorRecommendation.timeframe || ""})`
      : "";

    const summaryText = [
      "SwasthAI - Health Screening Report Summary",
      `Screened on: ${formatReportDate(session?.createdAt, language)}`,
      `Risk Level: ${riskLabel}`,
      reportedSymptoms ? `Reported Symptoms: ${reportedSymptoms}` : "",
      conditionLines ? `\nPossible Conditions:\n${conditionLines}` : "",
      doctorLine ? `\nRecommendation:\n${doctorLine}` : "",
      `\nNotice: ${copy.printDisclaimer}`,
    ].filter(Boolean).join("\n");

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "SwasthAI Health Screening Report",
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

  const contextItems = (APP_CONFIG.questions || []).map((q) => {
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
          <LanguageSwitch />
          <ThemeToggle />
        </div>
      </header>

      {/* Export / Share Toolbar */}
      <div className="report-action-bar no-print">
        <button
          type="button"
          className="report-action-btn"
          onClick={handlePrint}
          aria-label={copy.printReport}
          title={copy.printReport}
        >
          <Printer size={15} aria-hidden="true" />
          <span>{copy.printReport}</span>
        </button>
        <button
          type="button"
          className="report-action-btn"
          onClick={handleShareOrCopy}
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
        <p>{result.summary}</p>
        <div className="result-meta">
          <span>
            {copy.risk}: {riskLabel}
          </span>
          <span>
            {copy.confidence}: {copy[result.confidence] ?? result.confidence}
          </span>
        </div>
      </section>

      {reportedSymptoms && (
        <div className="result-symptoms-bar">
          <div className="result-symptoms-text">
            <strong>{copy.symptomsLabel}:</strong> {reportedSymptoms}
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

      {/* Emergency Call Action: Prominent and immediately accessible */}
      {isHighRisk && (
        <a className="emergency-call compact" href="tel:112">
          <PhoneCall size={19} aria-hidden="true" />
          <span>{copy.callNow}</span>
        </a>
      )}

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
                <p>{condition.reason}</p>
                <div className="symptom-tags">
                  {condition.commonSymptoms?.map((symptom) => (
                    <span key={symptom}>{symptom}</span>
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
        {result.imageAssessment && (
          <div className="image-note">
            <Eye size={17} aria-hidden="true" />
            <span>
              <strong>{copy.imageUsed}:</strong> {result.imageAssessment}
            </span>
          </div>
        )}
      </CollapsibleCard>

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

      {/* Red Flags / Emergency Warnings: Non-collapsible and high-visibility */}
      <section className="result-card red-flag-card" role="region" aria-label={localize(APP_CONFIG.results.redFlagsTitle, language)}>
        <div className="section-title">
          <AlertTriangle size={20} aria-hidden="true" />
          <h2>{localize(APP_CONFIG.results.redFlagsTitle, language)}</h2>
        </div>
        <BulletList items={result.redFlags} />
      </section>

      {/* Doctor Consultation Recommendation: Non-collapsible */}
      <section className="doctor-card">
        <Stethoscope size={22} aria-hidden="true" />
        <div>
          <span>{localize(APP_CONFIG.results.doctorTitle, language)}</span>
          <strong>{result.doctorRecommendation?.specialist}</strong>
          <p>{result.doctorRecommendation?.timeframe}</p>
        </div>
      </section>

      <p className="disclaimer no-print">
        {result.disclaimer || localize(APP_CONFIG.results.disclaimer, language)}
      </p>

      {/* Print-only Disclaimer */}
      <div className="print-only-disclaimer" aria-hidden="true">
        <p>{copy.printDisclaimer}</p>
      </div>

      <button type="button" className="primary-button no-print" onClick={restart}>
        {copy.newInspection}
      </button>
    </main>
  );
}
