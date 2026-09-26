import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Check, Images, Loader2, LockKeyhole, RotateCcw, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_CONFIG } from "../config/appConfig";
import { localize } from "../config/localize";
import { ui } from "../config/uiCopy";
import { useApp } from "../context/AppContext";
import { captureVideoFrame, openCamera, pickFromGallery, stopCamera } from "../services/camera";
import LanguageSwitch from "../components/LanguageSwitch";
import ThemeToggle from "../components/ThemeToggle";

export default function Inspection() {
  const navigate = useNavigate();
  const { language, activeSession, addImage, speakText } = useApp();
  const copy = ui(language);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [index, setIndex] = useState(activeSession?.inspection?.images?.length ?? 0);
  const [mode, setMode] = useState("choice"); // "choice" | "camera" | "preview"
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const step = APP_CONFIG.inspection.steps[Math.min(index, APP_CONFIG.inspection.steps.length - 1)];
  const images = activeSession?.inspection?.images ?? [];

  useEffect(() => () => stopCamera(streamRef.current), []);

  useEffect(() => {
    if (!activeSession) navigate("/home", { replace: true });
  }, [activeSession, navigate]);

  async function startCamera() {
    setError("");
    setMode("camera");
    await new Promise((resolve) => requestAnimationFrame(resolve));
    try {
      streamRef.current = await openCamera(videoRef.current);
      speakText(localize(step.voicePrompt, language));
    } catch (err) {
      stopCamera(streamRef.current);
      streamRef.current = null;
      setMode("choice");
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setError(copy.cameraPermissionDenied || copy.cameraPermission);
      } else if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
        setError(copy.cameraNotFound || copy.cameraPermission);
      } else {
        setError(copy.cameraPermission);
      }
    }
  }

  function closeCamera() {
    stopCamera(streamRef.current);
    streamRef.current = null;
    setMode("choice");
  }

  function capture() {
    if (!videoRef.current?.videoWidth || isCapturing) return;
    setIsCapturing(true);
    try {
      const frame = captureVideoFrame(videoRef.current, step);
      if (!frame) throw new Error("Invalid frame capture");
      setPreview(frame);
      stopCamera(streamRef.current);
      streamRef.current = null;
      setMode("preview");
    } catch {
      setError(copy.cameraPermission);
      setMode("choice");
    } finally {
      setIsCapturing(false);
    }
  }

  async function gallery() {
    setError("");
    setIsProcessing(true);
    try {
      const image = await pickFromGallery(step);
      if (image) {
        setPreview(image);
        setMode("preview");
      }
    } catch {
      setError(copy.cameraPermission);
    } finally {
      setIsProcessing(false);
    }
  }

  function accept() {
    if (!preview || isProcessing) return;
    setIsProcessing(true);
    try {
      addImage({
        id: `${activeSession.sessionId}_${step.id}_${Date.now()}`,
        stepId: step.id,
        role: step.role,
        dataUrl: preview,
        capturedAt: new Date().toISOString(),
      });
      setPreview(null);
      if (index >= APP_CONFIG.inspection.steps.length - 1) navigate("/analysis");
      else {
        setIndex((value) => value + 1);
        setMode("choice");
      }
    } finally {
      setIsProcessing(false);
    }
  }

  if (mode === "camera") return (
    <main className="camera-screen">
      <video ref={videoRef} autoPlay muted playsInline />
      <header className="camera-header">
        <button className="dark-icon" onClick={closeCamera}><X /></button>
        <div><strong>{localize(step.label, language)}</strong><small>{index + 1} / {APP_CONFIG.inspection.maximumImages}</small></div>
        <span className="camera-spacer" />
      </header>
      <div className="camera-guide"><strong>{localize(step.label, language)}</strong><span>{localize(step.subtext, language)}</span></div>
      <footer className="camera-footer single-control">
        <button
          className="shutter"
          onClick={capture}
          disabled={isCapturing}
          aria-label={isCapturing ? copy.capturingImage : copy.usePhoto}
        >
          <span className={isCapturing ? "capturing" : ""} />
        </button>
      </footer>
    </main>
  );

  if (mode === "preview") return (
    <main className="camera-screen">
      <img className="camera-preview" src={preview} alt="Preview" />
      <header className="camera-header">
        <button className="dark-icon" onClick={() => { setPreview(null); setMode("choice"); }}><X /></button>
        <div><strong>{localize(step.label, language)}</strong><small>{copy.optionalPhoto}</small></div>
        <span className="camera-spacer" />
      </header>
      <footer className="camera-footer">
        <div className="two-buttons">
          <button className="secondary-dark" disabled={isProcessing} onClick={startCamera}>
            <RotateCcw size={18} />
            <span>{copy.retake}</span>
          </button>
          <button className="success-button" disabled={isProcessing} onClick={accept}>
            {isProcessing ? <Loader2 size={18} className="spin" /> : <Check size={18} />}
            <span>{copy.usePhoto}</span>
          </button>
        </div>
      </footer>
    </main>
  );

  return (
    <main className="app-screen photo-screen">
      <header className="top-row">
        <button className="icon-button" onClick={() => navigate("/questions")} aria-label={copy.back}>
          <ArrowLeft />
        </button>
        <div className="header-actions">
          <div className="step-label" aria-label={copy.stepThreeOfFour}>{copy.stepThreeOfFour}</div>
          <LanguageSwitch />
          <ThemeToggle />
        </div>
      </header>

      <div className="progress-track" aria-hidden="true">
        <span style={{ width: "75%" }} />
      </div>
      <section className="photo-heading">
        <div className="section-icon"><Camera size={22} /></div>
        <p className="eyebrow">{copy.optionalPhoto}</p>
        <h1>{copy.optionalPhotoTitle}</h1>
        <p>{copy.optionalPhotoHint}</p>
      </section>

      {images.length > 0 && <div className="photo-strip">
        {images.map((image) => <div className="photo-thumb" key={image.id}><img src={image.dataUrl} alt="" /><span><Check size={13} /></span></div>)}
        <strong>{images.length} / {APP_CONFIG.inspection.maximumImages}</strong>
      </div>}

      <section className="capture-card">
        <div className="capture-visual"><Camera size={42} /></div>
        <h2>{localize(step.label, language)}</h2>
        <p>{localize(step.subtext, language)}</p>
        <button className="primary-button" onClick={startCamera}><Camera size={18} />{copy.openCamera}</button>
        <button className="outline-button" onClick={gallery}><Images size={18} />{copy.gallery}</button>
      </section>
      {error && <p className="form-error">{error}</p>}
      <div className="privacy-note"><LockKeyhole size={16} />{copy.photoPrivacy}</div>
      <button className="text-continue" onClick={() => navigate("/analysis")}>{images.length ? copy.finishPhotos : copy.skipPhoto}</button>
    </main>
  );
}
