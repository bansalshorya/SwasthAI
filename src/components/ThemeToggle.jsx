import { Moon, Sun } from "lucide-react";
import { ui } from "../config/uiCopy";
import { useApp } from "../context/AppContext";

export default function ThemeToggle({ className = "" }) {
  const { resolvedTheme, toggleTheme, language } = useApp();
  const copy = ui(language);
  const isDark = resolvedTheme === "dark";
  const actionLabel = isDark ? copy.switchToLight : copy.switchToDark;

  return (
    <button
      type="button"
      className={`icon-button theme-toggle-btn ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={actionLabel}
      title={actionLabel}
    >
      {isDark ? (
        <Sun size={19} className="sun-icon" aria-hidden="true" />
      ) : (
        <Moon size={19} className="moon-icon" aria-hidden="true" />
      )}
    </button>
  );
}
