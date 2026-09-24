import { Capacitor } from "@capacitor/core";

export async function speak(text, language) {
  if (!text) return;
  const lang = language === "hi" ? "hi-IN" : "en-US";

  if (Capacitor.isNativePlatform()) {
    const { TextToSpeech } = await import("@capacitor-community/text-to-speech");
    await TextToSpeech.stop();
    await TextToSpeech.speak({ text, lang, rate: 0.95, pitch: 1, volume: 1 });
    return;
  }

  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

