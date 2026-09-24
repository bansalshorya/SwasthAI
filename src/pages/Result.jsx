import { AlertTriangle, Apple, ArrowLeft, CheckCircle2, Eye, HeartPulse, PhoneCall, Stethoscope } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_CONFIG } from "../config/appConfig";
import { localize } from "../config/localize";
import { ui } from "../config/uiCopy";
import { useApp } from "../context/AppContext";

function BulletList({ items = [] }) {
  return <ul>{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>;
}

export default function Result() {
  const navigate = useNavigate();
  const { language, activeSession, startInspection } = useApp();
  const copy = ui(language);
  const result = activeSession?.result;

  if (!result) return <main className="center-screen">{copy.resultUnavailable}</main>;

  function restart() {
    startInspection();
    navigate("/symptoms");
  }

  const riskLabel = copy[result.riskLevel] ?? result.riskLevel;

  return (
    <main className="app-screen result-screen">
      <header className="top-row result-header">
        <button className="icon-button" onClick={() => navigate("/home")} aria-label={copy.home}><ArrowLeft /></button>
        <strong>{localize(APP_CONFIG.results.title, language)}</strong>
        <span className="header-spacer" />
      </header>

      <section className={`result-hero ${result.riskLevel || "moderate"}`}>
        <div className="result-status-row">
          <span className="result-check"><HeartPulse size={24} /></span>
          {result.prototype && <span className="prototype-badge">{copy.demoHint}</span>}
        </div>
        <p className="eyebrow">{copy.possibleOnly}</p>
        <h1>{riskLabel} {copy.risk}</h1>
        <p>{result.summary}</p>
        <div className="result-meta">
          <span>{copy.risk}: {riskLabel}</span>
          <span>{copy.confidence}: {copy[result.confidence] ?? result.confidence}</span>
        </div>
      </section>

      {(result.riskLevel === "emergency" || result.riskLevel === "high") && <a className="emergency-call compact" href="tel:112"><PhoneCall size={19} />{copy.callNow}</a>}

      <section className="result-section">
        <div className="section-title"><Stethoscope size={20} /><h2>{localize(APP_CONFIG.results.possibleTitle, language)}</h2></div>
        <div className="condition-list">
          {result.possibleConditions?.map((condition, index) => <article className="condition-card" key={`${condition.name}-${index}`}>
            <div className="condition-rank">{index + 1}</div>
            <div>
              <div className="condition-heading"><h3>{condition.name}</h3><span>{copy[condition.confidence] ?? condition.confidence}</span></div>
              <p>{condition.reason}</p>
              <div className="symptom-tags">{condition.commonSymptoms?.map((symptom) => <span key={symptom}>{symptom}</span>)}</div>
            </div>
          </article>)}
        </div>
      </section>

      <section className="result-card">
        <div className="section-title"><CheckCircle2 size={20} /><h2>{localize(APP_CONFIG.results.reasonsTitle, language)}</h2></div>
        <BulletList items={result.evidence} />
        <div className="image-note"><Eye size={17} /><span><strong>{copy.imageUsed}:</strong> {result.imageAssessment}</span></div>
      </section>

      <section className="result-card care-card">
        <div className="section-title"><HeartPulse size={20} /><h2>{localize(APP_CONFIG.results.recommendationsTitle, language)}</h2></div>
        <BulletList items={result.homeCare} />
      </section>

      <section className="result-card diet-card">
        <div className="section-title"><Apple size={20} /><h2>{localize(APP_CONFIG.results.dietTitle, language)}</h2></div>
        <div className="diet-grid">
          <div><strong>{copy.eat}</strong><BulletList items={result.dietPlan?.eat} /></div>
          <div><strong>{copy.avoid}</strong><BulletList items={result.dietPlan?.avoid} /></div>
        </div>
      </section>

      <section className="result-card">
        <div className="section-title"><Eye size={20} /><h2>{localize(APP_CONFIG.results.monitorTitle, language)}</h2></div>
        <BulletList items={result.monitorSymptoms} />
      </section>

      <section className="result-card red-flag-card">
        <div className="section-title"><AlertTriangle size={20} /><h2>{localize(APP_CONFIG.results.redFlagsTitle, language)}</h2></div>
        <BulletList items={result.redFlags} />
      </section>

      <section className="doctor-card">
        <Stethoscope size={22} />
        <div><span>{localize(APP_CONFIG.results.doctorTitle, language)}</span><strong>{result.doctorRecommendation?.specialist}</strong><p>{result.doctorRecommendation?.timeframe}</p></div>
      </section>

      <p className="disclaimer">{result.disclaimer || localize(APP_CONFIG.results.disclaimer, language)}</p>
      <button className="primary-button" onClick={restart}>{copy.newInspection}</button>
    </main>
  );
}
