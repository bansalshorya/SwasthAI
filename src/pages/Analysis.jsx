import { useEffect, useRef, useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ui } from "../config/uiCopy";
import { useApp } from "../context/AppContext";
import { runAnalysis } from "../services/aiSkillEngine";

export default function Analysis() {
  const navigate = useNavigate();
  const { language, activeSession, completeAnalysis, saveSession } = useApp();
  const copy = ui(language);
  const started = useRef(false);
  const [error, setError] = useState("");

  async function analyze() {
    if (!activeSession) return navigate("/home");
    setError("");
    try {
      const result = await runAnalysis(activeSession);
      completeAnalysis(result);
      saveSession({ ...activeSession, analysis: result, result });
      navigate("/result");
    } catch (analysisError) {
      console.error(analysisError);
      setError(analysisError.message || "Analysis failed");
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    analyze();
  }, []);

  return (
    <main className="center-screen">
      <section className="analysis-card">
        {error ? <>
          <AlertTriangle size={40} className="danger" />
          <h1>{error}</h1>
          <button className="primary-button" onClick={analyze}><RotateCcw size={18} />{copy.retry}</button>
        </> : <>
          <div className="analysis-orbit"><span /></div>
          <h1>{copy.analyzing}</h1>
          <p>{copy.analyzingHint}</p>
        </>}
      </section>
    </main>
  );
}

