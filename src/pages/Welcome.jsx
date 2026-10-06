import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, HeartPulse, ListChecks, Mic, ShieldCheck } from "lucide-react";
import { APP_CONFIG } from "../config/appConfig";
import { localize } from "../config/localize";
import { ui } from "../config/uiCopy";
import { useApp } from "../context/AppContext";
import LanguageSwitch from "../components/LanguageSwitch";
import ThemeToggle from "../components/ThemeToggle";

export default function Welcome() {
  const navigate = useNavigate();
  const { language, speakText } = useApp();
  const copy = ui(language);

  useEffect(() => {
    speakText(localize(APP_CONFIG.welcome.voicePrompt, language));
  }, [language, speakText]);

  return (
    <main className="welcome-screen">
      <div className="welcome-top-controls">
        <LanguageSwitch />
        <ThemeToggle />
      </div>
      <section className="welcome-copy">
        <div className="brand-mark"><HeartPulse size={34} strokeWidth={1.8} aria-hidden="true" /></div>
        <p className="eyebrow">{APP_CONFIG.app.name}</p>
        <h1>{localize(APP_CONFIG.welcome.title, language)}</h1>
        <p>{localize(APP_CONFIG.welcome.subtitle, language)}</p>
      </section>
      <button className="primary-button welcome-start" onClick={() => navigate("/onboarding")}>
        {localize(APP_CONFIG.welcome.startLabel, language)} <ArrowRight size={18} aria-hidden="true" />
      </button>
      <section className="welcome-visual" aria-label={copy.aiHealthScreening}>
        <div className="welcome-visual-heading">
          <div className="welcome-visual-emblem"><HeartPulse size={30} aria-hidden="true" /></div>
          <div><span className="eyebrow">SwasthAI</span><h2>{copy.aiHealthScreening}</h2></div>
        </div>
        <div className="welcome-visual-steps">
          {[
            { Icon: Mic, title: copy.workflowStep1Title, description: copy.workflowStep1Desc },
            { Icon: ListChecks, title: copy.workflowStep2Title, description: copy.workflowStep2Desc },
            { Icon: ShieldCheck, title: copy.workflowStep3Title, description: copy.workflowStep3Desc },
          ].map(({ Icon, title, description }, index) => (
            <div className="welcome-visual-step" key={index}>
              <span className="welcome-step-icon"><Icon size={20} aria-hidden="true" /></span>
              <span><strong>{title}</strong><small>{description}</small></span>
              <span className="welcome-step-number">0{index + 1}</span>
            </div>
          ))}
        </div>
        <p className="welcome-visual-note"><ShieldCheck size={17} aria-hidden="true" />{copy.decisionSupportDisclaimer}</p>
      </section>
    </main>
  );
}

