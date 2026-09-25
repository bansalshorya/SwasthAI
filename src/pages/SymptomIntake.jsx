import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, AlertTriangle, Mic, MicOff, Sparkles } from "lucide-react";
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
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const redFlag = useMemo(() => hasRedFlag(symptoms), [symptoms]);
  const suggestions = APP_CONFIG.symptomSuggestions[language] ?? APP_CONFIG.symptomSuggestions.en;

  function addSuggestion(value) {
    setSymptoms((current) => current ? `${current}, ${value}` : value);
  }

  async function toggleListening() {
    if (listening) return;
    setSpeechError("");
    setListening(true);
    const startingText = symptoms;
    try {
      const spoken = await listenForSpeech(language, {
        onInterim: (text) => setSymptoms([startingText, text].filter(Boolean).join(" ")),
      });
      if (spoken) setSymptoms([startingText, spoken].filter(Boolean).join(" "));
    } catch {
      setSpeechError(copy.micUnavailable);
    } finally {
      setListening(false);
    }
  }

  function continueFlow() {
    const cleanSymptoms = symptoms.trim();
    if (!cleanSymptoms) return;
    answerQuestion("symptoms", cleanSymptoms);
    navigate(hasRedFlag(cleanSymptoms) ? "/emergency" : "/questions");
  }

  return (
    <main className="app-screen intake-screen">
      <header className="top-row">
        <button className="icon-button" onClick={() => navigate("/home")} aria-label={copy.back}><ArrowLeft /></button>
        <div className="header-actions">
          <div className="step-label">{copy.stepOne}</div>
          <LanguageSwitch />
          <ThemeToggle />
        </div>
      </header>

      <section className="intake-heading">
        <div className="section-icon"><Sparkles size={22} /></div>
        <p className="eyebrow">{copy.symptomCheck}</p>
        <h1>{copy.describeSymptoms}</h1>
        <p>{copy.describeSymptomsHint}</p>
      </section>

      <section className="symptom-composer">
        <textarea
          value={symptoms}
          onChange={(event) => setSymptoms(event.target.value)}
          placeholder={copy.symptomPlaceholder}
          rows="7"
          autoFocus
        />
        <button
          type="button"
          className={`mic-button ${listening ? "listening" : ""}`}
          onClick={toggleListening}
          disabled={!speechRecognitionSupported() || listening}
          aria-label={copy.speakSymptoms}
        >
          {listening ? <MicOff /> : <Mic />}
        </button>
      </section>
      <p className="mic-hint">{listening ? copy.listening : copy.speakSymptoms}</p>
      {speechError && <p className="form-error">{speechError}</p>}

      <div className="suggestion-list">
        {suggestions.map((item) => <button key={item} onClick={() => addSuggestion(item)}>+ {item}</button>)}
      </div>

      {redFlag && <section className="urgent-inline">
        <AlertTriangle size={22} />
        <div><strong>{copy.redFlagFound}</strong><p>{copy.redFlagFoundHint}</p></div>
      </section>}

      <div className="privacy-note">{copy.privateSession}</div>
      <button className="primary-button" disabled={!symptoms.trim()} onClick={continueFlow}>
        {redFlag ? copy.getUrgentHelp : copy.continue}<ArrowRight size={18} />
      </button>
    </main>
  );
}
