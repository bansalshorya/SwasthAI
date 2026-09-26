import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { APP_CONFIG } from "../config/appConfig";
import { localize } from "../config/localize";
import { useApp } from "../context/AppContext";
import LanguageSwitch from "../components/LanguageSwitch";
import ThemeToggle from "../components/ThemeToggle";

export default function Welcome() {
  const navigate = useNavigate();
  const { language, speakText } = useApp();

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
        <div className="brand-mark">+</div>
        <p className="eyebrow">{APP_CONFIG.app.name}</p>
        <h1>{localize(APP_CONFIG.welcome.title, language)}</h1>
        <p>{localize(APP_CONFIG.welcome.subtitle, language)}</p>
      </section>
      <button className="primary-button" onClick={() => navigate("/onboarding")}>
        {localize(APP_CONFIG.welcome.startLabel, language)}
      </button>
    </main>
  );
}

