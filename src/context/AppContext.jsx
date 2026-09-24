import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { APP_CONFIG } from "../config/appConfig";
import { speak, stopSpeaking } from "../services/speech";

const AppContext = createContext(null);
const STORAGE_KEY = "inspection_app_sessions_v1";
const ACTIVE_SESSION_KEY = "swasthai_active_session_v1";

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
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function loadActiveSession() {
  try {
    return JSON.parse(sessionStorage.getItem(ACTIVE_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function AppProvider({ children }) {
  const [language, setLanguage] = useState(APP_CONFIG.app.defaultLanguage);
  const [activeSession, setActiveSession] = useState(loadActiveSession);
  const [pastSessions, setPastSessions] = useState(loadSessions);
  const [muted, setMuted] = useState(false);

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
      result: session.result ? {
        riskLevel: session.result.riskLevel,
        summary: session.result.summary,
        possibleConditions: session.result.possibleConditions,
      } : null,
    };
    setPastSessions((current) => {
      const next = [
        persistedSession,
        ...current.filter((item) => item.sessionId !== persistedSession.sessionId),
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [activeSession]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    activeSession,
    pastSessions,
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
    activeSession,
    pastSessions,
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
