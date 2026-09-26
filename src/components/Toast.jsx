import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Toast() {
  const { toast, hideToast } = useApp();

  if (!toast) return null;

  const isError = toast.type === "error";
  const isSuccess = toast.type === "success";

  return (
    <div
      className={`toast-container ${toast.type || "info"}`}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      <div className="toast-content">
        <span className="toast-icon" aria-hidden="true">
          {isSuccess && <CheckCircle2 size={18} />}
          {isError && <AlertCircle size={18} />}
          {!isSuccess && !isError && <Info size={18} />}
        </span>
        <span className="toast-message">{toast.message}</span>
        <button
          type="button"
          className="toast-close-btn"
          onClick={hideToast}
          aria-label="Dismiss notification"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
