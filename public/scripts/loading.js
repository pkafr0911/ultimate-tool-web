/**
 * Loading placeholder
 * Solves the issue of a blank screen during the initial load.
 */
(function () {
  document.title = "Ultimate Tool - Loading..."; // Update the title here
  const _root = document.querySelector('#root');
  if (_root && _root.innerHTML === '') {
    _root.innerHTML = `
      <style>
        html,
        body,
        :root {
          --accent-color: #1677ff;
          --bg-light: #f9fafb;
          --bg-dark: #0d1117;
          --text-light: #555;
          --text-dark: #bbb;
          --spinner-size: 48px;
        }
        #root {
          height: 100%;
          margin: 0;
          padding: 0;
        }
        #root {
          background-repeat: no-repeat;
          background-size: 100% auto;
        }

        body {
          background: var(--bg-light);
          color: var(--text-light);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.3s ease, color 0.3s ease;
        }

        @media (prefers-color-scheme: dark) {
          body {
            background: var(--bg-dark);
            color: var(--text-dark);
          }
        }

        .loading-title {
          font-size: 1.1rem;
        }

        .loading-sub-title {
          margin-top: 20px;
          font-size: 1rem;
          color: #888;
        }

        .page-loading-warp {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 26px;
        }
        .ant-spin {
          position: absolute;
          display: none;
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          color: #1890ff;
          font-size: 14px;
          line-height: 1.5;
          text-align: center;
          list-style: none;
          opacity: 0;
          transition: transform 0.3s cubic-bezier(0.78, 0.14, 0.15, 0.86);
          font-feature-settings: "tnum";
        }

        .ant-spin-spinning {
          position: static;
          display: inline-block;
          opacity: 1;
        }

        .ant-spin-dot {
          position: relative;
          display: inline-block;
          width: 20px;
          height: 20px;
          font-size: 20px;
        }

        .ant-spin-dot-item {
          position: absolute;
          display: block;
          width: 9px;
          height: 9px;
          background-color: #1890ff;
          border-radius: 100%;
          transform: scale(0.75);
          transform-origin: 50% 50%;
          opacity: 0.3;
          animation: antSpinMove 1s infinite linear alternate;
        }

        .ant-spin-dot-item:nth-child(1) {
          top: 0;
          left: 0;
        }

        .ant-spin-dot-item:nth-child(2) {
          top: 0;
          right: 0;
          animation-delay: 0.4s;
        }

        .ant-spin-dot-item:nth-child(3) {
          right: 0;
          bottom: 0;
          animation-delay: 0.8s;
        }

        .ant-spin-dot-item:nth-child(4) {
          bottom: 0;
          left: 0;
          animation-delay: 1.2s;
        }

        .ant-spin-dot-spin {
          transform: rotate(45deg);
          animation: antRotate 1.2s infinite linear;
        }

        .ant-spin-lg .ant-spin-dot {
          width: 32px;
          height: 32px;
          font-size: 32px;
        }

        .ant-spin-lg .ant-spin-dot i {
          width: 14px;
          height: 14px;
        }

        @media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
          .ant-spin-blur {
            background: #fff;
            opacity: 0.5;
          }
        }

        @keyframes antSpinMove {
          to {
            opacity: 1;
          }
        }

        @keyframes antRotate {
          to {
            transform: rotate(405deg);
          }
        }
      </style>

      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        min-height: 362px;
      ">
        <div class="page-loading-warp">
          <div class="ant-spin ant-spin-lg ant-spin-spinning">
            <span class="ant-spin-dot ant-spin-dot-spin">
              <i class="ant-spin-dot-item"></i>
              <i class="ant-spin-dot-item"></i>
              <i class="ant-spin-dot-item"></i>
              <i class="ant-spin-dot-item"></i>
            </span>
          </div>
        </div>
        <div class="loading-title">
          Loading resources...
        </div>
        <div class="loading-sub-title">
          The first-time load may take longer. Please be patient.
        </div>
      </div>
    `;
  }
})();
