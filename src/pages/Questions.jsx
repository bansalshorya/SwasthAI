import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_CONFIG } from "../config/appConfig";
import { localize } from "../config/localize";
import { ui } from "../config/uiCopy";
import { useApp } from "../context/AppContext";
import LanguageSwitch from "../components/LanguageSwitch";
import ThemeToggle from "../components/ThemeToggle";

export default function Questions() {
  const navigate = useNavigate();
  const { language, activeSession, answerQuestion, speakText } = useApp();
  const copy = ui(language);
  const [index, setIndex] = useState(0);
  const isAdvancing = useRef(false);
  const question = APP_CONFIG.questions[index];
  const answer = activeSession?.inspection?.answers?.[question.key];

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

    if (index < APP_CONFIG.questions.length - 1) {
      setIndex((value) => value + 1);
      setTimeout(() => {
        isAdvancing.current = false;
      }, 250);
    } else {
      navigate("/inspection");
    }
  }

  // Calculate 4-step progress: symptoms was 25%, questions spans 25% to 50%
  const questionFraction = (index + 1) / APP_CONFIG.questions.length;
  const progressPercent = 25 + questionFraction * 25;

  return (
    <main className="app-screen question-screen">
      <header className="top-row">
        <button className="icon-button" onClick={back} aria-label={copy.back}>
          <ArrowLeft />
        </button>
        <div className="header-actions">
          <div className="step-label" aria-label={copy.stepTwoOfFour}>{copy.stepTwoOfFour}</div>
          <span className="question-count-badge">
            {copy.questionProgress} {index + 1} / {APP_CONFIG.questions.length}
          </span>
          <LanguageSwitch />
          <ThemeToggle />
        </div>
      </header>

      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${progressPercent}%` }} />
      </div>

      <section className="question-card">
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
        disabled={question.required && !answer}
        onClick={next}
      >
        <span>
          {index === APP_CONFIG.questions.length - 1 ? copy.finishQuestions : copy.next}
        </span>
        <ArrowRight size={18} />
      </button>
    </main>
  );
}

