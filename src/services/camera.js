import { Capacitor } from "@capacitor/core";

export async function openCamera(videoElement) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  });
  videoElement.srcObject = stream;
  await videoElement.play();
  return stream;
}

export function stopCamera(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function captureVideoFrame(video, options = {}) {
  const maxDimension = options.maxDimension ?? 800;
  const quality = options.quality ?? 0.82;
  const scale = Math.min(1, maxDimension / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/webp", quality);
}

function normalizeImage(dataUrl, { maxDimension = 1000, quality = 0.84 } = {}) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/webp", quality));
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

export function createThumbnailDataUrl(dataUrl) {
  return normalizeImage(dataUrl, { maxDimension: 240, quality: 0.58 });
}

export function checkLocalPhotoQuality(dataUrl) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0, 64, 64);
      const pixels = context.getImageData(0, 0, 64, 64).data;
      let total = 0;
      let edges = 0;
      const gray = [];
      for (let i = 0; i < pixels.length; i += 4) {
        const value = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        gray.push(value);
        total += value;
      }
      for (let y = 1; y < 63; y++) for (let x = 1; x < 63; x++) {
        const i = y * 64 + x;
        edges += Math.abs(4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - 64] - gray[i + 64]);
      }
      resolve({ dark: total / gray.length < 42, blurry: edges / (62 * 62) < 12 });
    };
    image.onerror = () => resolve({ dark: false, blurry: false });
    image.src = dataUrl;
  });
}

export async function processImageFile(file, options = {}) {
  if (!file || !file.type || !file.type.startsWith("image/")) return null;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => resolve(await normalizeImage(reader.result, options));
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

async function browserFilePicker(options) {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      resolve(await processImageFile(file, options));
    };
    input.click();
  });
}

export async function pickFromGallery(options = {}) {
  if (!Capacitor.isNativePlatform()) return browserFilePicker(options);
  const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Photos,
    correctOrientation: true,
    width: 1280,
  });
  return photo.dataUrl ? normalizeImage(photo.dataUrl, options) : null;
}

