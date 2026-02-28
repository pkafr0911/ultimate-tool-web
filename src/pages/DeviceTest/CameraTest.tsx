import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Divider,
  Progress,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  CameraOutlined,
  DownloadOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  SwapOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import * as faceapi from '@vladmandic/face-api';

const { Text, Title, Paragraph } = Typography;

interface QualityMetrics {
  brightness: number; // 0-255
  contrast: number; // 0-100
  saturation: number; // 0-100
  sharpness: number; // 0-100
  noise: number; // 0-100
  colorTemp: number; // estimated Kelvin
  rHistogram: number[];
  gHistogram: number[];
  bHistogram: number[];
}

const QUALITY_HISTORY_LENGTH = 60;

interface DetectedFace {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// FACE DETECTION — MODULE-LEVEL SINGLETON STATE
//
// These flags live outside the React component so they persist across
// mount/unmount cycles (e.g. switching tabs).  The model is large (~190 KB)
// so we only want to download and initialize it once per page session.
// ─────────────────────────────────────────────────────────────────────────────
let faceApiLoaded = false; // flips to true after the first successful load
let faceApiLoading = false; // prevents duplicate parallel fetch attempts

/**
 * Model weight sources, tried in order.
 *
 * Each source directory must expose two files:
 *   tiny_face_detector_model-weights_manifest.json  ← describes weight shapes
 *   tiny_face_detector_model.bin                    ← ~190 KB quantized weights
 *
 * Priority:
 *   1. /models/face-api  – served from the project's own `public/` folder,
 *      zero network round-trip when loaded locally or self-hosted.
 *   2. jsDelivr CDN      – reliable fallback for GitHub Pages deployments or
 *      any environment where the local path is unreachable.
 */
const MODEL_SOURCES = [
  '/models/face-api',
  'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model',
];

/**
 * loadFaceApiModels
 * ─────────────────────────────────────────────────────────────────────────────
 * Bootstraps TensorFlow.js and downloads the TinyFaceDetector model weights.
 * Returns `true` on success, `false` if every source fails.
 *
 * Execution flow:
 *
 *  ① Short-circuit  – if already loaded just return true immediately.
 *
 *  ② Concurrent-load guard  – if another call kicked off a load we don't start
 *    a second fetch.  Instead we poll every 100 ms until `faceApiLoading`
 *    clears, then return the shared `faceApiLoaded` result.
 *
 *  ③ TF.js backend selection:
 *      WebGL  (GPU)  ← preferred; uses the GPU via WebGL shader programs.
 *                      Convolution operations run ~5-10× faster than CPU.
 *      CPU    (WASM) ← fallback; slower but works in every browser.
 *    `tf.ready()` waits for the chosen backend to fully initialize before
 *    we attempt any tensor operations.
 *
 *  ④ Weight loading loop  – iterates MODEL_SOURCES.  `loadFromUri(baseUrl)`
 *    appends the manifest filename to `baseUrl`, fetches it, reads the
 *    `paths` array inside, then fetches each listed `.bin` shard.
 *    First success sets `faceApiLoaded = true` and returns.
 * ─────────────────────────────────────────────────────────────────────────────
 */
async function loadFaceApiModels(): Promise<boolean> {
  // ① Already initialized — skip everything
  if (faceApiLoaded) return true;

  // ② Another call is already loading — wait for it instead of fetching twice
  if (faceApiLoading) {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (!faceApiLoading) {
          // loading finished (success or failure)
          clearInterval(check);
          resolve(faceApiLoaded); // share the result of whichever call succeeded
        }
      }, 100);
    });
  }

  faceApiLoading = true; // claim the loading slot

  // ③ TF.js backend initialization
  //    WebGL is preferred because all convolution math is offloaded to the GPU.
  //    On failure (e.g. headless browser, strict CSP) we fall back to CPU.
  try {
    await (faceapi.tf as any).setBackend('webgl'); // request GPU backend
    await (faceapi.tf as any).ready(); // wait for backend to compile shaders
  } catch {
    try {
      await (faceapi.tf as any).setBackend('cpu'); // fall back to JS/WASM
      await (faceapi.tf as any).ready();
    } catch (backendErr) {
      console.error('[FaceAPI] Failed to initialize TF.js backend:', backendErr);
      faceApiLoading = false;
      return false;
    }
  }

  // ④ Fetch model weights from each source, stop at the first success
  for (const source of MODEL_SOURCES) {
    try {
      console.log(`[FaceAPI] Loading model from: ${source}`);
      // loadFromUri(baseUrl) fetches:
      //   GET {baseUrl}/tiny_face_detector_model-weights_manifest.json
      //   GET {baseUrl}/tiny_face_detector_model.bin
      await faceapi.nets.tinyFaceDetector.loadFromUri(source);
      faceApiLoaded = true;
      faceApiLoading = false;
      console.log('[FaceAPI] Model loaded successfully');
      return true;
    } catch (err) {
      // Not a fatal error — we try the next source
      console.warn(`[FaceAPI] Failed to load from ${source}:`, err);
    }
  }

  // All sources exhausted
  console.error('[FaceAPI] All model sources failed');
  faceApiLoading = false;
  return false;
}

function rateMetric(value: number, low: number, high: number): { label: string; color: string } {
  if (value < low) return { label: 'Low', color: '#ff4d4f' };
  if (value > high) return { label: 'High', color: '#ff4d4f' };
  return { label: 'Good', color: '#52c41a' };
}

function analyzeFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): QualityMetrics | null {
  if (!video.videoWidth || !video.videoHeight) return null;

  // Sample at reduced resolution for performance
  const scale = 0.25;
  const w = Math.floor(video.videoWidth * scale);
  const h = Math.floor(video.videoHeight * scale);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const pixelCount = w * h;

  const rHist = new Array(256).fill(0);
  const gHist = new Array(256).fill(0);
  const bHist = new Array(256).fill(0);

  let totalLum = 0;
  let totalSat = 0;
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    rHist[r]++;
    gHist[g]++;
    bHist[b]++;

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    totalLum += lum;
    totalR += r;
    totalG += g;
    totalB += b;

    // Saturation via HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const sat = max === min ? 0 : (max - min) / (l > 127.5 ? 510 - max - min : max + min);
    totalSat += sat;
  }

  const brightness = totalLum / pixelCount;
  const avgSat = (totalSat / pixelCount) * 100;
  const avgR = totalR / pixelCount;
  const avgG = totalG / pixelCount;
  const avgB = totalB / pixelCount;

  // Contrast: std deviation of luminance
  let lumVariance = 0;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    lumVariance += (lum - brightness) ** 2;
  }
  const contrast = Math.min(100, (Math.sqrt(lumVariance / pixelCount) / 128) * 100);

  // Sharpness: Laplacian variance (sample every 2nd pixel for speed)
  let laplacianSum = 0;
  let laplacianCount = 0;
  for (let y = 1; y < h - 1; y += 2) {
    for (let x = 1; x < w - 1; x += 2) {
      const idx = (y * w + x) * 4;
      const center = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      const top =
        0.299 * data[idx - w * 4] + 0.587 * data[idx - w * 4 + 1] + 0.114 * data[idx - w * 4 + 2];
      const bottom =
        0.299 * data[idx + w * 4] + 0.587 * data[idx + w * 4 + 1] + 0.114 * data[idx + w * 4 + 2];
      const left = 0.299 * data[idx - 4] + 0.587 * data[idx - 3] + 0.114 * data[idx - 2];
      const right = 0.299 * data[idx + 4] + 0.587 * data[idx + 5] + 0.114 * data[idx + 6];
      const lap = Math.abs(top + bottom + left + right - 4 * center);
      laplacianSum += lap;
      laplacianCount++;
    }
  }
  const sharpness = Math.min(100, (laplacianSum / laplacianCount / 50) * 100);

  // Noise: local variance on small patches
  let noiseSum = 0;
  let noiseCount = 0;
  const patchSize = 4;
  for (let py = 0; py < h - patchSize; py += patchSize * 2) {
    for (let px = 0; px < w - patchSize; px += patchSize * 2) {
      let patchMean = 0;
      const patchPixels: number[] = [];
      for (let dy = 0; dy < patchSize; dy++) {
        for (let dx = 0; dx < patchSize; dx++) {
          const idx = ((py + dy) * w + (px + dx)) * 4;
          const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          patchPixels.push(lum);
          patchMean += lum;
        }
      }
      patchMean /= patchPixels.length;
      let patchVar = 0;
      for (const p of patchPixels) patchVar += (p - patchMean) ** 2;
      noiseSum += patchVar / patchPixels.length;
      noiseCount++;
    }
  }
  const noise = Math.min(100, (Math.sqrt(noiseSum / noiseCount) / 30) * 100);

  // Color temperature estimate (simple McCamy's approximation from RGB ratios)
  const rRatio = avgR / (avgR + avgG + avgB);
  const bRatio = avgB / (avgR + avgG + avgB);
  const colorTemp = Math.round(6500 + (rRatio - bRatio) * 15000);

  return {
    brightness,
    contrast,
    saturation: avgSat,
    sharpness,
    noise,
    colorTemp: Math.max(2000, Math.min(12000, colorTemp)),
    rHistogram: rHist,
    gHistogram: gHist,
    bHistogram: bHist,
  };
}

const CameraTest: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement>(null);
  const faceCanvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const faceIntervalRef = useRef<ReturnType<typeof setInterval>>(0 as any);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [mirrored, setMirrored] = useState(true);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string>('');
  const [cameraInfo, setCameraInfo] = useState<Record<string, string>>({});
  const [fps, setFps] = useState(0);
  const [quality, setQuality] = useState<QualityMetrics | null>(null);
  const [qualityHistory, setQualityHistory] = useState<{
    brightness: number[];
    contrast: number[];
    sharpness: number[];
    noise: number[];
    fps: number[];
  }>({ brightness: [], contrast: [], sharpness: [], noise: [], fps: [] });
  const [faceDetectionEnabled, setFaceDetectionEnabled] = useState(false);
  const [faces, setFaces] = useState<DetectedFace[]>([]);
  const [faceModelLoading, setFaceModelLoading] = useState(false);
  const [faceModelError, setFaceModelError] = useState<string>('');
  const [faceCount, setFaceCount] = useState(0);
  const [maxFaces, setMaxFaces] = useState(0);
  const fpsFrameCount = useRef(0);
  const fpsLastTime = useRef(performance.now());
  const animRef = useRef<number>(0);
  const analysisIntervalRef = useRef<ReturnType<typeof setInterval>>(0 as any);

  // Enumerate video devices
  const enumerateDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
    } catch {
      setError('Unable to enumerate devices');
    }
  }, [selectedDevice]);

  // Start camera
  const startCamera = useCallback(
    async (deviceId?: string) => {
      try {
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
        }
        setError('');
        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        };
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
        // Extract camera info
        const track = newStream.getVideoTracks()[0];
        const settings = track.getSettings();
        const capabilities = track.getCapabilities?.() as any;
        setCameraInfo({
          Label: track.label,
          Resolution: `${settings.width} × ${settings.height}`,
          'Frame Rate': `${settings.frameRate} fps`,
          'Facing Mode': settings.facingMode || 'N/A',
          'Aspect Ratio': settings.aspectRatio?.toFixed(2) || 'N/A',
          'Max Resolution': capabilities
            ? `${capabilities.width?.max} × ${capabilities.height?.max}`
            : 'N/A',
        });
      } catch (err: any) {
        setError(err.message || 'Camera access denied');
      }
    },
    [stream],
  );

  // FPS counter
  useEffect(() => {
    if (!stream || !videoRef.current) return;
    const video = videoRef.current;
    const countFps = () => {
      fpsFrameCount.current++;
      const now = performance.now();
      if (now - fpsLastTime.current >= 1000) {
        setFps(fpsFrameCount.current);
        fpsFrameCount.current = 0;
        fpsLastTime.current = now;
      }
      animRef.current = requestAnimationFrame(countFps);
    };
    video.onplay = () => {
      animRef.current = requestAnimationFrame(countFps);
    };
    return () => cancelAnimationFrame(animRef.current);
  }, [stream]);

  // Frame quality analysis (every 500ms to avoid perf issues)
  useEffect(() => {
    if (!stream || !videoRef.current) {
      setQuality(null);
      return;
    }
    const video = videoRef.current;
    const canvas = analysisCanvasRef.current;
    if (!canvas) return;

    analysisIntervalRef.current = setInterval(() => {
      if (video.readyState < 2) return;
      const metrics = analyzeFrame(video, canvas);
      if (metrics) {
        setQuality(metrics);
        setQualityHistory((prev) => {
          const push = (arr: number[], val: number) => {
            const next = [...arr, val];
            return next.length > QUALITY_HISTORY_LENGTH
              ? next.slice(-QUALITY_HISTORY_LENGTH)
              : next;
          };
          return {
            brightness: push(prev.brightness, metrics.brightness),
            contrast: push(prev.contrast, metrics.contrast),
            sharpness: push(prev.sharpness, metrics.sharpness),
            noise: push(prev.noise, metrics.noise),
            fps: push(prev.fps, fps),
          };
        });
      }
    }, 500);

    return () => clearInterval(analysisIntervalRef.current);
  }, [stream, fps]);

  // ─────────────────────────────────────────────────────────────────────────
  // FACE DETECTION EFFECT
  //
  // Runs whenever the camera stream changes or face-detection is toggled.
  //
  // Pipeline (per tick, every 300 ms):
  //
  //  Camera stream
  //      │
  //      ▼
  //  [readyState ≥ 2?] ──No──► skip tick
  //      │ Yes
  //      ▼
  //  faceapi.detectAllFaces(videoElement, TinyFaceDetectorOptions)
  //      │  internally: resize frame → 320×320 → run MobileNet-style convolutions
  //      │              on GPU (WebGL) or CPU → produce candidate bounding boxes
  //      │              → apply Non-Maximum Suppression → return final boxes
  //      ▼
  //  Filter: confidence score ≥ scoreThreshold (0.5 = 50%)
  //      │
  //      ▼
  //  Map raw video coordinates → display coordinates (see drawFaceBoxes)
  //      │
  //      ▼
  //  Render boxes + confidence labels onto transparent overlay canvas
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!stream || !videoRef.current || !faceDetectionEnabled) {
      // Detection disabled or stream stopped — wipe the overlay canvas clean
      const faceCanvas = faceCanvasRef.current;
      if (faceCanvas) {
        const ctx = faceCanvas.getContext('2d');
        ctx?.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
      }
      setFaces([]);
      setFaceCount(0);
      return;
    }

    // `cancelled` is captured by the closures below.
    // Setting it to true in the cleanup function stops in-flight async work
    // and prevents setState calls on an unmounted / re-rendered component.
    let cancelled = false;
    const video = videoRef.current;

    const startDetection = async () => {
      setFaceModelLoading(true);
      setFaceModelError('');

      // Step ① — ensure TF.js + model weights are ready (cached after first load)
      const loaded = await loadFaceApiModels();
      if (!loaded || cancelled) {
        if (!loaded)
          setFaceModelError(
            'Failed to load face detection models. Check browser console for details.',
          );
        setFaceModelLoading(false);
        return;
      }
      setFaceModelLoading(false);

      // Step ② — configure the TinyFaceDetector
      //   inputSize     : the video frame is internally resized to this square
      //                   before inference.  Larger = more accurate, slower.
      //                   Must be a multiple of 32.  320 is a good balance.
      //   scoreThreshold: discard any detection with confidence < 50%
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: 0.5,
      });

      // Step ③ — per-tick detection function (called every 300 ms)
      const detectFaces = async () => {
        // Skip if component unmounted or video not yet buffering frames
        // (readyState < 2 means HAVE_CURRENT_DATA is not yet reached)
        if (cancelled || video.readyState < 2) return;
        try {
          // Runs the full forward pass of TinyFaceDetector on the current frame:
          //   1. Grab the video frame as a tensor
          //   2. Normalize pixel values to [–1, 1]
          //   3. Run 9 depthwise-separable convolution layers (MobileNet-style)
          //   4. Decode anchor-based bounding box predictions
          //   5. Apply Non-Maximum Suppression to remove duplicate boxes
          const detections = await faceapi.detectAllFaces(video, options);
          if (cancelled) return; // component unmounted during the await

          // Flatten detection objects into our lightweight DetectedFace shape.
          // d.box contains raw pixel coordinates in the *original* video frame
          // resolution (e.g. 1280 × 720), not the 320 × 320 internal size.
          const mapped: DetectedFace[] = detections.map((d) => ({
            x: d.box.x,
            y: d.box.y,
            width: d.box.width,
            height: d.box.height,
            score: d.score, // confidence [0, 1] after sigmoid
          }));
          setFaces(mapped);
          setFaceCount(mapped.length);
          setMaxFaces((prev) => Math.max(prev, mapped.length));

          // Step ④ — draw the mapped boxes onto the overlay canvas
          drawFaceBoxes(mapped, video.videoWidth, video.videoHeight);
        } catch {
          // Silently ignore transient TF errors (e.g. context loss)
        }
      };

      // Poll every 300 ms — quick enough to feel real-time without
      // saturating the GPU on lower-end machines.
      faceIntervalRef.current = setInterval(detectFaces, 300);
      detectFaces(); // also run immediately so there is no 300 ms delay on enable
    };

    // ─────────────────────────────────────────────────────────────────────
    // drawFaceBoxes — coordinate mapping + canvas rendering
    //
    // The detector returns bounding boxes in the raw video frame's coordinate
    // space (e.g. x=640, y=200 for a 1280×720 stream).  The video element,
    // however, is displayed with  object-fit: contain  which adds letterboxing
    // or pillarboxing depending on the aspect ratio.
    //
    // We need to transform raw coords → displayed coords:
    //
    //   videoAspect > containerAspect  (wide video in tall box)
    //     renderW = displayW,  renderH = displayW / videoAspect
    //     offsetX = 0,         offsetY = (displayH - renderH) / 2   ← letterbox
    //
    //   videoAspect ≤ containerAspect  (tall video in wide box)
    //     renderH = displayH,  renderW = displayH * videoAspect
    //     offsetX = (displayW - renderW) / 2,  offsetY = 0           ← pillarbox
    //
    //   displayed_x = offsetX + raw_x * (renderW / videoWidth)
    //   displayed_y = offsetY + raw_y * (renderH / videoHeight)
    //
    // Mirror mode is handled purely in CSS (transform: scaleX(-1) on the
    // canvas element), so no coordinate inversion is needed here.
    // ─────────────────────────────────────────────────────────────────────
    const drawFaceBoxes = (faceList: DetectedFace[], vw: number, vh: number) => {
      const canvas = faceCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Always match the overlay canvas size to its container so 1 CSS pixel
      // equals 1 canvas pixel and there is no blurry upscaling.
      const wrapper = canvas.parentElement;
      if (!wrapper) return;
      const displayW = wrapper.clientWidth;
      const displayH = wrapper.clientHeight;
      canvas.width = displayW;
      canvas.height = displayH;

      ctx.clearRect(0, 0, displayW, displayH); // erase previous frame's boxes

      // ── Compute the rendered video region inside the container ──────────
      // object-fit: contain scales the video uniformly and centers it.
      const videoAspect = vw / vh;
      const containerAspect = displayW / displayH;
      let renderW: number, renderH: number, offsetX: number, offsetY: number;
      if (videoAspect > containerAspect) {
        // Video is wider than the container → pillarbox top/bottom
        renderW = displayW;
        renderH = displayW / videoAspect;
        offsetX = 0;
        offsetY = (displayH - renderH) / 2; // vertical centering offset
      } else {
        // Video is taller than the container → letterbox left/right
        renderH = displayH;
        renderW = displayH * videoAspect;
        offsetX = (displayW - renderW) / 2; // horizontal centering offset
        offsetY = 0;
      }

      // Scale factors:  displayed_pixels = raw_pixels × scale
      const scaleX = renderW / vw;
      const scaleY = renderH / vh;

      faceList.forEach((face, i) => {
        // Convert raw video coords to display coords
        const fx = offsetX + face.x * scaleX;
        const fy = offsetY + face.y * scaleY;
        const fw = face.width * scaleX;
        const fh = face.height * scaleY;

        // ── Solid bounding box ────────────────────────────────────────────
        ctx.strokeStyle = '#52c41a';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.strokeRect(fx, fy, fw, fh);

        // ── Corner accent marks (L-shaped brackets at each corner) ────────
        const cornerLen = Math.min(fw, fh) * 0.2;
        ctx.strokeStyle = '#52c41a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(fx, fy + cornerLen);
        ctx.lineTo(fx, fy);
        ctx.lineTo(fx + cornerLen, fy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(fx + fw - cornerLen, fy);
        ctx.lineTo(fx + fw, fy);
        ctx.lineTo(fx + fw, fy + cornerLen);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(fx, fy + fh - cornerLen);
        ctx.lineTo(fx, fy + fh);
        ctx.lineTo(fx + cornerLen, fy + fh);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(fx + fw - cornerLen, fy + fh);
        ctx.lineTo(fx + fw, fy + fh);
        ctx.lineTo(fx + fw, fy + fh - cornerLen);
        ctx.stroke();

        // Label with confidence
        const label = `Face ${i + 1} (${Math.round(face.score * 100)}%)`;
        ctx.font = 'bold 12px sans-serif';
        const textW = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(82, 196, 26, 0.85)';
        ctx.fillRect(fx, fy - 20, textW + 8, 20);
        ctx.fillStyle = '#fff';
        ctx.fillText(label, fx + 4, fy - 6);
      });
    };

    startDetection();

    return () => {
      cancelled = true;
      clearInterval(faceIntervalRef.current);
    };
  }, [stream, faceDetectionEnabled]);

  // Auto-start
  useEffect(() => {
    enumerateDevices();
  }, []);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(animRef.current);
      clearInterval(analysisIntervalRef.current);
      clearInterval(faceIntervalRef.current);
    };
  }, [stream]);

  // ── Highcharts options ──────────────────────────────────
  const histogramOptions = useMemo<Highcharts.Options>(() => {
    if (!quality) return {};
    return {
      chart: { height: 180, spacing: [5, 5, 5, 5], backgroundColor: 'transparent' },
      title: { text: '' },
      xAxis: {
        labels: { enabled: false },
        title: { text: '' },
        gridLineWidth: 0,
      },
      yAxis: {
        labels: { enabled: false },
        title: { text: '' },
        gridLineWidth: 0,
      },
      legend: { enabled: false },
      credits: { enabled: false },
      tooltip: { enabled: false },
      plotOptions: {
        areaspline: {
          fillOpacity: 0.25,
          lineWidth: 1.5,
          marker: { enabled: false },
          animation: false,
        },
      },
      series: [
        { type: 'areaspline', name: 'Red', data: quality.rHistogram, color: '#ff4d4f' },
        { type: 'areaspline', name: 'Green', data: quality.gHistogram, color: '#52c41a' },
        { type: 'areaspline', name: 'Blue', data: quality.bHistogram, color: '#1677ff' },
      ],
    };
  }, [quality]);

  const timeSeriesOptions = useMemo<Highcharts.Options>(() => {
    return {
      chart: { height: 200, spacing: [10, 10, 10, 10], backgroundColor: 'transparent' },
      title: { text: '' },
      xAxis: {
        labels: { enabled: false },
        title: { text: '' },
        gridLineWidth: 0,
        tickWidth: 0,
      },
      yAxis: {
        min: 0,
        max: 100,
        title: { text: '' },
        gridLineColor: 'rgba(128,128,128,0.15)',
        labels: { style: { fontSize: '10px' } },
      },
      legend: {
        align: 'center',
        verticalAlign: 'bottom',
        itemStyle: { fontSize: '11px' },
      },
      credits: { enabled: false },
      tooltip: {
        shared: true,
        valueSuffix: '',
        headerFormat: '',
      },
      plotOptions: {
        spline: {
          lineWidth: 2,
          marker: { enabled: false },
          animation: false,
        },
      },
      series: [
        {
          type: 'spline',
          name: 'Brightness',
          data: qualityHistory.brightness.map((v) => Math.round((v / 255) * 100)),
          color: '#faad14',
        },
        {
          type: 'spline',
          name: 'Contrast',
          data: qualityHistory.contrast.map(Math.round),
          color: '#1677ff',
        },
        {
          type: 'spline',
          name: 'Sharpness',
          data: qualityHistory.sharpness.map(Math.round),
          color: '#52c41a',
        },
        {
          type: 'spline',
          name: 'Noise',
          data: qualityHistory.noise.map(Math.round),
          color: '#ff4d4f',
        },
      ],
    };
  }, [qualityHistory]);

  const fpsChartOptions = useMemo<Highcharts.Options>(() => {
    return {
      chart: { height: 140, spacing: [10, 10, 5, 10], backgroundColor: 'transparent' },
      title: { text: '' },
      xAxis: {
        labels: { enabled: false },
        title: { text: '' },
        gridLineWidth: 0,
        tickWidth: 0,
      },
      yAxis: {
        min: 0,
        title: { text: '' },
        gridLineColor: 'rgba(128,128,128,0.15)',
        labels: { style: { fontSize: '10px' } },
      },
      legend: { enabled: false },
      credits: { enabled: false },
      tooltip: { valueSuffix: ' fps', headerFormat: '' },
      plotOptions: {
        area: {
          fillOpacity: 0.15,
          lineWidth: 2,
          marker: { enabled: false },
          animation: false,
        },
      },
      series: [{ type: 'area', name: 'FPS', data: qualityHistory.fps, color: '#722ed1' }],
    };
  }, [qualityHistory.fps]);

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    if (mirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    const link = document.createElement('a');
    link.download = `camera-snapshot-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const toggleRecording = () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    if (!stream) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedUrl(URL.createObjectURL(blob));
    };
    mr.start();
    mediaRecorderRef.current = mr;
    setRecording(true);
  };

  const downloadRecording = () => {
    if (!recordedUrl) return;
    const a = document.createElement('a');
    a.href = recordedUrl;
    a.download = `camera-recording-${Date.now()}.webm`;
    a.click();
  };

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId);
    startCamera(deviceId);
  };

  return (
    <div className="camera-test">
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <VideoCameraOutlined />
                Camera Preview
                {stream && <Tag color="green">{fps} FPS</Tag>}
              </Space>
            }
            extra={
              <Space>
                <Switch
                  checkedChildren="Face Detection"
                  unCheckedChildren="No Detection"
                  checked={faceDetectionEnabled}
                  onChange={setFaceDetectionEnabled}
                  loading={faceModelLoading}
                />
                <Switch
                  checkedChildren="Mirror"
                  unCheckedChildren="Normal"
                  checked={mirrored}
                  onChange={setMirrored}
                />
              </Space>
            }
          >
            {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

            <div className="camera-preview-wrapper">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
                style={{ transform: mirrored ? 'scaleX(-1)' : 'none' }}
              />
              {!stream && !error && (
                <div className="camera-placeholder">
                  <VideoCameraOutlined style={{ fontSize: 64, opacity: 0.3 }} />
                  <Text type="secondary" style={{ marginTop: 16 }}>
                    Click &quot;Start Camera&quot; to begin testing
                  </Text>
                </div>
              )}
              {recording && <div className="recording-indicator">● REC</div>}
              {faceDetectionEnabled && stream && (
                <canvas
                  ref={faceCanvasRef}
                  className="camera-face-overlay"
                  style={{ transform: mirrored ? 'scaleX(-1)' : 'none' }}
                />
              )}
              {faceDetectionEnabled && stream && faceCount > 0 && (
                <div
                  className="camera-face-count-badge"
                  style={mirrored ? { left: 'auto', right: 16 } : undefined}
                >
                  <EyeOutlined /> {faceCount} face{faceCount !== 1 ? 's' : ''}
                </div>
              )}
              {faceModelLoading && (
                <div
                  className="camera-face-loading-badge"
                  style={mirrored ? { left: 'auto', right: 16 } : undefined}
                >
                  Loading face detection model...
                </div>
              )}
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <canvas ref={analysisCanvasRef} style={{ display: 'none' }} />

            <div style={{ marginTop: 16 }}>
              <Space wrap>
                <Select
                  style={{ width: 300 }}
                  placeholder="Select camera"
                  value={selectedDevice || undefined}
                  onChange={handleDeviceChange}
                  options={devices.map((d) => ({
                    label: d.label || `Camera ${d.deviceId.slice(0, 8)}`,
                    value: d.deviceId,
                  }))}
                />
                {!stream ? (
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={() => startCamera(selectedDevice)}
                  >
                    Start Camera
                  </Button>
                ) : (
                  <Button
                    danger
                    icon={<StopOutlined />}
                    onClick={() => {
                      stream.getTracks().forEach((t) => t.stop());
                      setStream(null);
                      setCameraInfo({});
                    }}
                  >
                    Stop Camera
                  </Button>
                )}
                <Button icon={<CameraOutlined />} onClick={takeSnapshot} disabled={!stream}>
                  Snapshot
                </Button>
                <Button
                  icon={recording ? <StopOutlined /> : <VideoCameraOutlined />}
                  onClick={toggleRecording}
                  disabled={!stream}
                  danger={recording}
                >
                  {recording ? 'Stop Recording' : 'Record'}
                </Button>
                {recordedUrl && (
                  <Button icon={<DownloadOutlined />} onClick={downloadRecording}>
                    Download Recording
                  </Button>
                )}
              </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Card title="Camera Information" size="small">
              {Object.keys(cameraInfo).length > 0 ? (
                <Descriptions column={1} size="small" bordered>
                  {Object.entries(cameraInfo).map(([key, val]) => (
                    <Descriptions.Item label={key} key={key}>
                      {val}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              ) : (
                <Text type="secondary">Start camera to see device information</Text>
              )}
            </Card>

            {faceDetectionEnabled && stream && (
              <Card
                title={
                  <Space>
                    <EyeOutlined />
                    Face Detection
                    {faceCount > 0 && <Tag color="green">{faceCount} detected</Tag>}
                    {faceModelLoading && <Tag color="processing">Loading model...</Tag>}
                  </Space>
                }
                size="small"
              >
                {faceModelError ? (
                  <Alert
                    message="Face Detection Error"
                    description={faceModelError}
                    type="error"
                    showIcon
                  />
                ) : faceModelLoading ? (
                  <Text type="secondary">
                    Loading TinyFaceDetector model... This may take a moment on first use.
                  </Text>
                ) : faceCount === 0 ? (
                  <Text type="secondary">
                    No faces detected. Make sure your face is visible in the camera.
                  </Text>
                ) : (
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="Faces Found">
                      <Tag color="green">{faceCount}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Max Seen">
                      <Tag color="blue">{maxFaces}</Tag>
                    </Descriptions.Item>
                    {faces.map((face, i) => (
                      <Descriptions.Item label={`Face ${i + 1}`} key={i}>
                        <Text code style={{ fontSize: 11 }}>
                          {Math.round(face.width)}×{Math.round(face.height)}px
                        </Text>{' '}
                        at ({Math.round(face.x)}, {Math.round(face.y)})
                        <Tag color="green" style={{ marginLeft: 4, fontSize: 10 }}>
                          {Math.round(face.score * 100)}%
                        </Tag>
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                )}
              </Card>
            )}

            {quality && (
              <Card title="Image Quality" size="small">
                <div className="camera-quality-metrics">
                  {[
                    {
                      label: 'Brightness',
                      value: quality.brightness,
                      max: 255,
                      percent: Math.round((quality.brightness / 255) * 100),
                      rating: rateMetric(quality.brightness, 60, 200),
                      tooltip:
                        'Average luminance of the frame. Too dark (<60) or too bright (>200) is flagged.',
                      color: '#faad14',
                    },
                    {
                      label: 'Contrast',
                      value: quality.contrast,
                      max: 100,
                      percent: Math.round(quality.contrast),
                      rating: rateMetric(quality.contrast, 15, 90),
                      tooltip: 'Standard deviation of luminance. Low means flat/washed out image.',
                      color: '#1677ff',
                    },
                    {
                      label: 'Saturation',
                      value: quality.saturation,
                      max: 100,
                      percent: Math.round(quality.saturation),
                      rating: rateMetric(quality.saturation, 10, 85),
                      tooltip: 'Average color saturation. Low means desaturated/gray image.',
                      color: '#eb2f96',
                    },
                    {
                      label: 'Sharpness',
                      value: quality.sharpness,
                      max: 100,
                      percent: Math.round(quality.sharpness),
                      rating: rateMetric(quality.sharpness, 10, 101),
                      tooltip: 'Edge detection via Laplacian. Low means blurry image.',
                      color: '#52c41a',
                    },
                    {
                      label: 'Noise',
                      value: quality.noise,
                      max: 100,
                      percent: Math.round(quality.noise),
                      rating: rateMetric(100 - quality.noise, 30, 101),
                      tooltip: 'Local variance estimation. High means noisy/grainy image.',
                      color: '#ff4d4f',
                    },
                  ].map((m) => (
                    <div key={m.label} className="camera-metric-row">
                      <div className="camera-metric-header">
                        <Tooltip title={m.tooltip}>
                          <Text strong style={{ fontSize: 12 }}>
                            {m.label}
                          </Text>
                        </Tooltip>
                        <Space size={4}>
                          <Tag
                            color={m.rating.color === '#52c41a' ? 'success' : 'error'}
                            style={{ margin: 0, fontSize: 10 }}
                          >
                            {m.rating.label}
                          </Tag>
                          <Text code style={{ fontSize: 11 }}>
                            {m.percent}%
                          </Text>
                        </Space>
                      </div>
                      <Progress
                        percent={m.percent}
                        showInfo={false}
                        strokeColor={m.color}
                        size="small"
                      />
                    </div>
                  ))}

                  <div className="camera-metric-row" style={{ marginTop: 8 }}>
                    <div className="camera-metric-header">
                      <Tooltip title="Estimated correlated color temperature based on RGB ratios">
                        <Text strong style={{ fontSize: 12 }}>
                          Color Temp
                        </Text>
                      </Tooltip>
                      <Text code style={{ fontSize: 11 }}>
                        ~{quality.colorTemp}K
                      </Text>
                    </div>
                    <div className="camera-color-temp-bar">
                      <div
                        className="camera-color-temp-indicator"
                        style={{
                          left: `${((quality.colorTemp - 2000) / 10000) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="camera-color-temp-labels">
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        Warm 2000K
                      </Text>
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        Cool 12000K
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </Space>
        </Col>
      </Row>

      {/* ── Charts row ────────────────────────────────────── */}
      {stream && quality && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <Card title="RGB Histogram" size="small">
              <HighchartsReact highcharts={Highcharts} options={histogramOptions} />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Quality Over Time" size="small">
              <HighchartsReact highcharts={Highcharts} options={timeSeriesOptions} />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="FPS Over Time" size="small">
              <HighchartsReact highcharts={Highcharts} options={fpsChartOptions} />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Quality Summary" size="small">
              <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
                <Descriptions.Item label="Overall">
                  {(() => {
                    const score = Math.round(
                      (quality.brightness > 60 && quality.brightness < 200 ? 25 : 5) +
                        (quality.contrast > 15 ? 25 : 10) +
                        (quality.sharpness > 10 ? 25 : 10) +
                        (quality.noise < 50 ? 25 : 5),
                    );
                    return (
                      <Tag color={score >= 80 ? 'success' : score >= 50 ? 'warning' : 'error'}>
                        {score >= 80 ? 'Excellent' : score >= 50 ? 'Acceptable' : 'Poor'} ({score}
                        /100)
                      </Tag>
                    );
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="Brightness">
                  {quality.brightness < 60
                    ? '⚠️ Too dark – improve lighting'
                    : quality.brightness > 200
                      ? '⚠️ Overexposed – reduce light'
                      : '✅ Good exposure'}
                </Descriptions.Item>
                <Descriptions.Item label="Focus">
                  {quality.sharpness < 10
                    ? '⚠️ Blurry – check focus'
                    : quality.sharpness < 30
                      ? '⚠️ Slightly soft'
                      : '✅ Sharp'}
                </Descriptions.Item>
                <Descriptions.Item label="Noise">
                  {quality.noise > 60
                    ? '⚠️ Very noisy – improve lighting'
                    : quality.noise > 30
                      ? '⚠️ Some noise detected'
                      : '✅ Clean image'}
                </Descriptions.Item>
                <Descriptions.Item label="Color">
                  {quality.saturation < 10
                    ? '⚠️ Very desaturated'
                    : quality.saturation > 85
                      ? '⚠️ Oversaturated'
                      : '✅ Good color'}
                </Descriptions.Item>
                <Descriptions.Item label="Temperature">
                  {quality.colorTemp < 3500
                    ? '🔶 Very warm (indoor/tungsten)'
                    : quality.colorTemp > 7500
                      ? '🔷 Very cool (shade/overcast)'
                      : '✅ Neutral'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      )}

      {/* ── Documentation ────────────────────────────────── */}
      <Divider />
      <Collapse
        ghost
        items={[
          {
            key: 'docs',
            label: (
              <Space>
                <InfoCircleOutlined />
                <Text strong>How This Page Works</Text>
              </Space>
            ),
            children: (
              <div className="camera-docs">
                <Title level={5}>Camera Test Overview</Title>
                <Paragraph>
                  This page lets you test your webcam or external camera in real-time. It provides a
                  live preview, device selection, mirroring, snapshot &amp; video recording, image
                  quality analysis with interactive charts, and AI-powered face detection.
                </Paragraph>

                <Title level={5}>Mirror vs Normal Mode</Title>
                <Paragraph>
                  <strong>Mirror mode</strong> (default) flips the video horizontally so it behaves
                  like a real mirror — when you move left, the image moves left. This is the
                  standard for video calls and selfies. <strong>Normal mode</strong> shows the raw
                  camera feed without any flip — how others actually see you. The face detection
                  overlay automatically syncs with whichever mode you choose, so bounding boxes
                  always align with the visible faces.
                </Paragraph>

                <Title level={5}>Face Detection — How It Works</Title>
                <Paragraph>
                  Face detection uses the <Text code>@vladmandic/face-api</Text> library, a
                  maintained fork of <Text code>face-api.js</Text> built on top of TensorFlow.js. It
                  runs entirely in the browser — no images are sent to any server.
                </Paragraph>
                <Paragraph>
                  <strong>Model:</strong> We use the <Text code>TinyFaceDetector</Text> model, a
                  lightweight real-time face detector inspired by the &quot;Tiny YOLOv2&quot;
                  architecture. It is a quantized model (~190 KB) designed for fast inference on
                  low-end devices.
                </Paragraph>
                <Paragraph>
                  <strong>Detection pipeline:</strong>
                </Paragraph>

                {/* ── Visual pipeline flowchart ── */}
                <div className="face-pipeline">
                  <div className="face-pipeline-step step-camera">
                    <div className="step-icon">📷</div>
                    <div className="step-name">Camera Stream</div>
                    <div className="step-detail">getUserMedia()</div>
                    <div className="step-detail">live video frames</div>
                  </div>
                  <div className="face-pipeline-arrow">→</div>

                  <div className="face-pipeline-step step-backend">
                    <div className="step-badge">TF.js</div>
                    <div className="step-icon">⚡</div>
                    <div className="step-name">Backend Init</div>
                    <div className="step-detail">WebGL (GPU)</div>
                    <div className="step-detail">↳ CPU fallback</div>
                  </div>
                  <div className="face-pipeline-arrow">→</div>

                  <div className="face-pipeline-step step-model">
                    <div className="step-badge">~190 KB</div>
                    <div className="step-icon">🧠</div>
                    <div className="step-name">Load Model</div>
                    <div className="step-detail">TinyFaceDetector</div>
                    <div className="step-detail">quantized weights</div>
                  </div>
                  <div className="face-pipeline-arrow">→</div>

                  <div className="face-pipeline-step step-sample">
                    <div className="step-badge">300 ms</div>
                    <div className="step-icon">🎞️</div>
                    <div className="step-name">Frame Sample</div>
                    <div className="step-detail">resize → 320×320</div>
                    <div className="step-detail">normalize [−1, 1]</div>
                  </div>
                  <div className="face-pipeline-arrow">→</div>

                  <div className="face-pipeline-step step-infer">
                    <div className="step-badge">Tiny YOLOv2</div>
                    <div className="step-icon">🔍</div>
                    <div className="step-name">Inference</div>
                    <div className="step-detail">9 conv layers</div>
                    <div className="step-detail">+ NMS</div>
                  </div>
                  <div className="face-pipeline-arrow">→</div>

                  <div className="face-pipeline-step step-filter">
                    <div className="step-badge">≥ 50%</div>
                    <div className="step-icon">✅</div>
                    <div className="step-name">Confidence Filter</div>
                    <div className="step-detail">drop weak</div>
                    <div className="step-detail">detections</div>
                  </div>
                  <div className="face-pipeline-arrow">→</div>

                  <div className="face-pipeline-step step-coords">
                    <div className="step-icon">📐</div>
                    <div className="step-name">Map Coords</div>
                    <div className="step-detail">raw px → display px</div>
                    <div className="step-detail">contain + offset</div>
                  </div>
                  <div className="face-pipeline-arrow">→</div>

                  <div className="face-pipeline-step step-overlay">
                    <div className="step-icon">🖼️</div>
                    <div className="step-name">Canvas Overlay</div>
                    <div className="step-detail">boxes + labels</div>
                    <div className="step-detail">mirror-aware</div>
                  </div>
                </div>

                <ol>
                  <li>
                    <strong>Backend initialization</strong> — TensorFlow.js initializes a compute
                    backend (WebGL preferred, CPU fallback). WebGL uses the GPU for matrix
                    operations which makes detection significantly faster.
                  </li>
                  <li>
                    <strong>Model loading</strong> — The TinyFaceDetector weights are fetched from a
                    JSON manifest + binary shard file. We try the local server first (
                    <Text code>/models/face-api</Text>), then fall back to a CDN.
                  </li>
                  <li>
                    <strong>Frame sampling</strong> — Every 300 ms, the current video frame is
                    passed to <Text code>faceapi.detectAllFaces()</Text>. The input is resized to
                    320×320 internally for fast processing.
                  </li>
                  <li>
                    <strong>Confidence thresholding</strong> — Only detections with a confidence
                    score ≥ 50% are kept. Each result includes a bounding box (x, y, width, height)
                    and a confidence score.
                  </li>
                  <li>
                    <strong>Overlay rendering</strong> — Detected boxes are drawn on a transparent
                    canvas overlaid on the video. The canvas respects the video&apos;s
                    <Text code>object-fit: contain</Text> layout and mirror state, so boxes always
                    align precisely with the corresponding faces.
                  </li>
                </ol>
                <Paragraph>
                  <strong>Coordinate mapping:</strong> The detector returns coordinates in the raw
                  video resolution (e.g., 1280×720). Since the video is displayed with
                  <Text code>object-fit: contain</Text>, the overlay canvas calculates scale factors
                  and offsets to map raw coordinates to the displayed region. In mirror mode, the
                  canvas is simply flipped with <Text code>transform: scaleX(-1)</Text>, so no
                  manual coordinate inversion is needed.
                </Paragraph>

                <Title level={5}>Image Quality Metrics</Title>
                <Paragraph>
                  Quality analysis runs every 500 ms on a downsampled (25%) snapshot of the video
                  frame. Metrics include:
                </Paragraph>
                <ul>
                  <li>
                    <strong>Brightness</strong> — Average luminance (Y = 0.299R + 0.587G + 0.114B).
                    Ideal range: 60–200 out of 255.
                  </li>
                  <li>
                    <strong>Contrast</strong> — Standard deviation of luminance values. Higher means
                    wider dynamic range.
                  </li>
                  <li>
                    <strong>Saturation</strong> — Average HSL saturation across all pixels. Low
                    values indicate a washed-out or grayscale image.
                  </li>
                  <li>
                    <strong>Sharpness</strong> — Laplacian variance: a second-derivative edge
                    detector. High variance = sharp edges = in-focus image.
                  </li>
                  <li>
                    <strong>Noise</strong> — Average local variance in 3×3 patches. High values
                    suggest sensor noise (common in low light).
                  </li>
                  <li>
                    <strong>Color Temperature</strong> — Estimated CCT (Kelvin) from the red/blue
                    channel ratio. Warm (&lt;3500 K) = indoor tungsten; cool (&gt;7500 K) =
                    daylight/shade.
                  </li>
                </ul>

                <Title level={5}>Charts</Title>
                <Paragraph>
                  <strong>RGB Histogram</strong> shows the per-channel pixel intensity distribution
                  (256 bins). <strong>Quality Over Time</strong> plots brightness, contrast,
                  saturation, sharpness, and noise over the last 60 samples.
                  <strong> FPS Over Time</strong> tracks the rendering frame rate.
                </Paragraph>

                <Title level={5}>Privacy</Title>
                <Paragraph>
                  Everything runs locally in your browser. No video frames, images, or face data are
                  transmitted to any external server. The face detection model runs on-device via
                  TensorFlow.js (WebGL/CPU).
                </Paragraph>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default CameraTest;
