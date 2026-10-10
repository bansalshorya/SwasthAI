import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_CONFIG } from "../config/appConfig";
import { FOLLOW_UP_BY_KEY, fallbackFollowUpIds } from "../config/followUpQuestions";
import { localize } from "../config/localize";
import { ui } from "../config/uiCopy";
import { useApp } from "../context/AppContext";
import LanguageSwitch from "../components/LanguageSwitch";
import ThemeToggle from "../components/ThemeToggle";

export default function Questions() {
  const navigate = useNavigate();
  const { language, activeSession, answerQuestion, setFollowUpIds, speakText } = useApp();
  const copy = ui(language);
  const [index, setIndex] = useState(0);
  const [loadingFollowUps, setLoadingFollowUps] = useState(!activeSession?.inspection?.followUpIds?.length);
  const isAdvancing = useRef(false);
  const followUpIds = activeSession?.inspection?.followUpIds || [];
  const questions = [...APP_CONFIG.questions, ...followUpIds.map((id) => FOLLOW_UP_BY_KEY.get(id)).filter(Boolean)
    .map((item) => ({ ...item, key: `followUp_${item.key}`, required: true }))];
  const question = questions[Math.min(index, questions.length - 1)];
  const answer = activeSession?.inspection?.answers?.[question.key];

  useEffect(() => {
    const symptoms = activeSession?.inspection?.answers?.symptoms;
    if (!symptoms || followUpIds.length) { setLoadingFollowUps(false); return; }
    let cancelled = false;
    async function prepare() {
      try {
        const response = await fetch("/api/follow-up", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symptoms, language }),
        });
        if (!response.ok) throw new Error("Follow-up service unavailable");
        const data = await response.json();
        if (!cancelled) setFollowUpIds(Array.isArray(data.ids) && data.ids.length >= 2 ? data.ids : fallbackFollowUpIds(symptoms));
      } catch {
        if (!cancelled) setFollowUpIds(fallbackFollowUpIds(symptoms));
      } finally {
        if (!cancelled) setLoadingFollowUps(false);
      }
    }
    prepare();
    return () => { cancelled = true; };
  }, [activeSession?.sessionId, activeSession?.inspection?.answers?.symptoms, followUpIds.length, language, setFollowUpIds]);

  useEffect(() => {
    speakText(localize(question.title, language));
  }, [question, language, speakText]);

  function back() {
    if (index === 0) navigate("/symptoms");
    else setIndex((value) => value - 1);
  }

  function next() {
    if (question.required && !answer) return;
    if (isAdvancing.current) return;
    isAdvancing.current = true;

    if (question.key === "followUp_breathing" && answer === "yes") {
      navigate("/emergency");
      return;
    }

    if (loadingFollowUps) { isAdvancing.current = false; return; }
    if (index < questions.length - 1) {
      setIndex((value) => value + 1);
      setTimeout(() => {
        isAdvancing.current = false;
      }, 250);
    } else {
      navigate(activeSession?.inspection?.answers?.followUp_breathing === "yes" ? "/emergency" : "/inspection");
    }
  }

  // Calculate 4-step progress: symptoms was 25%, questions spans 25% to 50%
  const questionFraction = (index + 1) / questions.length;
  const progressPercent = 25 + questionFraction * 25;

  return (
    <main className="app-screen question-screen">
      <header className="top-row">
        <button className="icon-button" onClick={back} aria-label={copy.back}>
          <ArrowLeft />
        </button>
        <div className="header-actions">
          <LanguageSwitch />
          <ThemeToggle />
        </div>
      </header>

      <div className="step-progress-area">
        <div className="step-indicator-row">
          <span className="step-label" aria-label={copy.stepTwoOfFour}>{copy.stepTwoOfFour}</span>
          <span className="question-count-badge">
            {copy.questionProgress} {index + 1} / {questions.length}
          </span>
        </div>
        <div className="progress-track" aria-hidden="true">
          <span style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <section className="question-card">
        {index >= APP_CONFIG.questions.length && <span className="adaptive-question-tag">{copy.adaptiveQuestion}</span>}
        <h1>{localize(question.title, language)}</h1>
        <p>{localize(question.subtitle, language)}</p>

        <div className="option-list" role="radiogroup" aria-label={localize(question.title, language)}>
          {question.options.map((option) => {
            const selected = option.value === answer;
            return (
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                className={selected ? "selected" : ""}
                key={option.value}
                onClick={() => answerQuestion(question.key, option.value)}
              >
                <span>{localize(option.label, language)}</span>
                <span className={`option-indicator ${selected ? "selected" : ""}`} aria-hidden="true">
                  {selected && <Check size={14} />}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {question.required && !answer && (
        <p className="question-required-hint" role="status">
          {copy.answerRequired}
        </p>
      )}

      <button
        type="button"
        className="primary-button"
        disabled={(question.required && !answer) || loadingFollowUps && index === questions.length - 1}
        onClick={next}
      >
        <span>
          {loadingFollowUps && index === questions.length - 1 ? copy.preparingQuestions : index === questions.length - 1 ? copy.finishQuestions : copy.next}
        </span>
        <ArrowRight size={18} />
      </button>
    </main>
  );
}

