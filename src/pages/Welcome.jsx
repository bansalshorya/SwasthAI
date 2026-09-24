import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { APP_CONFIG } from "../config/appConfig";
import { localize } from "../config/localize";
import { useApp } from "../context/AppContext";

export default function Welcome() {
  const navigate = useNavigate();
  const { language, setLanguage, speakText } = useApp();

  useEffect(() => {
    speakText(localize(APP_CONFIG.welcome.voicePrompt, language));
  }, [language, speakText]);

  return (
    <main className="welcome-screen">
      <div className="language-switch" aria-label="Language">
        {APP_CONFIG.app.supportedLanguages.map((code) => (
          <button className={language === code ? "active" : ""} key={code} onClick={() => setLanguage(code)}>
            {code.toUpperCase()}
          </button>
        ))}
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

