import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Welcome from "./pages/Welcome";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import SymptomIntake from "./pages/SymptomIntake";
import Inspection from "./pages/Inspection";
import Questions from "./pages/Questions";
import Analysis from "./pages/Analysis";
import Result from "./pages/Result";
import Emergency from "./pages/Emergency";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ScrollToTop />
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
      </BrowserRouter>
    </AppProvider>
  );
}

