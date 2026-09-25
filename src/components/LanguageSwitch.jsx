import { APP_CONFIG } from "../config/appConfig";
import { useApp } from "../context/AppContext";

export default function LanguageSwitch({ className = "" }) {
  const { language, setLanguage } = useApp();

  return (
    <div className={`language-switch ${className}`.trim()} aria-label="Language selection">
      {APP_CONFIG.app.supportedLanguages.map((code) => (
        <button
          key={code}
          type="button"
          className={language === code ? "active" : ""}
          onClick={() => setLanguage(code)}
          aria-label={code === "hi" ? "हिंदी" : "English"}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
