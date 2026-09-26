export function speechRecognitionSupported() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function listenForSpeech(language, { onInterim, onStateChange, onController } = {}) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    const error = new Error("Speech recognition is not supported in this browser.");
    error.code = "not_supported";
    return Promise.reject(error);
  }

  return new Promise((resolve, reject) => {
    let recognition;
    try {
      recognition = new Recognition();
    } catch (e) {
      return reject(e);
    }

    let finalText = "";
    let aborted = false;

    recognition.lang = language === "hi" ? "hi-IN" : "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    const controller = {
      abort: () => {
        aborted = true;
        try {
          recognition.abort();
        } catch (_) {}
      },
    };
    onController?.(controller);

    recognition.onstart = () => {
      onStateChange?.("listening");
    };

    recognition.onspeechstart = () => {
      onStateChange?.("listening");
    };

    recognition.onspeechend = () => {
      onStateChange?.("processing");
    };

    recognition.onresult = (event) => {
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript ?? "";
        if (event.results[index].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      onInterim?.(`${finalText} ${interimText}`.trim());
    };

    recognition.onerror = (event) => {
      if (aborted) {
        resolve("");
        return;
      }
      const err = new Error(event.error || "Speech recognition failed.");
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        err.code = "permission_denied";
      } else if (event.error === "no-speech") {
        err.code = "no_speech";
      } else if (event.error === "network") {
        err.code = "network";
      } else {
        err.code = event.error || "failed";
      }
      reject(err);
    };

    recognition.onend = () => {
      if (aborted) {
        resolve("");
        return;
      }
      resolve(finalText.trim());
    };

    try {
      recognition.start();
    } catch (startError) {
      reject(startError);
    }
  });
}
