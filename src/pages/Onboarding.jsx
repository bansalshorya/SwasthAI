import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, ListChecks, Mic2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_CONFIG } from "../config/appConfig";
import { localize } from "../config/localize";
import { ui } from "../config/uiCopy";
import { useApp } from "../context/AppContext";

export default function Onboarding() {
  const navigate = useNavigate();
  const { language, speakText } = useApp();
  const copy = ui(language);
  const [index, setIndex] = useState(0);
  const step = APP_CONFIG.onboarding[index];
  const StepIcon = [Mic2, ListChecks, Camera][index] ?? ListChecks;

  useEffect(() => {
    speakText(localize(step.voicePrompt, language));
  }, [step, language, speakText]);

  function back() {
    if (index === 0) navigate("/welcome");
    else setIndex((value) => value - 1);
  }

  function next() {
    if (index === APP_CONFIG.onboarding.length - 1) navigate("/home");
    else setIndex((value) => value + 1);
  }

  return (
    <main className="app-screen onboarding-screen">
      <header className="top-row">
        <button className="icon-button" onClick={back} aria-label={copy.back}><ArrowLeft /></button>
        <button className="text-button" onClick={() => navigate("/home")}>{copy.skip}</button>
      </header>
      <section className="onboarding-card">
        {step.image ? <img src={step.image} alt="" /> : <div className="illustration-placeholder"><StepIcon size={72} strokeWidth={1.4} /></div>}
        <p className="eyebrow">{index + 1} / {APP_CONFIG.onboarding.length}</p>
        <h1>{localize(step.title, language)}</h1>
        <p>{localize(step.subtitle, language)}</p>
      </section>
      <div className="step-dots">
        {APP_CONFIG.onboarding.map((item, itemIndex) => (
          <button key={item.id} className={itemIndex === index ? "active" : ""} onClick={() => setIndex(itemIndex)} />
        ))}
      </div>
      <button className="primary-button" onClick={next}>
        {copy.next}<ArrowRight size={18} />
      </button>
    </main>
  );
}

