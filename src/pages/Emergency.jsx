import { AlertTriangle, ArrowLeft, PhoneCall } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ui } from "../config/uiCopy";
import { useApp } from "../context/AppContext";

export default function Emergency() {
  const navigate = useNavigate();
  const { language } = useApp();
  const copy = ui(language);

  return (
    <main className="emergency-screen">
      <button className="emergency-back" onClick={() => navigate("/symptoms")}><ArrowLeft size={18} />{copy.back}</button>
      <section className="emergency-content">
        <div className="emergency-icon"><AlertTriangle size={44} /></div>
        <p className="eyebrow">{copy.emergencyEyebrow}</p>
        <h1>{copy.emergencyTitle}</h1>
        <p>{copy.emergencyBody}</p>
        <a className="emergency-call" href="tel:112"><PhoneCall size={20} />{copy.callEmergency}</a>
        <p className="emergency-note">{copy.emergencyNote}</p>
      </section>
    </main>
  );
}
