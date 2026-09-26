import { useEffect, useRef, useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ui } from "../config/uiCopy";
import { useApp } from "../context/AppContext";
import { runAnalysis } from "../services/aiSkillEngine";

export default function Analysis() {
  const navigate = useNavigate();
  const { language, activeSession, completeAnalysis, saveSession, isOnline } = useApp();
  const copy = ui(language);
  const started = useRef(false);
  const [errorInfo, setErrorInfo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [stageIndex, setStageIndex] = useState(0);

  const stages = [
    copy.stageSymptoms,
    copy.stageAnswers,
    copy.stageRecommendations,
  ];

  // Rotate through real analysis steps gently without fake progress
  useEffect(() => {
    if (!isProcessing || errorInfo) return;
    const interval = setInterval(() => {
      setStageIndex((current) => (current + 1) % stages.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isProcessing, errorInfo, stages.length]);

  async function analyze() {
    if (!activeSession) return navigate("/home", { replace: true });
    
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setErrorInfo({
        title: copy.offlineBannerTitle,
        desc: copy.offlineAlert,
      });
      setIsProcessing(false);
      return;
    }

    setErrorInfo(null);
    setIsProcessing(true);

    try {
      const result = await runAnalysis(activeSession);
      completeAnalysis(result);
      saveSession({ ...activeSession, analysis: result, result });
      navigate("/result");
    } catch (analysisError) {
      console.error("Health screening analysis error:", analysisError);
      setErrorInfo({
        title: copy.analysisFailed,
        desc: copy.analysisFailedDesc,
      });
    } finally {
      setIsProcessing(false);
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    analyze();
  }, []);

  return (
    <main className="center-screen">
      <section className="analysis-card" role="region" aria-live="polite">
        {errorInfo ? (
          <>
            <AlertTriangle size={44} className="danger" aria-hidden="true" />
            <h1>{errorInfo.title}</h1>
            <p className="analysis-error-desc">{errorInfo.desc}</p>
            <button
              type="button"
              className="primary-button"
              disabled={isProcessing}
              onClick={() => {
                started.current = true;
                analyze();
              }}
            >
              <RotateCcw size={18} />
              <span>{copy.retry}</span>
            </button>
          </>
        ) : (
          <>
            <div className="analysis-orbit" aria-hidden="true">
              <span />
            </div>
            <h1>{copy.analyzing}</h1>
            <p className="analysis-stage-text">{stages[stageIndex]}</p>
            <p className="analysis-hint-subtle">{copy.analyzingHint}</p>
          </>
        )}
      </section>
    </main>
  );
}

