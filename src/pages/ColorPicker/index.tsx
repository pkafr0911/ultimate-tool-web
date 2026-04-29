import {
  CopyOutlined,
  BgColorsOutlined,
  EyeOutlined,
  AppstoreOutlined,
  FileImageOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  SwapOutlined,
  BookOutlined,
  HighlightOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { TinyColor, readability } from '@ctrl/tinycolor';
import {
  Button,
  ColorPicker,
  Input,
  InputNumber,
  Segmented,
  Slider,
  Space,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from 'antd';
import type { Color } from 'antd/es/color-picker';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import DragDropWrapper from '@/components/DragDropWrapper';
import DragOverlay from '@/components/DragOverlay';
import { handleCopy } from '@/helpers';
import './styles.less';

const { Title, Text } = Typography;
const { Dragger } = Upload;

type PickerMode = 'single' | 'gradient';
type HarmonyKind =
  | 'monochromatic'
  | 'analogous'
  | 'complementary'
  | 'triad'
  | 'tetrad'
  | 'split-complement';

const HARMONIES: { key: HarmonyKind; label: string; desc: string }[] = [
  { key: 'monochromatic', label: 'Mono', desc: 'Lighter & darker shades of one hue.' },
  { key: 'analogous', label: 'Analogous', desc: 'Hues sitting next to each other on the wheel.' },
  { key: 'complementary', label: 'Complement', desc: 'Opposite hue across the wheel.' },
  { key: 'triad', label: 'Triad', desc: 'Three evenly spaced hues.' },
  { key: 'tetrad', label: 'Tetrad', desc: 'Four hues forming a rectangle.' },
  { key: 'split-complement', label: 'Split', desc: 'Base + two adjacent to its complement.' },
];

const toTiny = (value: Color | string) =>
  new TinyColor(typeof value === 'string' ? value : value.toHexString());

function buildPalette(base: TinyColor, kind: HarmonyKind): string[] {
  const hex = (c: TinyColor) => c.toHexString();
  switch (kind) {
    case 'analogous':
      return base.analogous(6).map(hex);
    case 'complementary':
      return [base, base.complement()].map(hex);
    case 'triad':
      return base.triad().map(hex);
    case 'tetrad':
      return base.tetrad().map(hex);
    case 'split-complement':
      return base.splitcomplement().map(hex);
    case 'monochromatic':
    default: {
      const out: string[] = [];
      for (let i = 4; i >= 1; i--)
        out.push(
          base
            .clone()
            .lighten(i * 12)
            .toHexString(),
        );
      out.push(hex(base));
      for (let i = 1; i <= 4; i++)
        out.push(
          base
            .clone()
            .darken(i * 12)
            .toHexString(),
        );
      return out;
    }
  }
}

function getContrastRating(ratio: number) {
  if (ratio >= 7) return { label: 'AAA', tone: 'success' as const, ok: true, hint: 'Excellent' };
  if (ratio >= 4.5) return { label: 'AA', tone: 'success' as const, ok: true, hint: 'Good' };
  if (ratio >= 3)
    return {
      label: 'AA Large',
      tone: 'warning' as const,
      ok: false,
      hint: 'Fair (large text only)',
    };
  return { label: 'Fail', tone: 'danger' as const, ok: false, hint: 'Insufficient contrast' };
}

const ColorPickerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'picker' | 'palette' | 'contrast' | 'image'>('picker');

  // Picker / Gradient
  const [mode, setMode] = useState<PickerMode>('single');
  const [color1, setColor1] = useState<Color | string>('#1677ff');
  const [color2, setColor2] = useState<Color | string>('#ff718b');
  const [gradientDeg, setGradientDeg] = useState(90);

  // Palette
  const [baseColor, setBaseColor] = useState<Color | string>('#1890ff');
  const [harmony, setHarmony] = useState<HarmonyKind>('monochromatic');

  // Contrast
  const [fgColor, setFgColor] = useState<Color | string>('#ffffff');
  const [bgColor, setBgColor] = useState<Color | string>('#1677ff');

  // Image picker
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [pickedColor, setPickedColor] = useState<string>('');
  const [pickHistory, setPickHistory] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Saved swatches
  const [swatches, setSwatches] = useState<string[]>([]);

  const tiny1 = useMemo(() => toTiny(color1), [color1]);
  const tiny2 = useMemo(() => toTiny(color2), [color2]);
  const hex1 = tiny1.toHexString();
  const hex2 = tiny2.toHexString();
  const gradient = `linear-gradient(${gradientDeg}deg, ${hex1}, ${hex2})`;

  const palette = useMemo(() => buildPalette(toTiny(baseColor), harmony), [baseColor, harmony]);

  const fgTiny = toTiny(fgColor);
  const bgTiny = toTiny(bgColor);
  const contrastRatio = useMemo(() => readability(fgTiny, bgTiny), [fgColor, bgColor]);
  const rating = getContrastRating(contrastRatio);

  // Image canvas effect
  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
    };
  }, [imageUrl]);

  const handleUpload = (file: File) => {
    setImageUrl(URL.createObjectURL(file));
    setPickedColor('');
    setPickHistory([]);
    return false;
  };

  const handleImageClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = new TinyColor({ r: pixel[0], g: pixel[1], b: pixel[2] }).toHexString();
      setPickedColor(hex);
      setPickHistory((h) => (h[0] === hex ? h : [hex, ...h].slice(0, 12)));
    }
  };

  const handleClearImage = () => {
    setImageUrl('');
    setPickedColor('');
    setPickHistory([]);
  };

  const addSwatch = (hex: string) => {
    setSwatches((s) => (s.includes(hex) ? s : [hex, ...s].slice(0, 24)));
    message.success(`Saved ${hex}`);
  };
  const removeSwatch = (hex: string) => setSwatches((s) => s.filter((c) => c !== hex));

  const swapContrast = () => {
    const fg = fgTiny.toHexString();
    const bg = bgTiny.toHexString();
    setFgColor(bg);
    setBgColor(fg);
  };

  const heroColor = useMemo(() => {
    if (activeTab === 'picker') return mode === 'gradient' ? gradient : hex1;
    if (activeTab === 'palette') return toTiny(baseColor).toHexString();
    if (activeTab === 'contrast') return bgTiny.toHexString();
    return pickedColor || hex1;
  }, [activeTab, mode, gradient, hex1, baseColor, bgTiny, pickedColor]);

  const colorRow = (label: string, value: string) => (
    <Input
      addonBefore={label}
      value={value}
      readOnly
      suffix={
        <Tooltip title={`Copy ${label}`}>
          <CopyOutlined onClick={() => handleCopy(value)} style={{ cursor: 'pointer' }} />
        </Tooltip>
      }
      className="codeInput"
    />
  );

  const renderPickerTab = () => (
    <div className="workspace">
      <div className="panel">
        <div className="panelHeader">
          <span className="panelTitle">
            <BgColorsOutlined /> {mode === 'single' ? 'Pick a color' : 'Build a gradient'}
          </span>
          <Segmented
            value={mode}
            onChange={(v) => setMode(v as PickerMode)}
            options={[
              { label: 'Single', value: 'single' },
              { label: 'Gradient', value: 'gradient' },
            ]}
          />
        </div>

        {mode === 'single' ? (
          <div className="inlinePicker">
            <ColorPicker
              value={color1}
              onChange={setColor1}
              size="large"
              showText
              rootClassName="bigColorPicker"
            >
              <button className="bigColorTrigger" type="button">
                <span className="bigColorSwatch" style={{ background: hex1 }} />
                <span className="bigColorMeta">
                  <span className="bigColorHex">{hex1.toUpperCase()}</span>
                  <span className="bigColorHint">Click to open the color picker</span>
                </span>
              </button>
            </ColorPicker>
          </div>
        ) : (
          <Space direction="vertical" size={14} style={{ width: '100%' }}>
            <div className="gradientStops">
              <div className="gradientStop">
                <span className="stopLabel">Stop 1</span>
                <ColorPicker value={color1} onChange={setColor1} showText size="large" />
              </div>
              <SwapOutlined
                className="gradArrow"
                onClick={() => {
                  setColor1(hex2);
                  setColor2(hex1);
                }}
              />
              <div className="gradientStop">
                <span className="stopLabel">Stop 2</span>
                <ColorPicker value={color2} onChange={setColor2} showText size="large" />
              </div>
            </div>
            <div className="gradAngle">
              <span className="optLabel">Angle</span>
              <Slider
                min={0}
                max={360}
                value={gradientDeg}
                onChange={setGradientDeg}
                style={{ flex: 1 }}
              />
              <InputNumber
                min={0}
                max={360}
                value={gradientDeg}
                onChange={(v) => v != null && setGradientDeg(v)}
                addonAfter="°"
                style={{ width: 90 }}
              />
            </div>
          </Space>
        )}
      </div>

      <div className="panel">
        <div className="panelHeader">
          <span className="panelTitle">
            <HighlightOutlined /> Values
          </span>
          <Space size={6}>
            <Tooltip title="Save to swatches">
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => addSwatch(mode === 'gradient' ? gradient : hex1)}
              >
                Save
              </Button>
            </Tooltip>
          </Space>
        </div>
        <div className="previewBox" style={{ background: mode === 'gradient' ? gradient : hex1 }} />
        {mode === 'single' ? (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {colorRow('HEX', hex1)}
            {colorRow('RGB', tiny1.toRgbString())}
            {colorRow('HSL', tiny1.toHslString())}
            {colorRow('HSV', tiny1.toHsvString())}
          </Space>
        ) : (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {colorRow('CSS', `background: ${gradient};`)}
            <Button
              type="primary"
              icon={<CopyOutlined />}
              block
              onClick={() => handleCopy(`background: ${gradient};`)}
            >
              Copy CSS
            </Button>
          </Space>
        )}
      </div>
    </div>
  );

  const renderPaletteTab = () => (
    <div className="paletteWrap">
      <div className="panel paletteHeader">
        <div className="optGroup">
          <span className="optLabel">Base</span>
          <ColorPicker value={baseColor} onChange={setBaseColor} showText size="large" />
        </div>
        <div className="optGroup">
          <span className="optLabel">Harmony</span>
          <Segmented
            value={harmony}
            onChange={(v) => setHarmony(v as HarmonyKind)}
            options={HARMONIES.map((h) => ({ label: h.label, value: h.key }))}
          />
        </div>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {HARMONIES.find((h) => h.key === harmony)?.desc}
        </Text>
      </div>

      <div className="paletteGrid">
        {palette.map((c, i) => {
          const t = toTiny(c);
          const onLight = t.isDark();
          return (
            <div
              key={`${c}-${i}`}
              className="paletteSwatch"
              style={{ background: c, color: onLight ? '#fff' : '#000' }}
              onClick={() => handleCopy(c)}
            >
              <span className="swatchLabel">{c.toUpperCase()}</span>
              <span className="swatchSub">{t.toRgbString()}</span>
              <Button
                size="small"
                type="text"
                icon={<PlusOutlined />}
                className="swatchSave"
                onClick={(e) => {
                  e.stopPropagation();
                  addSwatch(c);
                }}
                style={{ color: 'inherit' }}
              />
            </div>
          );
        })}
      </div>

      <div className="panel">
        <div className="panelHeader">
          <span className="panelTitle">
            <ThunderboltOutlined /> Export
          </span>
        </div>
        <Input.TextArea
          value={palette.join(', ')}
          autoSize={{ minRows: 1, maxRows: 3 }}
          readOnly
          className="codeArea"
        />
        <Space wrap size={8} style={{ marginTop: 8 }}>
          <Button icon={<CopyOutlined />} onClick={() => handleCopy(palette.join(', '))}>
            Copy list
          </Button>
          <Button
            icon={<CopyOutlined />}
            onClick={() => handleCopy(palette.map((c, i) => `--c${i + 1}: ${c};`).join('\n'))}
          >
            Copy CSS vars
          </Button>
          <Button
            icon={<CopyOutlined />}
            onClick={() => handleCopy(JSON.stringify(palette, null, 2))}
          >
            Copy JSON
          </Button>
        </Space>
      </div>
    </div>
  );

  const renderContrastTab = () => (
    <div className="workspace">
      <div className="panel">
        <div className="panelHeader">
          <span className="panelTitle">
            <EyeOutlined /> Colors
          </span>
          <Tooltip title="Swap text & background">
            <Button size="small" icon={<SwapOutlined />} onClick={swapContrast}>
              Swap
            </Button>
          </Tooltip>
        </div>
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <div className="contrastRow">
            <span className="optLabel">Text</span>
            <ColorPicker value={fgColor} onChange={setFgColor} showText size="large" />
          </div>
          <div className="contrastRow">
            <span className="optLabel">Background</span>
            <ColorPicker value={bgColor} onChange={setBgColor} showText size="large" />
          </div>
          <div className="contrastStats">
            <div className={`statBig statBig-${rating.tone}`}>
              <span className="bigValue">{contrastRatio.toFixed(2)}</span>
              <span className="bigLabel">Contrast Ratio</span>
            </div>
            <div className={`statBig statBig-${rating.tone}`}>
              <span className="bigValue">
                {rating.ok ? <CheckCircleFilled /> : <CloseCircleFilled />} {rating.label}
              </span>
              <span className="bigLabel">{rating.hint}</span>
            </div>
          </div>
          <div className="wcagGrid">
            {[
              { label: 'AA Normal', need: 4.5 },
              { label: 'AA Large', need: 3 },
              { label: 'AAA Normal', need: 7 },
              { label: 'AAA Large', need: 4.5 },
            ].map((r) => {
              const pass = contrastRatio >= r.need;
              return (
                <div key={r.label} className={`wcagCell ${pass ? 'pass' : 'fail'}`}>
                  {pass ? <CheckCircleFilled /> : <CloseCircleFilled />}
                  <span>{r.label}</span>
                  <span className="wcagNeed">≥ {r.need}</span>
                </div>
              );
            })}
          </div>
        </Space>
      </div>

      <div className="panel">
        <div className="panelHeader">
          <span className="panelTitle">
            <BgColorsOutlined /> Preview
          </span>
        </div>
        <div
          className="contrastPreview"
          style={{ background: bgTiny.toHexString(), color: fgTiny.toHexString() }}
        >
          <div className="contrastBig">Aa</div>
          <Title level={4} style={{ color: 'inherit', margin: 0 }}>
            The quick brown fox jumps over the lazy dog
          </Title>
          <Text style={{ color: 'inherit' }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. 1234567890.
          </Text>
          <Text style={{ color: 'inherit', fontSize: 12, opacity: 0.85 }}>Small text · 12px</Text>
        </div>
      </div>
    </div>
  );

  const renderImageTab = () => (
    <div className="workspace workspace-wide">
      <div className="panel">
        <div className="panelHeader">
          <span className="panelTitle">
            <FileImageOutlined /> Image
          </span>
          {imageUrl && (
            <Button size="small" danger icon={<DeleteOutlined />} onClick={handleClearImage}>
              Remove
            </Button>
          )}
        </div>
        {!imageUrl ? (
          <Dragger
            accept="image/*"
            showUploadList={false}
            beforeUpload={handleUpload}
            className="customDragger"
          >
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined />
            </p>
            <p className="ant-upload-text">Click or drop an image to extract colors</p>
            <p className="ant-upload-hint">PNG · JPG · WEBP · SVG</p>
          </Dragger>
        ) : (
          <div className="canvasWrap">
            <canvas ref={canvasRef} onClick={handleImageClick} className="pickCanvas" />
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panelHeader">
          <span className="panelTitle">
            <BgColorsOutlined /> Picked
          </span>
        </div>
        {pickedColor ? (
          <>
            <div className="previewBox" style={{ background: pickedColor }} />
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {colorRow('HEX', pickedColor)}
              {colorRow('RGB', toTiny(pickedColor).toRgbString())}
              {colorRow('HSL', toTiny(pickedColor).toHslString())}
            </Space>
            <Space style={{ marginTop: 12 }}>
              <Button size="small" icon={<PlusOutlined />} onClick={() => addSwatch(pickedColor)}>
                Save swatch
              </Button>
            </Space>
          </>
        ) : (
          <div className="emptyHint">
            <BgColorsOutlined />
            <p>Click anywhere on the image to sample a pixel.</p>
          </div>
        )}
        {pickHistory.length > 0 && (
          <>
            <div className="dividerLabel">Recent picks</div>
            <div className="historyRow">
              {pickHistory.map((c) => (
                <Tooltip key={c} title={c.toUpperCase()}>
                  <span
                    className="historyDot"
                    style={{ background: c }}
                    onClick={() => setPickedColor(c)}
                  />
                </Tooltip>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <DragDropWrapper
      setDragging={setDragging}
      dragCounter={dragCounter}
      handleUpload={handleUpload}
    >
      <div className="container">
        <div className="shell">
          {/* === Hero === */}
          <div
            className="hero"
            style={{
              background: heroColor.startsWith('linear') ? heroColor : undefined,
              backgroundColor: heroColor.startsWith('#') ? heroColor : undefined,
            }}
          >
            <div className="heroOverlay" />
            <div className="heroRow">
              <div className="heroTitleBlock">
                <span className="heroBadge">
                  <BgColorsOutlined />
                </span>
                <div>
                  <span className="heroEyebrow">Color Studio</span>
                  <Title level={4} style={{ color: '#fff', margin: '4px 0 0', lineHeight: 1.25 }}>
                    Pick · Mix · Extract · Validate
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                    A complete color toolkit — gradients, harmonies, WCAG checks, and image picking.
                  </Text>
                </div>
              </div>
              <Space className="heroActions" wrap>
                <Tooltip title="Copy current color">
                  <Button
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(heroColor)}
                    style={{
                      background: 'rgba(255,255,255,0.16)',
                      borderColor: 'rgba(255,255,255,0.25)',
                      color: '#fff',
                    }}
                  >
                    Copy
                  </Button>
                </Tooltip>
                <Button
                  className="primaryAction"
                  icon={<PlusOutlined />}
                  onClick={() => addSwatch(heroColor)}
                >
                  Save swatch
                </Button>
              </Space>
            </div>
          </div>

          {/* === Stat strip === */}
          <div className="statStrip">
            <div className="statChip">
              <span className="statIcon" style={{ background: hex1 + '22', color: hex1 }}>
                <BgColorsOutlined />
              </span>
              <div className="statBody">
                <span className="statLabel">Primary</span>
                <span className="statValue">{hex1.toUpperCase()}</span>
              </div>
            </div>
            <div className="statChip">
              <span
                className="statIcon"
                style={{
                  background: toTiny(baseColor).toHexString() + '22',
                  color: toTiny(baseColor).toHexString(),
                }}
              >
                <AppstoreOutlined />
              </span>
              <div className="statBody">
                <span className="statLabel">Palette</span>
                <span className="statValue">
                  {palette.length} colors · {harmony}
                </span>
              </div>
            </div>
            <div
              className={`statChip ${rating.tone === 'success' ? 'success' : rating.tone === 'warning' ? '' : 'danger'}`}
            >
              <span className="statIcon">
                {rating.ok ? <CheckCircleFilled /> : <CloseCircleFilled />}
              </span>
              <div className="statBody">
                <span className="statLabel">Contrast</span>
                <span className="statValue">
                  {contrastRatio.toFixed(2)} · {rating.label}
                </span>
              </div>
            </div>
            <div className="statChip">
              <span className="statIcon">
                <ThunderboltOutlined />
              </span>
              <div className="statBody">
                <span className="statLabel">Swatches</span>
                <span className="statValue">{swatches.length} saved</span>
              </div>
            </div>
          </div>

          {/* === Saved swatches === */}
          {swatches.length > 0 && (
            <div className="panel swatchesPanel">
              <div className="panelHeader">
                <span className="panelTitle">
                  <HighlightOutlined /> Saved swatches
                </span>
                <Button size="small" type="text" danger onClick={() => setSwatches([])}>
                  Clear all
                </Button>
              </div>
              <div className="swatchRow">
                {swatches.map((c) => (
                  <Tooltip key={c} title={c.toUpperCase()}>
                    <span
                      className="savedSwatch"
                      style={{ background: c }}
                      onClick={() => handleCopy(c)}
                    >
                      <Button
                        size="small"
                        type="text"
                        shape="circle"
                        icon={<DeleteOutlined />}
                        className="savedRemove"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSwatch(c);
                        }}
                      />
                    </span>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}

          {/* === Tabs === */}
          <div className="panel tabsPanel">
            <Tabs
              activeKey={activeTab}
              onChange={(k) => setActiveTab(k as any)}
              items={[
                {
                  key: 'picker',
                  label: (
                    <span>
                      <BgColorsOutlined /> Picker &amp; Gradient
                    </span>
                  ),
                  children: renderPickerTab(),
                },
                {
                  key: 'palette',
                  label: (
                    <span>
                      <AppstoreOutlined /> Palette
                    </span>
                  ),
                  children: renderPaletteTab(),
                },
                {
                  key: 'contrast',
                  label: (
                    <span>
                      <EyeOutlined /> Contrast
                    </span>
                  ),
                  children: renderContrastTab(),
                },
                {
                  key: 'image',
                  label: (
                    <span>
                      <FileImageOutlined /> From Image
                    </span>
                  ),
                  children: renderImageTab(),
                },
                {
                  key: 'guide',
                  label: (
                    <span>
                      <BookOutlined /> Guide
                    </span>
                  ),
                  children: (
                    <div className="guideList">
                      <div className="guideItem">
                        <BgColorsOutlined />
                        <div>
                          <strong>Picker &amp; Gradient</strong>
                          Choose a single color or build a two-stop linear gradient with adjustable
                          angle. All HEX / RGB / HSL / HSV values are one click to copy.
                        </div>
                      </div>
                      <div className="guideItem">
                        <AppstoreOutlined />
                        <div>
                          <strong>Palette harmonies</strong>
                          Generate <code>monochromatic</code>, <code>analogous</code>,{' '}
                          <code>complementary</code>, <code>triad</code>, <code>tetrad</code>, or{' '}
                          <code>split-complement</code> palettes from a base color.
                        </div>
                      </div>
                      <div className="guideItem">
                        <EyeOutlined />
                        <div>
                          <strong>Contrast (WCAG 2.1)</strong>
                          Live ratio with AA / AAA pass-fail breakdown. Aim for ≥ 4.5 for normal
                          text, ≥ 3 for large/bold.
                        </div>
                      </div>
                      <div className="guideItem">
                        <FileImageOutlined />
                        <div>
                          <strong>From image</strong>
                          Drop an image and click any pixel to sample its color. Recent picks are
                          kept for quick re-use.
                        </div>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>
      {dragging && <DragOverlay />}
    </DragDropWrapper>
  );
};

export default ColorPickerPage;
