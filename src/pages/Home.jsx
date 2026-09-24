import { ArrowRight, ChevronRight, LockKeyhole, Mic, ShieldCheck, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_CONFIG } from "../config/appConfig";
import { ui } from "../config/uiCopy";
import { useApp } from "../context/AppContext";

export default function Home() {
  const navigate = useNavigate();
  const { language, startInspection, pastSessions } = useApp();
  const copy = ui(language);

  function start() {
    startInspection();
    navigate("/symptoms");
  }

  return (
    <main className="app-screen home-screen">
      <header className="brand-row home-brand">
        <div className="brand-mark small">+</div>
        <div><strong>{APP_CONFIG.app.name}</strong><small>{copy.notDiagnosis}</small></div>
      </header>
      <section className="hero-card">
        <div className="hero-orb"><Sparkles size={28} /></div>
        <p className="eyebrow">AI HEALTH SCREENING</p>
        <h1>{language === "hi" ? "आज आप कैसा महसूस कर रहे हैं?" : "How are you feeling today?"}</h1>
        <p>{language === "hi" ? "अपने लक्षण बोलें या लिखें। हम सुरक्षित अगला कदम समझने में मदद करेंगे।" : "Speak or type your symptoms. We’ll help you understand a safe next step."}</p>
        <button className="accent-button" onClick={start}>{copy.startInspection}<ArrowRight size={18} /></button>
      </section>
      <div className="trust-row">
        <span><Mic size={15} />{copy.voiceEnabled}</span>
        <span><LockKeyhole size={15} />{copy.privateAndSecure}</span>
        <span><ShieldCheck size={15} />{copy.photoOptional}</span>
      </div>
      <section>
        <h2>{copy.previousInspections}</h2>
        {!pastSessions.length ? <p className="muted">{copy.noInspections}</p> : pastSessions.slice(0, 5).map((session) => (
          <article className="session-row" key={session.sessionId}>
            <div><strong>{session.result?.possibleConditions?.[0]?.name || APP_CONFIG.app.name}</strong><small>{new Date(session.createdAt).toLocaleString(language)}</small></div>
            <div><span className={`risk-pill ${session.result?.riskLevel || "moderate"}`}>{copy[session.result?.riskLevel] || session.result?.riskLevel || "—"}</span><ChevronRight size={18} /></div>
          </article>
        ))}
      </section>
    </main>
  );
}

