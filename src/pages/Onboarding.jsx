import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_CONFIG } from "../config/appConfig";
import { localize } from "../config/localize";
import { ui } from "../config/uiCopy";
import { useApp } from "../context/AppContext";
import OnboardingIllustration from "../components/OnboardingIllustration";

export default function Onboarding() {
  const navigate = useNavigate();
  const { language, speakText } = useApp();
  const copy = ui(language);
  const [index, setIndex] = useState(0);
  const step = APP_CONFIG.onboarding[index];

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
        <OnboardingIllustration stepIndex={index} />
        <div className="onboarding-copy">
          <p className="eyebrow">{index + 1} / {APP_CONFIG.onboarding.length}</p>
          <h1>{localize(step.title, language)}</h1>
          <p>{localize(step.subtitle, language)}</p>
        </div>
      </section>
      <div className="step-dots" role="tablist" aria-label="Onboarding steps">
        {APP_CONFIG.onboarding.map((item, itemIndex) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={itemIndex === index}
            aria-label={`Slide ${itemIndex + 1}`}
            className={itemIndex === index ? "active" : ""}
            onClick={() => setIndex(itemIndex)}
          />
        ))}
      </div>
      <button type="button" className="primary-button" onClick={next}>
        <span>{index === APP_CONFIG.onboarding.length - 1 ? copy.startScreeningCta || copy.next : copy.next}</span>
        <ArrowRight size={18} aria-hidden="true" />
      </button>
    </main>
  );
}

