import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Row,
  Slider,
  Space,
  Typography,
  Tooltip,
  Tag,
  Divider,
  Alert,
} from 'antd';
import { CaretRightOutlined, PauseOutlined, SoundOutlined, SwapOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

// ─── Musical note helpers ────────────────────────────────────────────────────
// Standard tuning: A4 = 440 Hz, MIDI note 69
// Formula: freq = 440 * 2^((midi - 69) / 12)
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function freqToNote(freq: number): string {
  // midi note closest to this freq
  const midi = Math.round(12 * Math.log2(freq / 440) + 69);
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const noteFreq = 440 * Math.pow(2, (midi - 69) / 12);
  const cents = Math.round(1200 * Math.log2(freq / noteFreq));
  const centsStr = cents === 0 ? '' : cents > 0 ? ` +${cents}¢` : ` ${cents}¢`;
  return `${name}${octave}${centsStr}`;
}

// ─── Preset quality tests ────────────────────────────────────────────────────
const PRESETS = [
  {
    label: 'Sub Bass',
    freq: 40,
    desc: 'Deep rumble — tests sub-woofer / large drivers',
    color: '#722ed1',
  },
  { label: 'Bass', freq: 100, desc: 'Kick drum body — warmth and punch', color: '#1677ff' },
  { label: 'Low-Mid', freq: 300, desc: 'Male vocals, guitar body', color: '#13c2c2' },
  { label: 'Mid', freq: 1000, desc: 'Voice clarity, presence', color: '#52c41a' },
  { label: 'High-Mid', freq: 4000, desc: 'Consonants, sibilance, attack', color: '#faad14' },
  { label: 'Treble', freq: 10000, desc: 'Cymbals, air, brilliance', color: '#f5222d' },
];

type Channel = 'left' | 'right' | 'both';

const HeadphoneTest: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(440);
  const [volume, setVolume] = useState(0.4);
  const [channel, setChannel] = useState<Channel>('both');
  const [autoLR, setAutoLR] = useState(false);
  const [activeChannel, setActiveChannel] = useState<Channel>('both'); // what's actually playing right now

  // Web Audio refs — we keep the graph alive while playing and recreate on param change
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const pannerRef = useRef<StereoPannerNode | null>(null);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoChannelRef = useRef<Channel>('left');

  // ── Audio helpers ─────────────────────────────────────────────────────────
  // panValue: -1 = full left, 0 = center, +1 = full right
  const channelToPan = (ch: Channel) => (ch === 'left' ? -1 : ch === 'right' ? 1 : 0);

  const stopTone = useCallback(() => {
    try {
      oscRef.current?.stop();
    } catch {}
    oscRef.current = null;
    gainRef.current = null;
    pannerRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    if (autoTimerRef.current) {
      clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  }, []);

  const startTone = useCallback(
    (freq: number, vol: number, ch: Channel) => {
      stopTone();

      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const panner = ctx.createStereoPanner();

      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = vol;
      panner.pan.value = channelToPan(ch);

      // chain: oscillator → gain → panner → output
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(ctx.destination);

      osc.start();

      audioCtxRef.current = ctx;
      oscRef.current = osc;
      gainRef.current = gain;
      pannerRef.current = panner;
      setActiveChannel(ch);
    },
    [stopTone],
  );

  // ── Live-update frequency/volume/pan while playing (no restart needed) ───
  useEffect(() => {
    if (!isPlaying || !oscRef.current || !gainRef.current || !pannerRef.current) return;
    oscRef.current.frequency.value = frequency;
    gainRef.current.gain.value = volume;
    if (!autoLR) {
      pannerRef.current.pan.value = channelToPan(channel);
      setActiveChannel(channel);
    }
  }, [frequency, volume, channel, isPlaying, autoLR]);

  // ── Auto left-right mode ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || !autoLR) return;
    // swap channel every 1.5 s
    autoTimerRef.current = setInterval(() => {
      autoChannelRef.current = autoChannelRef.current === 'left' ? 'right' : 'left';
      if (pannerRef.current) {
        pannerRef.current.pan.value = channelToPan(autoChannelRef.current);
        setActiveChannel(autoChannelRef.current);
      }
    }, 1500);
    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    };
  }, [isPlaying, autoLR]);

  const togglePlay = () => {
    if (isPlaying) {
      stopTone();
      setIsPlaying(false);
    } else {
      startTone(frequency, volume, autoLR ? 'left' : channel);
      setIsPlaying(true);
    }
  };

  const playPreset = (freq: number) => {
    setFrequency(freq);
    if (isPlaying) {
      // restart with new freq
      startTone(freq, volume, autoLR ? 'left' : channel);
    } else {
      startTone(freq, volume, autoLR ? 'left' : channel);
      setIsPlaying(true);
    }
  };

  const handleChannelChange = (ch: Channel) => {
    setChannel(ch);
    setAutoLR(false);
    if (isPlaying && pannerRef.current) {
      pannerRef.current.pan.value = channelToPan(ch);
      setActiveChannel(ch);
    }
  };

  const handleAutoLR = () => {
    const next = !autoLR;
    setAutoLR(next);
    if (isPlaying) {
      if (next) {
        // start auto timer immediately
        autoChannelRef.current = 'left';
        if (pannerRef.current) {
          pannerRef.current.pan.value = -1;
          setActiveChannel('left');
        }
      } else {
        if (autoTimerRef.current) clearInterval(autoTimerRef.current);
        if (pannerRef.current) {
          pannerRef.current.pan.value = channelToPan(channel);
          setActiveChannel(channel);
        }
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => () => stopTone(), [stopTone]);

  // ── Balance visualizer ────────────────────────────────────────────────────
  const panValue = channelToPan(activeChannel); // -1 to +1
  const indicatorLeft = `${((panValue + 1) / 2) * 100}%`;

  const freqLabel = `${frequency < 1000 ? frequency : (frequency / 1000).toFixed(1) + 'k'} Hz`;
  const noteName = freqToNote(frequency);

  return (
    <div className="headphone-test">
      <Alert
        message="Put on your headphones before starting the tests."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={[16, 16]}>
        {/* ── Left / Right balance test ───────────────────────────────────── */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <>
                <SwapOutlined /> Left / Right Channel Test
              </>
            }
            size="small"
          >
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              Verifies that left and right earpieces are correctly wired. You should only hear sound
              in the indicated ear.
            </Text>

            {/* Balance track */}
            <div style={{ position: 'relative', height: 40, marginBottom: 16 }}>
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: 4,
                  background: '#303030',
                  borderRadius: 2,
                  transform: 'translateY(-50%)',
                }}
              />
              {/* Moving dot */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: indicatorLeft,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: isPlaying ? '#1677ff' : '#444',
                  transform: 'translate(-50%, -50%)',
                  transition: 'left 0.4s ease, background 0.3s',
                  boxShadow: isPlaying ? '0 0 8px #1677ff' : 'none',
                }}
              />
              <Text
                style={{ position: 'absolute', left: 0, top: '100%', fontSize: 11, color: '#888' }}
              >
                LEFT
              </Text>
              <Text
                style={{ position: 'absolute', right: 0, top: '100%', fontSize: 11, color: '#888' }}
              >
                RIGHT
              </Text>
            </div>

            <Space wrap style={{ marginTop: 24 }}>
              <Button
                type={channel === 'left' && !autoLR ? 'primary' : 'default'}
                onClick={() => handleChannelChange('left')}
              >
                🔇 Left Only
              </Button>
              <Button
                type={channel === 'both' && !autoLR ? 'primary' : 'default'}
                onClick={() => handleChannelChange('both')}
              >
                🔊 Both
              </Button>
              <Button
                type={channel === 'right' && !autoLR ? 'primary' : 'default'}
                onClick={() => handleChannelChange('right')}
              >
                Right Only 🔇
              </Button>
              <Button
                type={autoLR ? 'primary' : 'default'}
                icon={<SwapOutlined />}
                onClick={handleAutoLR}
              >
                Auto LR
              </Button>
            </Space>

            {isPlaying && (
              <div style={{ marginTop: 12 }}>
                <Tag color="blue">
                  Playing:{' '}
                  {activeChannel === 'left'
                    ? '◀ Left'
                    : activeChannel === 'right'
                      ? 'Right ▶'
                      : '◀ Both ▶'}
                </Tag>
              </div>
            )}
          </Card>
        </Col>

        {/* ── Play controls ───────────────────────────────────────────────── */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <>
                <SoundOutlined /> Tone Controls
              </>
            }
            size="small"
          >
            <Row gutter={[0, 16]}>
              <Col span={24}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text strong>Frequency</Text>
                  <Space>
                    <Text code>{freqLabel}</Text>
                    <Tooltip title="Closest musical note">
                      <Tag color="geekblue">{noteName}</Tag>
                    </Tooltip>
                  </Space>
                </div>
                {/* Log-scale via sqrt trick: store sqrt of freq for linear slider */}
                <Slider
                  min={Math.sqrt(20)}
                  max={Math.sqrt(20000)}
                  step={0.01}
                  value={Math.sqrt(frequency)}
                  onChange={(v) => setFrequency(Math.round(v * v))}
                  tooltip={{ formatter: () => freqLabel }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    20 Hz
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    20 kHz
                  </Text>
                </div>
              </Col>

              <Col span={24}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text strong>Volume</Text>
                  <Text code>{Math.round(volume * 100)}%</Text>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={setVolume}
                  tooltip={{ formatter: (v) => `${Math.round((v ?? 0) * 100)}%` }}
                />
              </Col>

              <Col span={24}>
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={isPlaying ? <PauseOutlined /> : <CaretRightOutlined />}
                  onClick={togglePlay}
                  danger={isPlaying}
                >
                  {isPlaying ? 'Stop Tone' : 'Play Tone'}
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* ── Frequency preset tests ───────────────────────────────────────── */}
        <Col span={24}>
          <Card title="Frequency Range Tests" size="small">
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              Click a preset to play that frequency. Good headphones should reproduce all ranges
              clearly without distortion.
            </Text>
            <Row gutter={[12, 12]}>
              {PRESETS.map((p) => (
                <Col xs={12} sm={8} md={4} key={p.freq}>
                  <Tooltip title={p.desc}>
                    <Button
                      block
                      style={{
                        borderColor: p.color,
                        color: isPlaying && frequency === p.freq ? '#fff' : p.color,
                        background: isPlaying && frequency === p.freq ? p.color : 'transparent',
                        height: 64,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onClick={() => playPreset(p.freq)}
                    >
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{p.label}</div>
                      <div style={{ fontSize: 11, opacity: 0.75 }}>
                        {p.freq < 1000 ? `${p.freq} Hz` : `${p.freq / 1000} kHz`}
                      </div>
                    </Button>
                  </Tooltip>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* ── How to use ───────────────────────────────────────────────────── */}
        <Col span={24}>
          <Card title="How to Use" size="small">
            <Row gutter={[16, 8]}>
              <Col xs={24} sm={8}>
                <Title level={5}>1. Left / Right Test</Title>
                <Text type="secondary">
                  Click "Left Only" — you should only hear sound in your left ear. Click "Right
                  Only" — only in the right ear. If it's reversed, your headphones are on backwards
                  or the cable is swapped.
                </Text>
              </Col>
              <Divider type="vertical" style={{ height: 'auto' }} />
              <Col xs={24} sm={7}>
                <Title level={5}>2. Frequency Generator</Title>
                <Text type="secondary">
                  Drag the slider through the full range (20 Hz – 20 kHz). You should hear the tone
                  get higher. If it disappears at any point, your headphones may have a gap in their
                  frequency response.
                </Text>
              </Col>
              <Divider type="vertical" style={{ height: 'auto' }} />
              <Col xs={24} sm={7}>
                <Title level={5}>3. Preset Range Tests</Title>
                <Text type="secondary">
                  Click each preset and listen for distortion or complete silence. Bass presets test
                  driver size; treble tests tweeter quality. All six should play cleanly on good
                  headphones.
                </Text>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HeadphoneTest;
