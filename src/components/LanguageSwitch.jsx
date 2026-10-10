import { APP_CONFIG } from "../config/appConfig";
import { useApp } from "../context/AppContext";

export default function LanguageSwitch({ className = "", disabledCodes = [], disabledTitle = "" }) {
  const { language, setLanguage } = useApp();

  return (
    <div className={`language-switch ${className}`.trim()} role="group" aria-label="Language selection">
      {APP_CONFIG.app.supportedLanguages.map((code) => {
        const isActive = language === code;
        return (
          <button
            key={code}
            type="button"
            className={isActive ? "active" : ""}
            onClick={() => setLanguage(code)}
            disabled={disabledCodes.includes(code)}
            title={disabledCodes.includes(code) ? disabledTitle : undefined}
            aria-pressed={isActive}
            aria-label={code === "hi" ? "हिंदी (Hindi)" : "English"}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
