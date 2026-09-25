import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { APP_CONFIG } from "../config/appConfig";
import { speak, stopSpeaking } from "../services/speech";
import { hydrateSession } from "../services/aiSkillEngine";

const AppContext = createContext(null);
const STORAGE_KEY = "inspection_app_sessions_v1";
const ACTIVE_SESSION_KEY = "swasthai_active_session_v1";
const THEME_STORAGE_KEY = "swasthai_theme";

function createSession(language) {
  return {
    sessionId: `session_${Date.now()}`,
    createdAt: new Date().toISOString(),
    language,
    subjectType: "health_screening",
    inspection: { images: [], answers: {} },
    environment: { available: false },
    analysis: null,
    result: null,
  };
}

function loadSessions() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return raw.map((item) => hydrateSession(item));
  } catch {
    return [];
  }
}

function loadActiveSession() {
  try {
    const raw = JSON.parse(sessionStorage.getItem(ACTIVE_SESSION_KEY) || "null");
    return raw ? hydrateSession(raw) : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }) {
  const [language, setLanguage] = useState(APP_CONFIG.app.defaultLanguage);
  const [activeSession, setActiveSession] = useState(loadActiveSession);
  const [pastSessions, setPastSessions] = useState(loadSessions);
  const [muted, setMuted] = useState(false);
  const [themeMode, setThemeMode] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) || "system";
    } catch {
      return "system";
    }
  });
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event) => setSystemPrefersDark(event.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const resolvedTheme = useMemo(() => {
    if (themeMode === "dark") return "dark";
    if (themeMode === "light") return "light";
    return systemPrefersDark ? "dark" : "light";
  }, [themeMode, systemPrefersDark]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute("content", resolvedTheme === "dark" ? "#121c17" : "#0A5341");
    }
  }, [resolvedTheme]);

  const toggleTheme = useCallback(() => {
    document.documentElement.classList.add("theme-transitioning");
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    setThemeMode(nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (error) {
      console.warn("Could not persist theme preference", error);
    }
    setTimeout(() => {
      document.documentElement.classList.remove("theme-transitioning");
    }, 260);
  }, [resolvedTheme]);

  useEffect(() => {
    try {
      if (activeSession) sessionStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(activeSession));
      else sessionStorage.removeItem(ACTIVE_SESSION_KEY);
    } catch (error) {
      console.warn("Could not persist the active screening session", error);
    }
  }, [activeSession]);

  const speakText = useCallback(
    (text) => {
      if (muted) return;
      speak(text, language).catch(console.warn);
    },
    [language, muted],
  );

  const startInspection = useCallback(() => {
    const session = createSession(language);
    setActiveSession(session);
    return session;
  }, [language]);

  const addImage = useCallback((image) => {
    setActiveSession((session) => ({
      ...session,
      inspection: {
        ...session.inspection,
        images: [
          ...session.inspection.images.filter((item) => item.stepId !== image.stepId),
          image,
        ],
      },
    }));
  }, []);

  const answerQuestion = useCallback((key, value) => {
    setActiveSession((session) => ({
      ...session,
      inspection: {
        ...session.inspection,
        answers: { ...session.inspection.answers, [key]: value },
      },
    }));
  }, []);

  const completeAnalysis = useCallback((result) => {
    setActiveSession((session) => ({ ...session, analysis: result, result }));
  }, []);

  const saveSession = useCallback((sessionOverride) => {
    const session = sessionOverride ?? activeSession;
    if (!session) return;
    const persistedSession = {
      sessionId: session.sessionId,
      createdAt: session.createdAt,
      language: session.language,
      subjectType: session.subjectType || "health_screening",
      inspection: session.inspection ? {
        answers: session.inspection.answers || {},
        images: (session.inspection.images || []).map((img) => ({
          id: img.id,
          stepId: img.stepId,
          role: img.role,
          capturedAt: img.capturedAt,
        })),
      } : { answers: {}, images: [] },
      result: session.result || null,
      analysis: session.analysis || session.result || null,
    };
    setPastSessions((current) => {
      const next = [
        persistedSession,
        ...current.filter((item) => item.sessionId !== persistedSession.sessionId),
      ];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (error) {
        console.warn("Could not save session to localStorage", error);
      }
      return next;
    });
  }, [activeSession]);

  const loadPastSession = useCallback((session) => {
    const hydrated = hydrateSession(session);
    setActiveSession(hydrated);
    return hydrated;
  }, []);

  const deleteSession = useCallback((sessionId) => {
    setPastSessions((current) => {
      const next = current.filter((item) => item.sessionId !== sessionId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (error) {
        console.warn("Could not delete session from localStorage", error);
      }
      return next;
    });
    setActiveSession((current) => {
      if (current?.sessionId === sessionId) {
        try {
          sessionStorage.removeItem(ACTIVE_SESSION_KEY);
        } catch (error) {
          console.warn("Could not remove active session from sessionStorage", error);
        }
        return null;
      }
      return current;
    });
  }, []);

  const clearAllSessions = useCallback(() => {
    setPastSessions([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Could not clear sessions from localStorage", error);
    }
  }, []);

  const value = useMemo(() => ({
    language,
    setLanguage,
    themeMode,
    resolvedTheme,
    toggleTheme,
    setThemeMode,
    activeSession,
    setActiveSession,
    loadPastSession,
    pastSessions,
    deleteSession,
    clearAllSessions,
    muted,
    startInspection,
    addImage,
    answerQuestion,
    completeAnalysis,
    saveSession,
    speakText,
    toggleMute: () => {
      setMuted((value) => !value);
      stopSpeaking();
    },
  }), [
    language,
    themeMode,
    resolvedTheme,
    toggleTheme,
    activeSession,
    loadPastSession,
    pastSessions,
    deleteSession,
    clearAllSessions,
    muted,
    startInspection,
    addImage,
    answerQuestion,
    completeAnalysis,
    saveSession,
    speakText,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider");
  return value;
}
