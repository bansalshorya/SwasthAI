import React, { Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Toast from "./components/Toast";
import Welcome from "./pages/Welcome";
import Home from "./pages/Home";
import SymptomIntake from "./pages/SymptomIntake";
import Questions from "./pages/Questions";
import Analysis from "./pages/Analysis";

// Lazy-load heavier or non-primary screens with code splitting
const Onboarding = React.lazy(() => import("./pages/Onboarding"));
const Inspection = React.lazy(() => import("./pages/Inspection"));
const Result = React.lazy(() => import("./pages/Result"));
const Emergency = React.lazy(() => import("./pages/Emergency"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function RouteLoadingFallback() {
  return (
    <div className="center-screen" role="status" aria-live="polite">
      <div className="analysis-orbit" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Toast />
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/home" element={<Home />} />
              <Route path="/symptoms" element={<SymptomIntake />} />
              <Route path="/emergency" element={<Emergency />} />
              <Route path="/inspection" element={<Inspection />} />
              <Route path="/questions" element={<Questions />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/result" element={<Result />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
