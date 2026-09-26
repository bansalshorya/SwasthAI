import { AlertTriangle, ArrowLeft, PhoneCall } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ui } from "../config/uiCopy";
import { useApp } from "../context/AppContext";
import LanguageSwitch from "../components/LanguageSwitch";
import ThemeToggle from "../components/ThemeToggle";

export default function Emergency() {
  const navigate = useNavigate();
  const { language } = useApp();
  const copy = ui(language);

  return (
    <main className="emergency-screen">
      <header className="emergency-header">
        <button
          type="button"
          className="emergency-back"
          onClick={() => navigate("/symptoms")}
          aria-label={copy.back}
        >
          <ArrowLeft size={18} aria-hidden="true" />
          <span>{copy.back}</span>
        </button>
        <div className="header-actions">
          <LanguageSwitch />
          <ThemeToggle />
        </div>
      </header>

      <section className="emergency-content" role="alert">
        <div className="emergency-icon" aria-hidden="true">
          <AlertTriangle size={48} />
        </div>
        <p className="eyebrow">{copy.emergencyEyebrow}</p>
        <h1>{copy.emergencyTitle}</h1>
        <p>{copy.emergencyBody}</p>
        <a className="emergency-call" href="tel:112">
          <PhoneCall size={20} aria-hidden="true" />
          <span>{copy.callEmergency}</span>
        </a>
        <p className="emergency-note">{copy.emergencyNote}</p>
      </section>
    </main>
  );
}
