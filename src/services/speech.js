import { Capacitor } from "@capacitor/core";

export async function speak(text, language, { onEnd } = {}) {
  if (!text) return;
  const lang = language === "hi" ? "hi-IN" : "en-US";

  if (Capacitor.isNativePlatform()) {
    const { TextToSpeech } = await import("@capacitor-community/text-to-speech");
    await TextToSpeech.stop();
    await TextToSpeech.speak({ text, lang, rate: 0.95, pitch: 1, volume: 1 });
    onEnd?.();
    return;
  }

  if (!("speechSynthesis" in window)) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.95;
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (Capacitor.isNativePlatform()) {
    import("@capacitor-community/text-to-speech").then(({ TextToSpeech }) => TextToSpeech.stop()).catch(console.warn);
  }
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

