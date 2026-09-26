import React from "react";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { ui } from "../config/uiCopy";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("SwasthAI Uncaught Application Error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      const lang = typeof document !== "undefined" ? document.documentElement.lang || "en" : "en";
      const copy = ui(lang);

      return (
        <div className="center-screen" role="alert" aria-live="assertive">
          <div className="analysis-card error-boundary-card">
            <div className="error-icon-bubble" aria-hidden="true">
              <AlertTriangle size={36} className="danger" />
            </div>
            <h1>{copy.errorBoundaryTitle}</h1>
            <p className="analysis-error-desc">{copy.errorBoundaryDesc}</p>
            <div className="error-boundary-actions">
              <button
                type="button"
                className="primary-button"
                onClick={this.handleReload}
              >
                <RotateCcw size={16} />
                <span>{copy.reloadApp}</span>
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={this.handleHome}
              >
                <Home size={16} />
                <span>{copy.returnHome}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
