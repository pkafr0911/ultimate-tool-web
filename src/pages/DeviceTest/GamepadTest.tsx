import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Badge, Card, Col, Descriptions, Progress, Row, Space, Tag, Typography } from 'antd';
import { ControlOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface GamepadState {
  index: number;
  id: string;
  buttons: { pressed: boolean; value: number }[];
  axes: number[];
  timestamp: number;
  mapping: string;
  connected: boolean;
  vibrationActuator: boolean;
}

const BUTTON_LABELS = [
  'A / ✕',
  'B / ○',
  'X / □',
  'Y / △',
  'LB / L1',
  'RB / R1',
  'LT / L2',
  'RT / R2',
  'Back / Select',
  'Start',
  'L3 (Left Stick)',
  'R3 (Right Stick)',
  'D-Pad Up',
  'D-Pad Down',
  'D-Pad Left',
  'D-Pad Right',
  'Home / Guide',
];

const AXIS_LABELS = ['Left Stick X', 'Left Stick Y', 'Right Stick X', 'Right Stick Y'];

const GamepadTest: React.FC = () => {
  const [gamepads, setGamepads] = useState<(GamepadState | null)[]>([]);
  const [connected, setConnected] = useState(false);
  const animRef = useRef<number>(0);
  const canvasLeftRef = useRef<HTMLCanvasElement>(null);
  const canvasRightRef = useRef<HTMLCanvasElement>(null);

  const pollGamepads = useCallback(() => {
    const gps = navigator.getGamepads();
    const states: (GamepadState | null)[] = [];
    let hasAny = false;

    for (let i = 0; i < 4; i++) {
      const gp = gps[i];
      if (gp) {
        hasAny = true;
        states.push({
          index: gp.index,
          id: gp.id,
          buttons: Array.from(gp.buttons).map((b) => ({
            pressed: b.pressed,
            value: b.value,
          })),
          axes: Array.from(gp.axes),
          timestamp: gp.timestamp,
          mapping: gp.mapping || 'non-standard',
          connected: gp.connected,
          vibrationActuator: !!(gp as any).vibrationActuator,
        });
      } else {
        states.push(null);
      }
    }

    setGamepads(states);
    setConnected(hasAny);

    // Draw stick visualizations
    if (hasAny) {
      const first = states.find((g) => g !== null) as GamepadState | undefined;
      if (first) {
        drawStick(canvasLeftRef.current, first.axes[0] || 0, first.axes[1] || 0);
        drawStick(canvasRightRef.current, first.axes[2] || 0, first.axes[3] || 0);
      }
    }

    animRef.current = requestAnimationFrame(pollGamepads);
  }, []);

  const drawStick = (canvas: HTMLCanvasElement | null, x: number, y: number) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = w * 0.4;

    ctx.clearRect(0, 0, w, h);

    // Background circle
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#f0f0f0';
    ctx.fill();
    ctx.strokeStyle = '#d9d9d9';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Crosshair
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx, cy + radius);
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Dead zone circle
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.15, 0, Math.PI * 2);
    ctx.strokeStyle = '#bbb';
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Stick position
    const dotX = cx + x * radius;
    const dotY = cy + y * radius;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 10, 0, Math.PI * 2);
    const magnitude = Math.sqrt(x * x + y * y);
    const hue = magnitude > 0.8 ? 0 : magnitude > 0.4 ? 40 : 120;
    ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Position text
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`(${x.toFixed(2)}, ${y.toFixed(2)})`, cx, h - 5);
  };

  useEffect(() => {
    const onConnect = () => pollGamepads();
    const onDisconnect = () => {
      setConnected(false);
      setGamepads([]);
    };

    window.addEventListener('gamepadconnected', onConnect);
    window.addEventListener('gamepaddisconnected', onDisconnect);

    animRef.current = requestAnimationFrame(pollGamepads);

    return () => {
      window.removeEventListener('gamepadconnected', onConnect);
      window.removeEventListener('gamepaddisconnected', onDisconnect);
      cancelAnimationFrame(animRef.current);
    };
  }, [pollGamepads]);

  const activeGamepad = gamepads.find((g) => g !== null) as GamepadState | undefined;

  return (
    <div className="gamepad-test">
      {!connected && (
        <Alert
          message="No gamepad detected"
          description="Connect a gamepad/controller and press any button to start testing. Supports Xbox, PlayStation, Switch Pro, and other standard controllers."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {activeGamepad && (
        <>
          <Card
            title={
              <Space>
                <ControlOutlined />
                {activeGamepad.id}
                <Tag color="green">Connected</Tag>
                <Tag color="blue">{activeGamepad.mapping} mapping</Tag>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={[16, 16]}>
              {/* Buttons */}
              <Col xs={24} md={12}>
                <Text strong style={{ display: 'block', marginBottom: 12 }}>
                  Buttons
                </Text>
                <div className="gamepad-buttons-grid">
                  {activeGamepad.buttons.map((btn, i) => (
                    <div
                      key={i}
                      className={`gamepad-btn ${btn.pressed ? 'gamepad-btn--pressed' : ''}`}
                    >
                      <div className="gamepad-btn-label">{BUTTON_LABELS[i] || `Button ${i}`}</div>
                      {btn.value > 0 && btn.value < 1 && (
                        <Progress
                          percent={Math.round(btn.value * 100)}
                          size="small"
                          showInfo={false}
                          strokeColor="#1677ff"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </Col>

              {/* Analog sticks */}
              <Col xs={24} md={12}>
                <Text strong style={{ display: 'block', marginBottom: 12 }}>
                  Analog Sticks
                </Text>
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ textAlign: 'center' }}>
                      <Text type="secondary">Left Stick</Text>
                      <canvas
                        ref={canvasLeftRef}
                        width={150}
                        height={150}
                        style={{ display: 'block', margin: '8px auto' }}
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ textAlign: 'center' }}>
                      <Text type="secondary">Right Stick</Text>
                      <canvas
                        ref={canvasRightRef}
                        width={150}
                        height={150}
                        style={{ display: 'block', margin: '8px auto' }}
                      />
                    </div>
                  </Col>
                </Row>

                <div style={{ marginTop: 16 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Axes
                  </Text>
                  {activeGamepad.axes.map((axis, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <Text type="secondary">{AXIS_LABELS[i] || `Axis ${i}`}</Text>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <div className="axis-bar-track">
                          <div
                            className="axis-bar-fill"
                            style={{
                              left: '50%',
                              width: `${Math.abs(axis) * 50}%`,
                              transform: axis < 0 ? 'translateX(-100%)' : 'none',
                              backgroundColor: Math.abs(axis) > 0.8 ? '#ff4d4f' : '#1677ff',
                            }}
                          />
                          <div className="axis-bar-center" />
                        </div>
                        <Text code style={{ minWidth: 60, textAlign: 'right' }}>
                          {axis.toFixed(4)}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </Col>
            </Row>
          </Card>

          <Card title="Gamepad Details" size="small">
            <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
              <Descriptions.Item label="ID">{activeGamepad.id}</Descriptions.Item>
              <Descriptions.Item label="Index">{activeGamepad.index}</Descriptions.Item>
              <Descriptions.Item label="Mapping">{activeGamepad.mapping}</Descriptions.Item>
              <Descriptions.Item label="Buttons">{activeGamepad.buttons.length}</Descriptions.Item>
              <Descriptions.Item label="Axes">{activeGamepad.axes.length}</Descriptions.Item>
              <Descriptions.Item label="Vibration">
                {activeGamepad.vibrationActuator ? (
                  <Tag color="green">Supported</Tag>
                ) : (
                  <Tag color="default">Not Available</Tag>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </>
      )}

      {/* Multiple gamepads summary */}
      {gamepads.filter((g) => g !== null).length > 1 && (
        <Card title="Connected Gamepads" size="small" style={{ marginTop: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {gamepads.map((gp, i) =>
              gp ? (
                <Badge.Ribbon text={`Player ${i + 1}`} key={i}>
                  <Card size="small">
                    <Text>{gp.id}</Text>
                  </Card>
                </Badge.Ribbon>
              ) : null,
            )}
          </Space>
        </Card>
      )}
    </div>
  );
};

export default GamepadTest;
