export function speechRecognitionSupported() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function listenForSpeech(language, { onInterim } = {}) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) return Promise.reject(new Error("Speech recognition is not supported in this browser."));

  return new Promise((resolve, reject) => {
    const recognition = new Recognition();
    let finalText = "";
    recognition.lang = language === "hi" ? "hi-IN" : "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript ?? "";
        if (event.results[index].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      onInterim?.(`${finalText} ${interimText}`.trim());
    };
    recognition.onerror = (event) => reject(new Error(event.error || "Speech recognition failed."));
    recognition.onend = () => resolve(finalText.trim());
    recognition.start();
  });
}
