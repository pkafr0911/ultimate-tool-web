import { APP_NAME, pages } from '@/constants';
import {
  ApiOutlined,
  CloudServerOutlined,
  CodeOutlined,
  CoffeeOutlined,
  DatabaseOutlined,
  GithubOutlined,
  GlobalOutlined,
  HeartFilled,
  LinkedinOutlined,
  MailOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import { Link } from '@umijs/max';
import { Button, Tag, Tooltip } from 'antd';
import React from 'react';
import './styles.less';

/* ───────── helpers ───────── */
const useCountUp = (target: number, duration = 1400, start = true) => {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
};

/* ───────── data ───────── */
const FEATURED_PROJECTS = [
  {
    name: 'DNS Load Balancer',
    role: 'Author · Lead Engineer',
    period: '2024 — Present',
    accent: '#1677ff',
    accentSoft: 'rgba(22, 119, 255, 0.16)',
    icon: <GlobalOutlined />,
    summary:
      'High-performance DNS server in Go with etcd-backed dynamic configuration, weighted round-robin balancing, sharded response cache, and a separate health-checker binary publishing lease-based status to etcd.',
    stack: ['Go', 'etcd', 'DNS', 'sync.Pool', 'SO_REUSEPORT', 'pprof', 'Docker', 'JMeter'],
    highlights: [
      '~138ns cache hit · 0 allocations on the hot path',
      'Per-CPU UDP listeners with sharded response cache (256 shards)',
      'Atomic snapshot registry — pre-filtered IPv4/IPv6 + weight tables',
      'Standalone health-checker with TCP/HTTP/ICMP probes & etcd leases',
    ],
  },
  {
    name: 'MultiCDN Console API',
    role: 'Backend Engineer',
    period: '2023 — Present',
    accent: '#722ed1',
    accentSoft: 'rgba(114, 46, 209, 0.16)',
    icon: <CloudServerOutlined />,
    summary:
      'Control-plane API for a multi-CDN platform — orchestrates Akamai, Alibaba, Amazon, BytePlus, CDNetwork, Velocix, Viettel, VNetwork, Zenlayer and EVG behind a single management surface.',
    stack: ['Go', 'PostgreSQL', 'Elastic', 'PowerDNS', 'JWT/SSO', 'Docker', 'E2E (Cypress/Newman)'],
    highlights: [
      '10+ CDN provider integrations under a unified driver layer',
      'GeoIP-aware DNS load-balancing & failover orchestration',
      'Pluggable auth (JWT + SSO) with 2FA, account lifecycle & email flows',
      'Schema-driven configuration with live validation',
    ],
  },
  {
    name: `${APP_NAME} Web`,
    role: 'Solo Project · You are here',
    period: '2024 — Present',
    accent: '#eb2f96',
    accentSoft: 'rgba(235, 47, 150, 0.16)',
    icon: <RocketOutlined />,
    summary:
      'A polished collection of 35+ developer & creative tools — Playground, OCR, photo & vector editors, Mermaid, encryption, device tests, games and more — all running fully client-side.',
    stack: ['React 18', 'TypeScript', 'UmiJS', 'Ant Design 5', 'Monaco', 'Mermaid', 'Tesseract.js'],
    highlights: [
      'Hero + workspace shell design system shared across every page',
      'Native fullscreen editors (PhotoEditor, ReadmeEditor)',
      'OCR, AES, JWT, Base64, ASCII art — 100% in the browser',
      'Dark mode, drag-drop, Google Drive sync',
    ],
  },
];

const TECH_STACK = [
  { label: 'Go', color: '#00ADD8' },
  { label: 'TypeScript', color: '#3178C6' },
  { label: 'React', color: '#61DAFB' },
  { label: 'Node.js', color: '#3C873A' },
  { label: 'PostgreSQL', color: '#336791' },
  { label: 'etcd', color: '#419EDA' },
  { label: 'Docker', color: '#2496ED' },
  { label: 'Kubernetes', color: '#326CE5' },
  { label: 'Ant Design', color: '#1677ff' },
  { label: 'UmiJS', color: '#722ed1' },
  { label: 'Monaco', color: '#0e639c' },
  { label: 'Mermaid', color: '#ff3670' },
  { label: 'Less', color: '#1d365d' },
  { label: 'Tesseract', color: '#52c41a' },
  { label: 'gRPC', color: '#244c5a' },
  { label: 'DNS', color: '#fa8c16' },
  { label: 'Elasticsearch', color: '#0058a3' },
  { label: 'JWT', color: '#000' },
  { label: 'Redis', color: '#dc382d' },
  { label: 'Linux', color: '#fcc624' },
];

const ACKNOWLEDGEMENTS = [
  'React',
  'UmiJS / @umijs/max',
  'Ant Design',
  'Monaco Editor',
  'Mermaid',
  'Tesseract.js',
  'Konva',
  'Fabric.js',
  'CryptoJS',
  'jose (JWT)',
  'qrcode',
  'lodash',
  'dayjs',
  'react-icons',
  'Less',
  'Lenis',
  'Framer Motion',
];

const CreditsPage: React.FC = () => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const yearsCoding = useCountUp(4, 1300, mounted);
  const toolsBuilt = useCountUp(pages.length, 1500, mounted);
  const technologies = useCountUp(TECH_STACK.length, 1400, mounted);
  const coffees = useCountUp(999, 1700, mounted);

  return (
    <div className="container creditsPage">
      <div className="shell">
        {/* ─── Hero ─── */}
        <section className="hero">
          <div className="heroOrbs">
            <span className="orb orb1" />
            <span className="orb orb2" />
            <span className="orb orb3" />
          </div>
          <div className="heroOverlay" />

          <div className="heroInner">
            <span className="heroEyebrow">Credits · Portfolio</span>
            <h1 className="heroTitle">
              <span className="grad">Thanh ND</span>
              <span className="heroTitleDot">·</span>
              <span className="heroTitleSub">Backend &amp; Full-stack Engineer</span>
            </h1>
            <p className="heroSubtitle">
              I design and build high-performance distributed systems by day, and obsess over
              beautiful developer tools by night. This page is a small thank-you to every project,
              library and cup of coffee that made this app possible.
            </p>

            <div className="heroActions">
              <Tooltip title="GitHub">
                <Button
                  shape="circle"
                  size="large"
                  className="socialBtn"
                  icon={<GithubOutlined />}
                  href="https://github.com/pkafr0911"
                  target="_blank"
                />
              </Tooltip>
              <Tooltip title="LinkedIn">
                <Button
                  shape="circle"
                  size="large"
                  className="socialBtn"
                  icon={<LinkedinOutlined />}
                  href="https://www.linkedin.com/"
                  target="_blank"
                />
              </Tooltip>
              <Tooltip title="Email">
                <Button
                  shape="circle"
                  size="large"
                  className="socialBtn"
                  icon={<MailOutlined />}
                  href="mailto:thanhnd091120@gmail.com"
                />
              </Tooltip>
              <Link to="/playground" className="primaryAction">
                <ThunderboltFilled /> Explore the playground
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Stat strip ─── */}
        <section className="statStrip">
          <div className="statChip">
            <CodeOutlined className="statIcon" />
            <div>
              <div className="statValue">{yearsCoding}+</div>
              <div className="statLabel">Years coding</div>
            </div>
          </div>
          <div className="statChip">
            <RocketOutlined className="statIcon" />
            <div>
              <div className="statValue">{toolsBuilt}+</div>
              <div className="statLabel">Tools shipped</div>
            </div>
          </div>
          <div className="statChip">
            <DatabaseOutlined className="statIcon" />
            <div>
              <div className="statValue">{technologies}+</div>
              <div className="statLabel">Technologies</div>
            </div>
          </div>
          <div className="statChip">
            <CoffeeOutlined className="statIcon" />
            <div>
              <div className="statValue">{coffees}+</div>
              <div className="statLabel">Cups of coffee</div>
            </div>
          </div>
        </section>

        {/* ─── Featured Projects ─── */}
        <section className="panel projectsPanel">
          <header className="panelHeader">
            <div className="panelTitleBlock">
              <span className="panelEyebrow">Featured Work</span>
              <h2 className="panelTitle">Projects I poured my heart into</h2>
            </div>
            <p className="panelSubtitle">
              Three flagship projects — two production backends and the front-end you&apos;re
              looking at right now.
            </p>
          </header>

          <div className="projectGrid">
            {FEATURED_PROJECTS.map((proj, i) => (
              <article
                key={proj.name}
                className="projectCard fadeInUp"
                style={
                  {
                    animationDelay: `${i * 120}ms`,
                    '--accent': proj.accent,
                    '--accent-soft': proj.accentSoft,
                  } as React.CSSProperties
                }
              >
                <div className="projectGlow" />
                <div className="projectHead">
                  <span className="projectIcon">{proj.icon}</span>
                  <div>
                    <div className="projectName">{proj.name}</div>
                    <div className="projectRole">
                      {proj.role} <span className="dot">·</span> {proj.period}
                    </div>
                  </div>
                </div>
                <p className="projectSummary">{proj.summary}</p>
                <ul className="projectHighlights">
                  {proj.highlights.map((h) => (
                    <li key={h}>
                      <SafetyCertificateOutlined className="checkIcon" /> {h}
                    </li>
                  ))}
                </ul>
                <div className="projectStack">
                  {proj.stack.map((s) => (
                    <span key={s} className="stackChip">
                      {s}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ─── Tech ticker ─── */}
        <section className="techTicker">
          <div className="tickerLabel">
            <ApiOutlined /> Tech I love working with
          </div>
          <div className="tickerTrack">
            <div className="tickerRow">
              {[...TECH_STACK, ...TECH_STACK].map((t, i) => (
                <span
                  key={`${t.label}-${i}`}
                  className="tickerChip"
                  style={{ ['--c' as any]: t.color }}
                >
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Tools in this app ─── */}
        <section className="panel toolsPanel">
          <header className="panelHeader">
            <div className="panelTitleBlock">
              <span className="panelEyebrow">Built into this app</span>
              <h2 className="panelTitle">{pages.length} tools, one tab</h2>
            </div>
            <p className="panelSubtitle">
              Every card below is a fully working tool inside this app — click any of them to jump
              straight in.
            </p>
          </header>

          <div className="toolGrid">
            {pages.map((p, i) => (
              <Link
                key={p.path}
                to={p.path}
                className="toolCard fadeInUp"
                style={{ animationDelay: `${Math.min(i, 24) * 30}ms` }}
              >
                <span className="toolIcon">{p.icon}</span>
                <div className="toolBody">
                  <div className="toolName">{p.name}</div>
                  <div className="toolDesc">{p.desc}</div>
                </div>
                <span className="toolArrow">→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── Acknowledgements ─── */}
        <section className="panel ackPanel">
          <header className="panelHeader">
            <div className="panelTitleBlock">
              <span className="panelEyebrow">Standing on shoulders of giants</span>
              <h2 className="panelTitle">Made with open-source love</h2>
            </div>
            <p className="panelSubtitle">
              None of this would exist without the incredible work of these communities. Thank you.
            </p>
          </header>
          <div className="ackChips">
            {ACKNOWLEDGEMENTS.map((a, i) => (
              <Tag key={a} className="ackChip fadeInUp" style={{ animationDelay: `${i * 35}ms` }}>
                {a}
              </Tag>
            ))}
          </div>
        </section>

        {/* ─── Footer CTA ─── */}
        <section className="ctaPanel">
          <div className="ctaContent">
            <h3 className="ctaTitle">
              Made with <HeartFilled className="ctaHeart" /> by Thanh ND
            </h3>
            <p className="ctaSubtitle">
              Got an idea, a bug, or just want to say hi? I&apos;d love to hear from you.
            </p>
            <div className="ctaActions">
              <Button
                type="primary"
                size="large"
                icon={<MailOutlined />}
                href="mailto:hello@example.com"
              >
                Get in touch
              </Button>
              <Button
                size="large"
                icon={<GithubOutlined />}
                href="https://github.com/"
                target="_blank"
              >
                View on GitHub
              </Button>
            </div>
            <div className="ctaCopyright">
              © {new Date().getFullYear()} Thanh ND · All rights reserved.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CreditsPage;
