import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_CONFIG } from "../config/appConfig";
import { localize } from "../config/localize";
import { ui } from "../config/uiCopy";
import { useApp } from "../context/AppContext";

export default function Questions() {
  const navigate = useNavigate();
  const { language, activeSession, answerQuestion, speakText } = useApp();
  const copy = ui(language);
  const [index, setIndex] = useState(0);
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
    if (index < APP_CONFIG.questions.length - 1) setIndex((value) => value + 1);
    else navigate("/inspection");
  }

  return (
    <main className="app-screen question-screen">
      <header className="top-row">
        <button className="icon-button" onClick={back} aria-label={copy.back}><ArrowLeft /></button>
        <strong>{copy.questionProgress} {index + 1} / {APP_CONFIG.questions.length}</strong>
      </header>
      <div className="progress-track"><span style={{ width: `${((index + 1) / APP_CONFIG.questions.length) * 100}%` }} /></div>
      <section className="question-card">
        <h1>{localize(question.title, language)}</h1>
        <p>{localize(question.subtitle, language)}</p>
        <div className="option-list">
          {question.options.map((option) => {
            const selected = option.value === answer;
            return <button className={selected ? "selected" : ""} key={option.value} onClick={() => answerQuestion(question.key, option.value)}>
              <span>{localize(option.label, language)}</span>{selected && <Check size={18} />}
            </button>;
          })}
        </div>
      </section>
      <button className="primary-button" disabled={question.required && !answer} onClick={next}>
        {index === APP_CONFIG.questions.length - 1 ? copy.finishQuestions : copy.next}<ArrowRight size={18} />
      </button>
    </main>
  );
}

