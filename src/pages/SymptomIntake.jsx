import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, AlertTriangle, Check, HeartPulse, Loader2, Mic, MicOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_CONFIG } from "../config/appConfig";
import { ui } from "../config/uiCopy";
import { useApp } from "../context/AppContext";
import { hasRedFlag } from "../services/redFlags";
import { listenForSpeech, speechRecognitionSupported } from "../services/speechRecognition";
import LanguageSwitch from "../components/LanguageSwitch";
import ThemeToggle from "../components/ThemeToggle";

export default function SymptomIntake() {
  const navigate = useNavigate();
  const { language, activeSession, answerQuestion } = useApp();
  const copy = ui(language);
  const [symptoms, setSymptoms] = useState(activeSession?.inspection?.answers?.symptoms ?? "");
  const [voiceState, setVoiceState] = useState("idle"); // idle | listening | processing | success | error | permission_denied
  const [speechError, setSpeechError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const controllerRef = useRef(null);
  const redFlag = useMemo(() => hasRedFlag(symptoms), [symptoms]);
  const suggestions = APP_CONFIG.symptomSuggestions[language] ?? APP_CONFIG.symptomSuggestions.en;

  // Cleanup speech controller on unmount
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  function handleSymptomChange(value) {
    setSymptoms(value);
    if (validationError && value.trim()) {
      setValidationError("");
    }
  }

  function addSuggestion(value) {
    setSymptoms((current) => {
      const trimmed = current.trim();
      if (!trimmed) return value;
      const existingTokens = trimmed.split(/[,、/]+/).map((s) => s.trim().toLowerCase());
      if (existingTokens.includes(value.trim().toLowerCase())) {
        return current;
      }
      return `${trimmed}, ${value}`;
    });
    if (validationError) {
      setValidationError("");
    }
  }

  async function toggleListening() {
    if (voiceState === "listening" || voiceState === "processing") {
      controllerRef.current?.abort();
      setVoiceState("idle");
      return;
    }

    setSpeechError("");
    setVoiceState("listening");
    const startingText = symptoms.trim();

    try {
      const spoken = await listenForSpeech(language, {
        onStateChange: (state) => setVoiceState(state),
        onController: (ctrl) => {
          controllerRef.current = ctrl;
        },
        onInterim: (text) => {
          const merged = [startingText, text].filter(Boolean).join(" ");
          setSymptoms(merged);
        },
      });

      if (spoken) {
        const merged = [startingText, spoken].filter(Boolean).join(" ");
        setSymptoms(merged);
        if (validationError) setValidationError("");
        setVoiceState("success");
        setTimeout(() => setVoiceState("idle"), 1600);
      } else {
        setVoiceState("idle");
      }
    } catch (err) {
      if (err.code === "permission_denied") {
        setVoiceState("permission_denied");
        setSpeechError(`${copy.micPermissionDenied} ${copy.micPermissionHint}`);
      } else {
        setVoiceState("error");
        setSpeechError(copy.speechError);
      }
    } finally {
      controllerRef.current = null;
    }
  }

  function continueFlow() {
    const cleanSymptoms = symptoms.trim();
    if (!cleanSymptoms) {
      setValidationError(copy.symptomRequired);
      return;
    }

    setValidationError("");
    setIsSubmitting(true);
    answerQuestion("symptoms", cleanSymptoms);
    navigate(hasRedFlag(cleanSymptoms) ? "/emergency" : "/questions");
  }

  const isVoiceActive = voiceState === "listening" || voiceState === "processing";

  return (
    <main className="app-screen intake-screen">
      <header className="top-row">
        <button className="icon-button" onClick={() => navigate("/home")} aria-label={copy.back}>
          <ArrowLeft />
        </button>
        <div className="header-actions">
          <div className="step-label" aria-label={copy.stepOneOfFour}>{copy.stepOneOfFour}</div>
          <LanguageSwitch />
          <ThemeToggle />
        </div>
      </header>

      <div className="progress-track" aria-hidden="true">
        <span style={{ width: "25%" }} />
      </div>

      <section className="intake-heading">
        <div className="section-icon">
          <HeartPulse size={22} />
        </div>
        <p className="eyebrow">{copy.symptomCheck}</p>
        <h1>{copy.describeSymptoms}</h1>
        <p>{copy.describeSymptomsHint}</p>
      </section>

      <section className="symptom-composer">
        <textarea
          value={symptoms}
          onChange={(event) => handleSymptomChange(event.target.value)}
          placeholder={copy.symptomPlaceholder}
          rows="7"
          aria-label={copy.describeSymptoms}
          aria-invalid={Boolean(validationError)}
          autoFocus
        />
        <button
          type="button"
          className={`mic-button ${isVoiceActive ? "listening" : ""} ${voiceState === "success" ? "success" : ""}`}
          onClick={toggleListening}
          disabled={!speechRecognitionSupported() || isSubmitting}
          aria-label={isVoiceActive ? copy.listeningStatus : copy.speakSymptoms}
          title={isVoiceActive ? copy.listeningStatus : copy.speakSymptoms}
        >
          {voiceState === "processing" ? (
            <Loader2 className="spin" size={20} />
          ) : voiceState === "success" ? (
            <Check size={20} />
          ) : isVoiceActive ? (
            <MicOff size={20} />
          ) : (
            <Mic size={20} />
          )}
        </button>
      </section>

      <div className="voice-status-row" aria-live="polite">
        {voiceState === "listening" && (
          <span className="voice-status-pill listening">
            <span className="pulse-dot" aria-hidden="true" />
            {copy.listeningStatus}
          </span>
        )}
        {voiceState === "processing" && (
          <span className="voice-status-pill processing">
            <Loader2 size={13} className="spin" aria-hidden="true" />
            {copy.processingSpeech}
          </span>
        )}
        {voiceState === "success" && (
          <span className="voice-status-pill success">
            <Check size={13} aria-hidden="true" />
            {copy.speechSuccess}
          </span>
        )}
        {!isVoiceActive && voiceState !== "success" && (
          <p className="mic-hint">{copy.speakSymptoms}</p>
        )}
      </div>

      {speechError && (
        <div className="form-error voice-error" role="alert" aria-live="polite">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{speechError}</span>
        </div>
      )}

      {validationError && (
        <div className="form-error-inline" role="alert" aria-live="polite">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{validationError}</span>
        </div>
      )}

      <div className="suggestion-list" role="region" aria-label="Symptom suggestions">
        {suggestions.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => addSuggestion(item)}
            aria-label={`Add ${item}`}
          >
            + {item}
          </button>
        ))}
      </div>

      {redFlag && (
        <section className="urgent-inline" role="alert">
          <AlertTriangle size={22} />
          <div>
            <strong>{copy.redFlagFound}</strong>
            <p>{copy.redFlagFoundHint}</p>
          </div>
        </section>
      )}

      <div className="privacy-note">{copy.privateSession}</div>

      <button
        type="button"
        className="primary-button"
        disabled={isSubmitting}
        onClick={continueFlow}
      >
        <span>{redFlag ? copy.getUrgentHelp : copy.continue}</span>
        <ArrowRight size={18} />
      </button>
    </main>
  );
}
