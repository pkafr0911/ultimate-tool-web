import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card, Col, Descriptions, Row, Space, Statistic, Tag, Typography } from 'antd';

const { Text, Title } = Typography;

interface ClickRecord {
  button: number;
  timestamp: number;
  x: number;
  y: number;
}

const BUTTON_NAMES: Record<number, string> = {
  0: 'Left',
  1: 'Middle',
  2: 'Right',
  3: 'Back',
  4: 'Forward',
};

const BUTTON_COLORS: Record<number, string> = {
  0: '#1677ff',
  1: '#52c41a',
  2: '#ff4d4f',
  3: '#722ed1',
  4: '#fa8c16',
};

const MouseTest: React.FC = () => {
  const [clicks, setClicks] = useState<ClickRecord[]>([]);
  const [buttonStates, setButtonStates] = useState<Record<number, boolean>>({});
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scrollDelta, setScrollDelta] = useState({ x: 0, y: 0, total: 0 });
  const [moveDistance, setMoveDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);
  const [doubleClicks, setDoubleClicks] = useState(0);

  const testAreaRef = useRef<HTMLDivElement>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastTimeRef = useRef(0);
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);

  const buttonCounts = clicks.reduce(
    (acc, c) => {
      acc[c.button] = (acc[c.button] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const rect = testAreaRef.current?.getBoundingClientRect();
      if (!rect) return;

      setButtonStates((prev) => ({ ...prev, [e.button]: true }));
      setClicks((prev) => [
        ...prev,
        {
          button: e.button,
          timestamp: Date.now(),
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        },
      ]);
    },
    [],
  );

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    setButtonStates((prev) => ({ ...prev, [e.button]: false }));
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = testAreaRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPosition({ x, y });

    const now = performance.now();
    if (lastPosRef.current) {
      const dx = e.movementX;
      const dy = e.movementY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      setMoveDistance((prev) => prev + dist);

      const dt = now - lastTimeRef.current;
      if (dt > 0) {
        setSpeed(Math.round((dist / dt) * 1000));
      }
    }
    lastPosRef.current = { x, y };
    lastTimeRef.current = now;

    // Trail
    setTrail((prev) => {
      const next = [...prev, { x, y }];
      return next.length > 200 ? next.slice(-200) : next;
    });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScrollDelta((prev) => ({
      x: prev.x + e.deltaX,
      y: prev.y + e.deltaY,
      total: prev.total + Math.abs(e.deltaY) + Math.abs(e.deltaX),
    }));
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDoubleClicks((prev) => prev + 1);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Draw trail on canvas
  useEffect(() => {
    const canvas = trailCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (trail.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);
    for (let i = 1; i < trail.length; i++) {
      ctx.lineTo(trail[i].x, trail[i].y);
    }
    ctx.strokeStyle = 'rgba(22, 119, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Draw recent dots
    const recent = trail.slice(-20);
    recent.forEach((p, i) => {
      const alpha = (i + 1) / recent.length;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 * alpha + 1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(22, 119, 255, ${alpha * 0.6})`;
      ctx.fill();
    });
  }, [trail]);

  const handleReset = () => {
    setClicks([]);
    setButtonStates({});
    setScrollDelta({ x: 0, y: 0, total: 0 });
    setMoveDistance(0);
    setSpeed(0);
    setTrail([]);
    setDoubleClicks(0);
    lastPosRef.current = null;
  };

  // Calculate CPS (clicks per second) for last 5 seconds
  const now = Date.now();
  const recentClicks = clicks.filter((c) => now - c.timestamp < 5000);
  const cps = recentClicks.length > 0 ? (recentClicks.length / 5).toFixed(1) : '0';

  return (
    <div className="mouse-test">
      <Row gutter={[16, 16]}>
        {/* Test area */}
        <Col xs={24} lg={16}>
          <Card
            title="Click Test Area"
            size="small"
            extra={
              <button className="mouse-reset-btn" onClick={handleReset}>
                Reset
              </button>
            }
          >
            <div
              ref={testAreaRef}
              className="mouse-test-area"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              onWheel={handleWheel}
              onDoubleClick={handleDoubleClick}
              onContextMenu={handleContextMenu}
            >
              <canvas
                ref={trailCanvasRef}
                width={800}
                height={400}
                className="mouse-trail-canvas"
              />

              {/* Click ripples */}
              {clicks.slice(-30).map((c, i) => (
                <div
                  key={`${c.timestamp}-${i}`}
                  className="mouse-click-ripple"
                  style={{
                    left: c.x,
                    top: c.y,
                    borderColor: BUTTON_COLORS[c.button] || '#999',
                  }}
                />
              ))}

              {/* Crosshair */}
              <div className="mouse-crosshair-h" style={{ top: position.y }} />
              <div className="mouse-crosshair-v" style={{ left: position.x }} />

              {/* Cursor dot */}
              <div
                className="mouse-cursor-dot"
                style={{ left: position.x, top: position.y }}
              />

              {/* Instruction overlay */}
              {clicks.length === 0 && (
                <div className="mouse-test-overlay">
                  <Text type="secondary" style={{ fontSize: 16 }}>
                    Click, scroll, and move your mouse here
                  </Text>
                </div>
              )}

              {/* Position label */}
              <div className="mouse-pos-label">
                ({Math.round(position.x)}, {Math.round(position.y)})
              </div>
            </div>
          </Card>
        </Col>

        {/* Stats panel */}
        <Col xs={24} lg={8}>
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            {/* Mouse buttons visual */}
            <Card title="Mouse Buttons" size="small">
              <div className="mouse-visual">
                <div className="mouse-body">
                  <div className="mouse-buttons-row">
                    <div
                      className={`mouse-btn-visual mouse-btn-left ${buttonStates[0] ? 'mouse-btn-visual--active' : ''}`}
                    >
                      <span>L</span>
                      <Tag color={buttonStates[0] ? 'blue' : 'default'}>
                        {buttonCounts[0] || 0}
                      </Tag>
                    </div>
                    <div
                      className={`mouse-btn-visual mouse-btn-middle ${buttonStates[1] ? 'mouse-btn-visual--active' : ''}`}
                    >
                      <span>M</span>
                      <Tag color={buttonStates[1] ? 'green' : 'default'}>
                        {buttonCounts[1] || 0}
                      </Tag>
                    </div>
                    <div
                      className={`mouse-btn-visual mouse-btn-right ${buttonStates[2] ? 'mouse-btn-visual--active' : ''}`}
                    >
                      <span>R</span>
                      <Tag color={buttonStates[2] ? 'red' : 'default'}>
                        {buttonCounts[2] || 0}
                      </Tag>
                    </div>
                  </div>
                  {/* Scroll indicator */}
                  <div className="mouse-scroll-visual">
                    <div
                      className="mouse-scroll-indicator"
                      style={{
                        transform: `translateY(${Math.max(-15, Math.min(15, -(scrollDelta.y % 100) / 3))}px)`,
                      }}
                    />
                  </div>
                  {/* Side buttons */}
                  <div className="mouse-side-buttons">
                    <div
                      className={`mouse-side-btn ${buttonStates[3] ? 'mouse-side-btn--active' : ''}`}
                    >
                      <span>←</span>
                      <small>{buttonCounts[3] || 0}</small>
                    </div>
                    <div
                      className={`mouse-side-btn ${buttonStates[4] ? 'mouse-side-btn--active' : ''}`}
                    >
                      <span>→</span>
                      <small>{buttonCounts[4] || 0}</small>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Stats */}
            <Card title="Statistics" size="small">
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <Statistic title="Total Clicks" value={clicks.length} />
                </Col>
                <Col span={12}>
                  <Statistic title="Double Clicks" value={doubleClicks} />
                </Col>
                <Col span={12}>
                  <Statistic title="CPS (5s)" value={cps} />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Speed"
                    value={speed}
                    suffix="px/s"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Distance"
                    value={Math.round(moveDistance)}
                    suffix="px"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Scroll"
                    value={Math.round(scrollDelta.total)}
                    suffix="Δ"
                  />
                </Col>
              </Row>
            </Card>

            {/* Scroll details */}
            <Card title="Scroll Details" size="small">
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Vertical (Y)">
                  <Text code>{Math.round(scrollDelta.y)}</Text>
                  {scrollDelta.y !== 0 && (
                    <Tag color={scrollDelta.y > 0 ? 'orange' : 'cyan'} style={{ marginLeft: 8 }}>
                      {scrollDelta.y > 0 ? '↓ Down' : '↑ Up'}
                    </Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Horizontal (X)">
                  <Text code>{Math.round(scrollDelta.x)}</Text>
                  {scrollDelta.x !== 0 && (
                    <Tag color={scrollDelta.x > 0 ? 'orange' : 'cyan'} style={{ marginLeft: 8 }}>
                      {scrollDelta.x > 0 ? '→ Right' : '← Left'}
                    </Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Total Scroll">
                  <Text code>{Math.round(scrollDelta.total)}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Click log */}
            <Card title="Recent Clicks" size="small">
              <div className="mouse-click-log">
                {clicks.length === 0 && (
                  <Text type="secondary">No clicks recorded yet</Text>
                )}
                {clicks
                  .slice(-10)
                  .reverse()
                  .map((c, i) => (
                    <div key={`${c.timestamp}-${i}`} className="mouse-click-log-item">
                      <Tag color={BUTTON_COLORS[c.button] || 'default'}>
                        {BUTTON_NAMES[c.button] || `Button ${c.button}`}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        ({Math.round(c.x)}, {Math.round(c.y)})
                      </Text>
                    </div>
                  ))}
              </div>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default MouseTest;
