/**
 * Loading placeholder
 * Shown while the React bundle parses + boots, so the user never sees a blank screen.
 *
 * Design goals:
 *   - Branded gradient backdrop (matches the in-app hero gradient: #1f1c2c → #4b2b7e → #1890ff)
 *   - Animated logo with concentric rings
 *   - Indeterminate progress shimmer + rotating "tip" copy
 *   - Honors prefers-reduced-motion
 */
(function () {
  document.title = 'Ultimate Tool — Loading…';

  const root = document.querySelector('#root');
  if (!root || root.innerHTML !== '') return;

  const TIPS = [
    'Warming up the workspace…',
    'Polishing pixels…',
    'Optimizing SVG paths…',
    'Compiling tools…',
    'Brewing developer goodies…',
    'Loading 35+ utilities…',
  ];

  root.innerHTML = `
    <style>
      :root {
        --utl-bg-1: #1f1c2c;
        --utl-bg-2: #4b2b7e;
        --utl-bg-3: #1890ff;
        --utl-fg: #ffffff;
        --utl-fg-dim: rgba(255, 255, 255, 0.72);
        --utl-fg-muted: rgba(255, 255, 255, 0.5);
        --utl-glass: rgba(255, 255, 255, 0.08);
        --utl-glass-border: rgba(255, 255, 255, 0.18);
      }

      html, body, #root {
        height: 100%;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          "Helvetica Neue", Arial, sans-serif;
        overflow: hidden;
      }

      .utl-loader {
        position: fixed;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 26px;
        color: var(--utl-fg);
        background:
          radial-gradient(900px 500px at 12% 10%, rgba(24, 144, 255, 0.35), transparent 60%),
          radial-gradient(900px 500px at 88% 90%, rgba(114, 46, 209, 0.4), transparent 60%),
          linear-gradient(135deg, var(--utl-bg-1) 0%, var(--utl-bg-2) 55%, var(--utl-bg-3) 120%);
        overflow: hidden;
        isolation: isolate;
      }

      /* Subtle moving grid */
      .utl-loader::before {
        content: '';
        position: absolute;
        inset: -50%;
        background-image:
          linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
        background-size: 48px 48px;
        animation: utl-drift 24s linear infinite;
        z-index: -1;
        opacity: 0.55;
      }

      /* Soft floating glow */
      .utl-loader::after {
        content: '';
        position: absolute;
        inset: 0;
        background:
          radial-gradient(140px 140px at 30% 70%, rgba(255, 255, 255, 0.18), transparent 70%);
        filter: blur(2px);
        z-index: -1;
        animation: utl-pulse 6s ease-in-out infinite;
      }

      @keyframes utl-drift {
        from { transform: translate(0, 0); }
        to   { transform: translate(48px, 48px); }
      }

      @keyframes utl-pulse {
        0%, 100% { opacity: 0.55; }
        50%      { opacity: 0.95; }
      }

      /* === Logo block === */
      .utl-logo-wrap {
        position: relative;
        width: 132px;
        height: 132px;
        display: grid;
        place-items: center;
      }

      .utl-ring {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 2px solid transparent;
      }
      .utl-ring--1 {
        border-top-color: #fff;
        border-right-color: rgba(255, 255, 255, 0.4);
        animation: utl-spin 1.6s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite;
      }
      .utl-ring--2 {
        inset: 14px;
        border-bottom-color: rgba(255, 255, 255, 0.85);
        border-left-color: rgba(255, 255, 255, 0.25);
        animation: utl-spin 2.4s linear infinite reverse;
      }
      .utl-ring--3 {
        inset: 28px;
        border-top-color: rgba(255, 255, 255, 0.6);
        border-right-color: rgba(255, 255, 255, 0.15);
        animation: utl-spin 3.2s ease-in-out infinite;
      }

      .utl-logo {
        position: relative;
        width: 64px;
        height: 64px;
        border-radius: 18px;
        background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.85) 100%);
        display: grid;
        place-items: center;
        box-shadow:
          0 12px 30px -12px rgba(0, 0, 0, 0.5),
          0 0 0 1px rgba(255, 255, 255, 0.4) inset;
        animation: utl-float 3.5s ease-in-out infinite;
      }

      .utl-logo svg {
        width: 32px;
        height: 32px;
      }

      @keyframes utl-spin {
        to { transform: rotate(360deg); }
      }
      @keyframes utl-float {
        0%, 100% { transform: translateY(0); }
        50%      { transform: translateY(-6px); }
      }

      /* === Brand text === */
      .utl-brand {
        font-size: 22px;
        font-weight: 700;
        letter-spacing: 0.4px;
        background: linear-gradient(90deg, #fff 0%, #cfe7ff 50%, #fff 100%);
        background-size: 200% 100%;
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        animation: utl-shine 4s linear infinite;
      }
      .utl-tagline {
        font-size: 11px;
        letter-spacing: 4px;
        text-transform: uppercase;
        color: var(--utl-fg-muted);
      }

      @keyframes utl-shine {
        from { background-position: 200% 0; }
        to   { background-position: -200% 0; }
      }

      /* === Progress bar === */
      .utl-bar {
        position: relative;
        width: min(360px, 70vw);
        height: 4px;
        border-radius: 999px;
        background: var(--utl-glass);
        border: 1px solid var(--utl-glass-border);
        overflow: hidden;
      }
      .utl-bar > span {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 40%;
        border-radius: 999px;
        background: linear-gradient(90deg, transparent, #fff 30%, #fff 70%, transparent);
        animation: utl-bar-slide 1.6s ease-in-out infinite;
      }
      @keyframes utl-bar-slide {
        0%   { left: -45%; }
        100% { left: 105%; }
      }

      .utl-tip {
        font-size: 13px;
        color: var(--utl-fg-dim);
        height: 18px;
        text-align: center;
        max-width: 80vw;
        transition: opacity 0.35s ease;
      }

      .utl-hint {
        position: absolute;
        bottom: 22px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 11px;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: var(--utl-fg-muted);
      }

      /* Respect reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .utl-loader::before,
        .utl-loader::after,
        .utl-ring--1, .utl-ring--2, .utl-ring--3,
        .utl-logo, .utl-brand, .utl-bar > span {
          animation: none !important;
        }
      }
    </style>

    <div class="utl-loader" role="status" aria-live="polite" aria-label="Loading Ultimate Tool">
      <div class="utl-logo-wrap">
        <div class="utl-ring utl-ring--1"></div>
        <div class="utl-ring utl-ring--2"></div>
        <div class="utl-ring utl-ring--3"></div>
        <div class="utl-logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="utl-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#1f1c2c"/>
                <stop offset="0.55" stop-color="#4b2b7e"/>
                <stop offset="1" stop-color="#1890ff"/>
              </linearGradient>
            </defs>
            <path
              fill="url(#utl-grad)"
              d="M12 2.5l2.4 5 5.5.5-4.1 3.7 1.2 5.4L12 14.4l-5 2.7 1.2-5.4L4.1 8l5.5-.5L12 2.5z"
            />
          </svg>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
        <div class="utl-brand">Ultimate Tool</div>
        <div class="utl-tagline">35+ Developer Utilities</div>
      </div>

      <div class="utl-bar" aria-hidden="true"><span></span></div>
      <div class="utl-tip" id="utl-tip">Warming up the workspace…</div>

      <div class="utl-hint">First load may take a moment</div>
    </div>
  `;

  const tipEl = document.getElementById('utl-tip');
  let tipIndex = 0;
  if (tipEl) {
    setInterval(function () {
      tipIndex = (tipIndex + 1) % TIPS.length;
      tipEl.style.opacity = '0';
      setTimeout(function () {
        tipEl.textContent = TIPS[tipIndex];
        tipEl.style.opacity = '1';
      }, 350);
    }, 2400);
  }
})();
