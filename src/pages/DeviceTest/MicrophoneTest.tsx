import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Progress,
  Row,
  Select,
  Slider,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  AudioOutlined,
  DownloadOutlined,
  PlayCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

const MicrophoneTest: React.FC = () => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string>('');
  const [volume, setVolume] = useState(0);
  const [peakVolume, setPeakVolume] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string>('');
  const [micInfo, setMicInfo] = useState<Record<string, string>>({});
  const [sensitivity, setSensitivity] = useState(1);

  // ── Refs for all audio objects ────────────────────────────────────────────
  // We use refs (not state) for the audio pipeline objects so the rAF draw loop
  // always reads the latest values without stale-closure issues.
  // If these were state, every setState call inside the loop would re-render the
  // component and potentially restart the loop or capture outdated values.
  const streamRef = useRef<MediaStream | null>(null); // raw microphone stream
  const analyserRef = useRef<AnalyserNode | null>(null); // Web Audio analyser node
  const audioCtxRef = useRef<AudioContext | null>(null); // Web Audio context
  const animRef = useRef<number>(0); // rAF handle for cancellation
  const mediaRecorderRef = useRef<MediaRecorder | null>(null); // for audio recording
  const chunksRef = useRef<Blob[]>([]); // recorded audio chunks
  const canvasRef = useRef<HTMLCanvasElement>(null); // visualizer canvas element
  // sensitivityRef mirrors the sensitivity slider value so the rAF loop can
  // read the latest value every frame without being recreated on each change.
  const sensitivityRef = useRef(sensitivity);
  // peakRef holds the highest volume seen in the current session so we never
  // need to read React state (which could be stale) inside the loop.
  const peakRef = useRef(0);

  // Sync sensitivityRef whenever the slider changes — O(1), no loop restart needed
  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  // ── Draw loop ─────────────────────────────────────────────────────────────
  // This effect starts the requestAnimationFrame loop when the mic becomes active
  // and cleans it up when the mic is stopped (isActive → false).
  //
  // Why trigger via `isActive` state instead of calling directly in startMic?
  // Because startMic is an async function. When it sets analyserRef.current and
  // then immediately calls drawWaveform(), React hasn't re-rendered yet and the
  // canvas might not have been updated in the DOM. By setting isActive=true and
  // letting this effect run, we guarantee all refs are set and the canvas is
  // mounted before we start drawing.
  useEffect(() => {
    if (!isActive) return;

    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;

    const ctx = canvas.getContext('2d')!;

    // fftSize = 2048 means we get 2048 time-domain samples per frame.
    // frequencyBinCount = fftSize / 2 = 1024 frequency bins.
    const bufferLength = analyser.fftSize;
    // dataArray: time-domain — raw audio samples, each value 0-255 (128 = silence)
    const dataArray = new Uint8Array(bufferLength);
    // freqArray: frequency-domain — energy per frequency bin, 0-255 (255 = loudest)
    const freqArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      // Schedule next frame first so we keep ~60fps even if the rest of the
      // function takes a variable amount of time.
      animRef.current = requestAnimationFrame(draw);

      // Pull fresh audio data into our pre-allocated arrays each frame.
      // These are in-place fills — no allocation happens here.
      analyser.getByteTimeDomainData(dataArray); // waveform shape
      analyser.getByteFrequencyData(freqArray); // spectrum bars

      // ── Volume (RMS) ──────────────────────────────────────────────────
      // Root Mean Square gives a perceptual loudness value:
      //   1. Normalize each sample from 0-255 to -1..+1  (128 = 0)
      //   2. Square it  (makes negatives positive, emphasises peaks)
      //   3. Average, then sqrt  → RMS in range 0..1
      //   4. Scale to 0-100 and apply sensitivity multiplier
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = (dataArray[i] - 128) / 128; // center around 0
        sum += v * v;
      }
      const rms = Math.sqrt(sum / bufferLength);
      const vol = Math.min(100, Math.round(rms * 200 * sensitivityRef.current));
      setVolume(vol);
      // Only update peak when a new maximum is reached — never goes down until reset
      if (vol > peakRef.current) {
        peakRef.current = vol;
        setPeakVolume(vol);
      }

      // ── Canvas rendering ──────────────────────────────────────────────
      const W = canvas.width; // intrinsic pixel width (800)
      const H = canvas.height; // intrinsic pixel height (200)

      // Clear with dark background each frame
      ctx.fillStyle = '#141414';
      ctx.fillRect(0, 0, W, H);

      // ── Layer 1: Frequency bars (drawn first, behind the waveform) ────
      // Each bar represents one frequency bin (0 = bass, 1023 = treble).
      // Height = how loud that frequency is. Color shifts blue→cyan→green
      // as frequency increases (hue 0→240 = blue range of HSL color wheel).
      const barW = Math.ceil((W / analyser.frequencyBinCount) * 2.5);
      let x = 0;
      for (let i = 0; i < analyser.frequencyBinCount; i++) {
        const barH = (freqArray[i] / 255) * H * 0.85; // scale bar height to canvas
        const hue = (i / analyser.frequencyBinCount) * 240; // low freq = blue, high = green
        ctx.fillStyle = `hsl(${hue}, 90%, 55%)`;
        ctx.fillRect(x, H - barH, barW, barH); // draw upward from the bottom
        x += barW + 1;
        if (x > W) break; // stop once we've filled the canvas width
      }

      // ── Layer 2: Waveform line (drawn on top of bars) ─────────────────
      // Each sample in dataArray maps to one X pixel slice.
      // Value 128/255 ≈ 0.5 → middle of canvas (silence = flat center line).
      // Values above 128 → above center; below 128 → below center.
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; // white semi-transparent
      ctx.beginPath();
      const sliceW = W / bufferLength; // pixels per sample
      let wx = 0;
      for (let i = 0; i < bufferLength; i++) {
        const y = (dataArray[i] / 255) * H; // map 0-255 → 0-canvas height
        i === 0 ? ctx.moveTo(wx, y) : ctx.lineTo(wx, y);
        wx += sliceW;
      }
      ctx.stroke();
    };

    draw(); // kick off the loop

    // Cleanup: when isActive becomes false (mic stopped), cancel the loop
    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [isActive]);

  // ── Device enumeration ────────────────────────────────────────────────────
  // Called once on mount. enumerateDevices() lists all media input/output devices.
  // We filter for 'audioinput' (microphones only) and pre-select the first one.
  // Note: device labels are empty strings until the user has granted mic permission
  // at least once — that's why we show deviceId as a fallback label.
  useEffect(() => {
    const enumerate = async () => {
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        const audio = all.filter((d) => d.kind === 'audioinput');
        setDevices(audio);
        if (audio.length > 0) setSelectedDevice(audio[0].deviceId);
      } catch {
        setError('Unable to enumerate audio devices');
      }
    };
    enumerate();
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  // Runs when the component is removed from the DOM (e.g. user navigates away).
  // We must stop the mic track and close the AudioContext to release the
  // microphone hardware and avoid the browser's "mic in use" indicator lingering.
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
    };
  }, []);

  const startMic = async (deviceId?: string) => {
    try {
      // ── Tear down any existing session first ──────────────────────────
      // If the user clicks Start a second time (e.g. after switching device),
      // we must cancel the running rAF loop and stop the old stream tracks
      // before creating new ones, otherwise they pile up and the old mic stays open.
      cancelAnimationFrame(animRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
      analyserRef.current = null;
      setIsActive(false); // stops the draw-loop effect
      setError('');
      peakRef.current = 0;
      setPeakVolume(0);
      setVolume(0);

      // ── Request microphone access ─────────────────────────────────────
      // getUserMedia shows the browser permission prompt if not yet granted.
      // Passing { exact: deviceId } targets a specific mic; without it the
      // browser picks the default input.
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      });
      streamRef.current = newStream;

      // ── Build the Web Audio processing chain ──────────────────────────
      // AudioContext is the container for all Web Audio nodes.
      // IMPORTANT: browsers auto-suspend AudioContext when it is not created
      // in a direct (synchronous) user-gesture handler. Because we are after
      // an `await`, the gesture context may be lost, so we explicitly resume().
      const audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') await audioCtx.resume();

      // MediaStreamSource wraps the raw mic stream so it can feed into the graph
      const source = audioCtx.createMediaStreamSource(newStream);

      // AnalyserNode: reads audio data without modifying or outputting it.
      // fftSize controls frequency resolution (larger = more detail, more cost).
      // smoothingTimeConstant (0-1): how much previous frames blend into the
      // current one — higher = smoother bars, lower = more reactive.
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;

      // Connect: source → analyser (analyser is not connected to destination,
      // so audio is analysed silently — you won't hear yourself)
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      // ── Collect mic metadata ───────────────────────────────────────────
      // getSettings() returns the actual constraints that the browser applied
      // (may differ from what was requested — e.g. browser may override sampleRate).
      const track = newStream.getAudioTracks()[0];
      const s = track.getSettings();
      setMicInfo({
        Label: track.label || 'Unknown',
        'Sample Rate': `${s.sampleRate ?? audioCtx.sampleRate} Hz`,
        'Channel Count': String(s.channelCount ?? 'N/A'),
        'Echo Cancellation': s.echoCancellation ? 'Enabled' : 'Disabled',
        'Noise Suppression': (s as any).noiseSuppression ? 'Enabled' : 'Disabled',
        'Auto Gain Control': (s as any).autoGainControl ? 'Enabled' : 'Disabled',
      });

      // ── Start the draw loop ────────────────────────────────────────────
      // Setting isActive=true triggers the useEffect above. We do this LAST
      // so all refs are fully populated before the effect reads them.
      setIsActive(true);
    } catch (err: any) {
      setError(err.message || 'Microphone access denied');
    }
  };

  // Stops the mic, closes audio context, cancels the animation loop, and
  // clears the canvas back to blank.
  const stopMic = () => {
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
    streamRef.current = null;
    analyserRef.current = null;
    setIsActive(false);
    setVolume(0);
    setPeakVolume(0);
    peakRef.current = 0;
    setMicInfo({});

    // clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // ── Recording ─────────────────────────────────────────────────────────────
  // MediaRecorder taps the same stream the analyser uses and writes encoded
  // audio (webm/opus) into Blob chunks. When stopped, we combine the chunks into
  // a single Blob and create an object URL for playback/download.
  const toggleRecording = () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    const stream = streamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
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
    a.download = `mic-recording-${Date.now()}.webm`;
    a.click();
  };

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId);
    if (isActive) startMic(deviceId);
  };

  const getVolumeColor = () => {
    if (volume > 70) return '#ff4d4f';
    if (volume > 40) return '#faad14';
    return '#52c41a';
  };

  return (
    <div className="microphone-test">
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <AudioOutlined />
                Microphone Test
                {isActive && <Tag color="green">Active</Tag>}
                {recording && <Tag color="red">● Recording</Tag>}
              </Space>
            }
          >
            {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

            <div className="mic-visualizer">
              <canvas
                ref={canvasRef}
                width={800}
                height={200}
                style={{
                  width: '100%',
                  height: 200,
                  borderRadius: 8,
                  border: '1px solid #303030',
                  backgroundColor: '#141414',
                }}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <Row gutter={16} align="middle">
                <Col span={12}>
                  <Text strong>Volume Level</Text>
                  <Progress
                    percent={volume}
                    strokeColor={getVolumeColor()}
                    status="active"
                    format={(p) => `${p}%`}
                  />
                </Col>
                <Col span={12}>
                  <Text strong>Peak Volume</Text>
                  <Progress percent={peakVolume} strokeColor="#1677ff" format={(p) => `${p}%`} />
                </Col>
              </Row>
            </div>

            <div style={{ marginTop: 16 }}>
              <Text strong>Sensitivity</Text>
              <Slider
                min={0.5}
                max={5}
                step={0.1}
                value={sensitivity}
                onChange={setSensitivity}
                marks={{ 0.5: 'Low', 1: 'Normal', 3: 'High', 5: 'Max' }}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <Space wrap>
                <Select
                  style={{ width: 300 }}
                  placeholder="Select microphone"
                  value={selectedDevice || undefined}
                  onChange={handleDeviceChange}
                  options={devices.map((d) => ({
                    label: d.label || `Mic ${d.deviceId.slice(0, 8)}`,
                    value: d.deviceId,
                  }))}
                />
                {!isActive ? (
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={() => startMic(selectedDevice)}
                  >
                    Start Mic
                  </Button>
                ) : (
                  <Button danger icon={<StopOutlined />} onClick={stopMic}>
                    Stop Mic
                  </Button>
                )}
                <Button
                  icon={recording ? <StopOutlined /> : <AudioOutlined />}
                  onClick={toggleRecording}
                  disabled={!isActive}
                  danger={recording}
                >
                  {recording ? 'Stop Recording' : 'Record'}
                </Button>
                {recordedUrl && (
                  <>
                    <Button icon={<DownloadOutlined />} onClick={downloadRecording}>
                      Download
                    </Button>
                    <audio controls src={recordedUrl} style={{ height: 32 }} />
                  </>
                )}
              </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Microphone Information" style={{ height: '100%' }}>
            {Object.keys(micInfo).length > 0 ? (
              <Descriptions column={1} size="small" bordered>
                {Object.entries(micInfo).map(([key, val]) => (
                  <Descriptions.Item label={key} key={key}>
                    {val}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            ) : (
              <Text type="secondary">Start microphone to see device information</Text>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MicrophoneTest;
