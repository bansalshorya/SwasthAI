import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  Images,
  Loader2,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_CONFIG } from "../config/appConfig";
import { localize } from "../config/localize";
import { ui } from "../config/uiCopy";
import { useApp } from "../context/AppContext";
import {
  captureVideoFrame,
  checkLocalPhotoQuality,
  createThumbnailDataUrl,
  openCamera,
  pickFromGallery,
  processImageFile,
  stopCamera,
} from "../services/camera";
import LanguageSwitch from "../components/LanguageSwitch";
import ThemeToggle from "../components/ThemeToggle";

export default function Inspection() {
  const navigate = useNavigate();
  const { language, activeSession, addImage, removeImage, speakText } = useApp();
  const copy = ui(language);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [index, setIndex] = useState(activeSession?.inspection?.images?.length ?? 0);
  const [mode, setMode] = useState("choice"); // "choice" | "camera" | "preview"
  const [preview, setPreview] = useState(null);
  const [photoCheck, setPhotoCheck] = useState(null);
  const [checkingPhoto, setCheckingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const step = APP_CONFIG.inspection.steps[Math.min(index, APP_CONFIG.inspection.steps.length - 1)];
  const images = activeSession?.inspection?.images ?? [];

  useEffect(() => {
    if (!preview) { setPhotoCheck(null); return; }
    let cancelled = false;
    const controller = new AbortController();
    setCheckingPhoto(true);
    async function check() {
      const quality = await checkLocalPhotoQuality(preview);
      try {
        const response = await fetch("/api/photo-check", {
          method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
          body: JSON.stringify({ language, symptoms: activeSession?.inspection?.answers?.symptoms || "", image: preview }),
        });
        if (!response.ok) throw new Error("Photo check unavailable");
        const result = await response.json();
        if (!cancelled) setPhotoCheck(result.status === "relevant" && (quality.dark || quality.blurry)
          ? { status: "quality_warning", explanation: quality.dark ? copy.photoTooDark : copy.photoTooBlurry }
          : result);
      } catch {
        if (!cancelled) setPhotoCheck(quality.dark || quality.blurry
          ? { status: "quality_warning", explanation: quality.dark ? copy.photoTooDark : copy.photoTooBlurry }
          : { status: "unavailable", explanation: copy.photoCheckUnavailable });
      } finally { if (!cancelled) setCheckingPhoto(false); }
    }
    check();
    return () => { cancelled = true; controller.abort(); };
  }, [preview, activeSession?.inspection?.answers?.symptoms, language]);

  useEffect(() => () => stopCamera(streamRef.current), []);

  useEffect(() => {
    if (!activeSession) navigate("/home", { replace: true });
  }, [activeSession, navigate]);

  async function startCamera() {
    setError("");
    setPreview(null);
    setPhotoCheck(null);
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

  async function handleFileSelected(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setIsProcessing(true);
    try {
      const image = await processImageFile(file, step);
      if (image) {
        setPreview(image);
        setMode("preview");
      }
    } catch {
      setError(copy.cameraPermission);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    setError("");
    setIsProcessing(true);
    try {
      const image = await processImageFile(file, step);
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

  async function accept() {
    if (!preview || isProcessing) return;
    setIsProcessing(true);
    try {
      const thumbnailDataUrl = await createThumbnailDataUrl(preview);
      addImage({
        id: `${activeSession.sessionId}_${step.id}_${Date.now()}`,
        stepId: step.id,
        role: step.role,
        dataUrl: preview,
        thumbnailDataUrl,
        photoCheck,
        capturedAt: new Date().toISOString(),
      });
      setPreview(null);
      if (index >= APP_CONFIG.inspection.steps.length - 1) {
        navigate("/review");
      } else {
        setIndex((value) => value + 1);
        setMode("choice");
      }
    } finally {
      setIsProcessing(false);
    }
  }

  if (mode === "camera") {
    return (
      <main className="camera-screen">
        <video ref={videoRef} autoPlay muted playsInline />
        <header className="camera-header">
          <button className="dark-icon" onClick={closeCamera} aria-label={copy.cancel}>
            <X />
          </button>
          <div>
            <strong>{localize(step.label, language)}</strong>
            <small>
              {index + 1} / {APP_CONFIG.inspection.maximumImages}
            </small>
          </div>
          <span className="camera-spacer" />
        </header>
        <div className="camera-guide">
          <strong>{localize(step.label, language)}</strong>
          <span>{localize(step.subtext, language)}</span>
        </div>
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
  }

  if (mode === "preview") {
    return (
      <main className="camera-screen">
        <img className="camera-preview" src={preview} alt="Preview" />
        <header className="camera-header">
          <button
            className="dark-icon"
            onClick={() => {
              setPreview(null);
              setMode("choice");
            }}
            aria-label={copy.cancel}
          >
            <X />
          </button>
          <div>
            <strong>{localize(step.label, language)}</strong>
            <small>{copy.optionalPhoto}</small>
          </div>
          <span className="camera-spacer" />
        </header>
        <div className={`photo-check-panel ${photoCheck?.status || "checking"}`} role="status" aria-live="polite">
          <strong>{copy.photoCheckTitle}</strong>
          <span>{checkingPhoto ? copy.checkingPhoto : photoCheck?.explanation || copy.photoCheckUnavailable}</span>
        </div>
        <footer className="camera-footer">
          <div className="two-buttons">
            <button className="secondary-dark" disabled={isProcessing} onClick={startCamera}>
              <RotateCcw size={18} />
              <span>{copy.retake}</span>
            </button>
            <button className="success-button" disabled={isProcessing || checkingPhoto} onClick={accept}>
              {isProcessing ? <Loader2 size={18} className="spin" /> : <Check size={18} />}
              <span>{["mismatch", "unclear", "quality_warning"].includes(photoCheck?.status) ? copy.keepPhotoAnyway : copy.usePhoto}</span>
            </button>
          </div>
        </footer>
      </main>
    );
  }

  return (
    <main className="app-screen photo-screen workflow-framed-screen">
      <header className="top-row">
        <button
          type="button"
          className="icon-button"
          onClick={() => navigate("/questions")}
          aria-label={copy.back}
        >
          <ArrowLeft />
        </button>
        <div className="header-actions">
          <LanguageSwitch />
          <ThemeToggle />
        </div>
      </header>

      <div className="step-progress-area">
        <div className="step-indicator-row">
          <span className="step-label" aria-label={copy.stepThreeOfFour}>
            {copy.stepThreeOfFour}
          </span>
        </div>
        <div className="progress-track" aria-hidden="true">
          <span style={{ width: "75%" }} />
        </div>
      </div>

      <div className="photo-workspace">
        <div className="photo-intro-column">
          <section className="photo-heading">
            <div className="section-icon">
              <Camera size={22} />
            </div>
            <p className="eyebrow">{copy.optionalPhoto}</p>
            <h1>{copy.optionalPhotoTitle}</h1>
            <p>{copy.optionalPhotoHint}</p>
          </section>

          {/* Reassurance disclaimer banner */}
          <div className="photo-context-banner" role="note">
            <ShieldCheck size={16} className="photo-context-banner-icon" aria-hidden="true" />
            <span>{copy.photoContextNotice}</span>
          </div>

          {images.length > 0 && (
            <div className="photo-strip" role="region" aria-label="Attached photos">
              {images.map((image) => (
                <div className="photo-thumb" key={image.id}>
                  <img src={image.dataUrl} alt="Attached thumbnail" />
                  <span className="photo-thumb-status" aria-hidden="true">
                    <Check size={13} />
                  </span>
                  <button
                    type="button"
                    className="photo-remove-btn"
                    onClick={() => removeImage(image.id)}
                    aria-label={copy.removePhoto}
                    title={copy.removePhoto}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              <span className="photo-count-indicator">
                {images.length} / {APP_CONFIG.inspection.maximumImages} {copy.optionalPhoto}
              </span>
            </div>
          )}

          <div className="privacy-note">
            <LockKeyhole size={16} aria-hidden="true" />
            <span>{copy.photoPrivacy}</span>
          </div>
        </div>

        {/* Refined, balanced photo upload zone */}
        <div className="photo-capture-column">
          <section
            className={`photo-dropzone ${isDragging ? "dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="dropzone-icon-well" aria-hidden="true">
              {isDragging ? (
                <UploadCloud size={32} className="drag-icon-active" />
              ) : (
                <Camera size={28} />
              )}
            </div>

            <div className="dropzone-text">
              <h2>{localize(step.label, language)}</h2>
              <p>{localize(step.subtext, language)}</p>
            </div>

            <div className="photo-actions-group">
              <button
                type="button"
                className="primary-button dropzone-primary-btn"
                onClick={startCamera}
              >
                <Camera size={18} />
                <span>{copy.openCamera}</span>
              </button>

              <button
                type="button"
                className="secondary-button dropzone-secondary-btn"
                onClick={gallery}
              >
                <Images size={18} />
                <span>{copy.gallery}</span>
              </button>
            </div>

            <div className="drag-drop-hint">
              <UploadCloud size={14} aria-hidden="true" />
              <span>{copy.dragDropPhoto}</span>
            </div>

            {/* Hidden accessible file input fallback */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileSelected}
              aria-label={localize(step.label, language)}
            />
          </section>

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="photo-footer-actions">
            <button
              type="button"
              className="photo-continue-btn"
              onClick={() => navigate("/review")}
            >
              <span>{images.length ? copy.reviewAndContinue : copy.skipPhotoAndReview}</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
