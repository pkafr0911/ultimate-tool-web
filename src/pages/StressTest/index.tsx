import {
  ApiOutlined,
  CaretRightOutlined,
  CheckCircleOutlined,
  ClearOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DownloadOutlined,
  ExportOutlined,
  PauseOutlined,
  QuestionCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Progress,
  Row,
  Space,
  Tabs,
  Tour,
  Typography,
} from 'antd';
import type { TourProps } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import AssertionsConfig from './components/AssertionsConfig';
import CSVDataSetConfig from './components/CSVDataSetConfig';
import ExtractorsConfig from './components/ExtractorsConfig';
import LiveLog from './components/LiveLog';
import LoadConfig from './components/LoadConfig';
import RequestConfig from './components/RequestConfig';
import ResultsSummary from './components/ResultsSummary';
import ResultsTable from './components/ResultsTable';
import TestPlanManager from './components/TestPlanManager';
import { useStressTest } from './hooks/useStressTest';
import type { TestConfig } from './types';
import { DEFAULT_CONFIG, formatDuration } from './types';
import './styles.less';

const { Text } = Typography;

const StressTestPage: React.FC = () => {
  const [config, setConfig] = useState<TestConfig>({ ...DEFAULT_CONFIG });
  const [tourOpen, setTourOpen] = useState(false);
  const {
    isRunning,
    isPaused,
    results,
    stats,
    liveStats,
    runTest,
    stopTest,
    togglePause,
    clearResults,
    exportCSV,
  } = useStressTest();

  // Tour refs
  const refTestPlan = useRef<HTMLDivElement>(null);
  const refConfig = useRef<HTMLDivElement>(null);
  const refPanelRequest = useRef<HTMLDivElement>(null);
  const refPanelLoad = useRef<HTMLDivElement>(null);
  const refPanelAssertions = useRef<HTMLDivElement>(null);
  const refPanelExtractors = useRef<HTMLDivElement>(null);
  const refPanelCSV = useRef<HTMLDivElement>(null);
  const refRunBtn = useRef<HTMLDivElement>(null);
  const refToolbar = useRef<HTMLDivElement>(null);

  // Auto-scroll to results when test finishes
  const refResults = useRef<HTMLDivElement>(null);
  const prevIsRunning = useRef(false);

  useEffect(() => {
    if (prevIsRunning.current && !isRunning && refResults.current) {
      refResults.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    prevIsRunning.current = isRunning;
  }, [isRunning]);

  const tourSteps: TourProps['steps'] = [
    {
      title: '👋 Welcome to Stress Test',
      description:
        'This tool lets you perform HTTP load testing similar to Apache JMeter — right from your browser. Follow this quick tour to learn how to use it.',
      target: null,
    },
    {
      title: '💾 Test Plan Manager',
      description:
        "Save your test configurations for later, load previously saved plans, or import/export as JSON files. This works just like JMeter's .jmx test plan files.",
      target: () => refTestPlan.current!,
      placement: 'bottom',
    },
    {
      title: '⚙️ Configuration Panels',
      description:
        "Below are five configuration panels — each controls a different aspect of your test, just like JMeter's tree elements. Let's walk through each one.",
      target: () => refConfig.current!,
      placement: 'top',
    },
    {
      title: '🌐 HTTP Request',
      description:
        'Define the HTTP request to send:\n\n' +
        '• **Method** — GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS.\n' +
        '• **URL** — The full endpoint URL. Supports `${variable}` placeholders from extractors or CSV data.\n' +
        '• **Headers** — Add custom headers (e.g. Authorization, Accept). Use the key-value pairs editor.\n' +
        "• **Cookies** — Attach cookies by name/value/domain/path, like JMeter's HTTP Cookie Manager.\n" +
        '• **Body** — For POST/PUT/PATCH: choose a content type preset (JSON, Form, XML, Text, GraphQL) and write the request body. Body also supports variable substitution.',
      target: () => refPanelRequest.current!,
      placement: 'bottom',
    },
    {
      title: '🧵 Thread Group',
      description:
        "Control the load pattern — equivalent to JMeter's Thread Group:\n\n" +
        '• **Concurrency (Threads)** — Number of virtual users sending requests in parallel.\n' +
        '• **Schedule Mode** — Choose between a fixed **request count** or a **duration** (seconds) based run.\n' +
        '• **Total Requests** — How many requests to send in total (request-count mode).\n' +
        '• **Duration** — How long to keep sending requests (duration mode).\n' +
        '• **Ramp-Up Time** — Gradually increase threads over N seconds (avoids thundering herd start).\n' +
        '• **Startup Delay** — Wait N seconds before launching the first request.\n' +
        '• **Timer (Think Time)** — Add a delay between each request per thread. Choose from Constant, Uniform Random, Gaussian Random, or Poisson timers with configurable parameters.',
      target: () => refPanelLoad.current!,
      placement: 'bottom',
    },
    {
      title: '✅ Assertions',
      description:
        "Automatically validate every response — like JMeter's Response Assertion & JSON Assertion:\n\n" +
        '• **Status Code** — Check the HTTP status (e.g. equals 200, or not-equals 500).\n' +
        '• **Response Body Contains** — Verify the body contains a specific string.\n' +
        '• **Response Body Matches (Regex)** — Match body content against a regular expression.\n' +
        '• **Response Time** — Assert that the response is faster than a threshold (ms).\n' +
        '• **JSON Path** — Extract a value from the JSON body via a path (e.g. `$.data.id`) and compare it.\n' +
        '• **Header** — Check that a specific response header matches an expected value.\n\n' +
        'Each assertion can be individually enabled/disabled. Failed assertions are flagged in the results table.',
      target: () => refPanelAssertions.current!,
      placement: 'bottom',
    },
    {
      title: '🔗 Post-Processors / Extractors',
      description:
        "Extract values from responses and chain them into subsequent requests — like JMeter's Regular Expression Extractor & JSON Extractor:\n\n" +
        '• **Regex Extractor** — Apply a regex with a capture group to the response body. The matched value is stored in a named variable.\n' +
        '• **JSON Path Extractor** — Use a JSON path expression (e.g. `$.token`) to pull values from JSON responses.\n' +
        '• **CSS Selector Extractor** — Use a CSS selector + optional attribute to extract data from HTML responses.\n' +
        '• **Header Extractor** — Extract a value from a specific response header.\n\n' +
        'Extracted variables can be referenced as `${variableName}` in the URL, headers, cookies, or body of the request.',
      target: () => refPanelExtractors.current!,
      placement: 'bottom',
    },
    {
      title: '📋 CSV Data Set Config',
      description:
        "Parameterize your requests with external data — like JMeter's CSV Data Set Config:\n\n" +
        '• **Upload or paste** CSV data with a header row defining variable names.\n' +
        '• **Preview** your data in a table before running.\n' +
        '• Variables from the CSV are available as `${columnName}` in the URL, headers, body, and more.\n' +
        '• Each thread picks the next row in order — when all rows are used, it wraps around from the beginning.\n\n' +
        'Example: upload a CSV with columns `username,password` and use `${username}` and `${password}` in a POST body to test login with different credentials.',
      target: () => refPanelCSV.current!,
      placement: 'top',
    },
    {
      title: '▶️ Run Your Test',
      description:
        'Click "Run Test" to start. During execution you can Pause/Resume or Stop the test at any time. The progress bar and live stats cards will update in real-time.',
      target: () => refRunBtn.current!,
      placement: 'bottom',
    },
    {
      title: '🧹 Toolbar Actions',
      description:
        '• **Clear** — Reset all results.\n' +
        '• **Export CSV** — Download all request results as a CSV file with thread IDs, durations, assertions, and more.',
      target: () => refToolbar.current!,
      placement: 'bottom',
    },
    {
      title: '📊 Results & Reports',
      description:
        "After the test completes, you'll see three tabs:\n\n" +
        '• **Aggregate Report** — Summary stats: min/max/avg/P50/P90/P95/P99 response times, throughput, error rate, status code distribution, and response time histogram.\n' +
        '• **View Results in Table** — Detailed per-request table with expandable rows showing assertions, extracted variables, and response body snippets.\n' +
        '• **View Results Tree** — Live scrolling log of every request with timestamps and thread IDs.',
      target: null,
    },
    {
      title: '🚀 Quick Start Tips',
      description:
        '1. Paste a URL and click Run Test for a quick GET test.\n' +
        '2. Use the Thread Group to control concurrency and load pattern.\n' +
        '3. Add Assertions to automatically validate every response.\n' +
        '4. Use CSV Data Set to test with different data per request.\n' +
        '5. Save your plan so you can re-run it anytime!\n\n' +
        'Try it with: https://jsonplaceholder.typicode.com/posts',
      target: null,
    },
  ];

  const updateConfig = (patch: Partial<TestConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  const progressPercent =
    config.scheduleMode === 'duration'
      ? Math.min(100, Math.round((liveStats.elapsed / (config.duration * 1000)) * 100))
      : config.totalRequests > 0
        ? Math.round((liveStats.completed / config.totalRequests) * 100)
        : 0;

  const progressFormat =
    config.scheduleMode === 'duration'
      ? `${liveStats.completed} reqs — ${formatDuration(liveStats.elapsed)} / ${config.duration}s`
      : `${liveStats.completed} / ${config.totalRequests}`;

  return (
    <div className="stressTestPage">
      <Card
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#fa541c' }} />
            <span>Stress Test</span>
            {isRunning && (
              <span className="runningBadge">
                <span className="runningDot" /> RUNNING
              </span>
            )}
          </Space>
        }
        extra={
          <Space wrap>
            <div ref={refRunBtn} style={{ display: 'inline-flex' }}>
              {!isRunning ? (
                <Button
                  type="primary"
                  size="large"
                  icon={<CaretRightOutlined />}
                  onClick={() => runTest(config)}
                >
                  Run Test
                </Button>
              ) : (
                <Space>
                  <Button
                    icon={isPaused ? <CaretRightOutlined /> : <PauseOutlined />}
                    onClick={togglePause}
                  >
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button danger icon={<CloseOutlined />} onClick={stopTest}>
                    Stop
                  </Button>
                </Space>
              )}
            </div>
            <div ref={refToolbar} style={{ display: 'inline-flex', gap: 8 }}>
              <Button icon={<ClearOutlined />} onClick={clearResults} disabled={isRunning}>
                Clear
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => exportCSV(results)}
                disabled={results.length === 0}
              >
                Export CSV
              </Button>
            </div>
            <Button
              icon={<QuestionCircleOutlined />}
              onClick={() => setTourOpen(true)}
              shape="circle"
              title="Help Tour"
            />
          </Space>
        }
      >
        {/* ---- Test Plan Manager ---- */}
        <div ref={refTestPlan} style={{ marginBottom: 12 }}>
          <TestPlanManager config={config} onLoad={setConfig} disabled={isRunning} />
        </div>

        {/* ---- Configuration Panels ---- */}
        <div ref={refConfig}>
          <Collapse
            defaultActiveKey={['request', 'load']}
            style={{ marginBottom: 16 }}
            items={[
              {
                key: 'request',
                label: (
                  <div ref={refPanelRequest}>
                    <Space>
                      <ApiOutlined />
                      <span>HTTP Request</span>
                      {config.url && (
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {config.method} {config.url.slice(0, 60)}
                          {config.url.length > 60 ? '...' : ''}
                        </Text>
                      )}
                    </Space>
                  </div>
                ),
                children: (
                  <RequestConfig config={config} onChange={updateConfig} disabled={isRunning} />
                ),
              },
              {
                key: 'load',
                label: (
                  <div ref={refPanelLoad}>
                    <Space>
                      <DashboardOutlined />
                      <span>Thread Group</span>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {config.concurrency} threads ×{' '}
                        {config.scheduleMode === 'duration'
                          ? `${config.duration}s`
                          : `${config.totalRequests} reqs`}
                        {config.rampUpTime > 0 ? ` (ramp ${config.rampUpTime}s)` : ''}
                      </Text>
                    </Space>
                  </div>
                ),
                children: (
                  <LoadConfig config={config} onChange={updateConfig} disabled={isRunning} />
                ),
              },
              {
                key: 'assertions',
                label: (
                  <div ref={refPanelAssertions}>
                    <Space>
                      <CheckCircleOutlined />
                      <span>Assertions</span>
                      {config.assertions.length > 0 && (
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          ({config.assertions.filter((a) => a.enabled).length} active)
                        </Text>
                      )}
                    </Space>
                  </div>
                ),
                children: (
                  <AssertionsConfig config={config} onChange={updateConfig} disabled={isRunning} />
                ),
              },
              {
                key: 'extractors',
                label: (
                  <div ref={refPanelExtractors}>
                    <Space>
                      <ExportOutlined />
                      <span>Post-Processors / Extractors</span>
                      {config.extractors.length > 0 && (
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          ({config.extractors.filter((e) => e.enabled).length} active)
                        </Text>
                      )}
                    </Space>
                  </div>
                ),
                children: (
                  <ExtractorsConfig config={config} onChange={updateConfig} disabled={isRunning} />
                ),
              },
              {
                key: 'csv',
                label: (
                  <div ref={refPanelCSV}>
                    <Space>
                      <DatabaseOutlined />
                      <span>CSV Data Set Config</span>
                      {config.csvData.enabled && (
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          ({config.csvData.data.length} rows)
                        </Text>
                      )}
                    </Space>
                  </div>
                ),
                children: (
                  <CSVDataSetConfig config={config} onChange={updateConfig} disabled={isRunning} />
                ),
              },
            ]}
          />
        </div>

        {/* ---- Live Progress ---- */}
        {(isRunning || results.length > 0) && (
          <div className="progressSection">
            <Progress
              percent={progressPercent}
              status={isRunning ? 'active' : stats ? 'success' : 'normal'}
              strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
              format={() => progressFormat}
            />
          </div>
        )}

        {/* ---- Live Stats Cards ---- */}
        {(isRunning || stats) && (
          <Row gutter={[12, 12]} className="statsRow">
            <Col xs={8} sm={4}>
              <Card size="small" className="statCard info">
                <div className="statValue">{stats?.completedRequests ?? liveStats.completed}</div>
                <div className="statLabel">Completed</div>
              </Card>
            </Col>
            <Col xs={8} sm={4}>
              <Card size="small" className="statCard success">
                <div className="statValue">{stats?.successCount ?? liveStats.success}</div>
                <div className="statLabel">Success</div>
              </Card>
            </Col>
            <Col xs={8} sm={4}>
              <Card size="small" className="statCard error">
                <div className="statValue">{stats?.errorCount ?? liveStats.errors}</div>
                <div className="statLabel">Errors</div>
              </Card>
            </Col>
            <Col xs={8} sm={4}>
              <Card size="small" className="statCard warning">
                <div className="statValue">
                  {formatDuration(stats?.avgResponseTime ?? liveStats.avgTime)}
                </div>
                <div className="statLabel">Avg Response</div>
              </Card>
            </Col>
            <Col xs={8} sm={4}>
              <Card size="small" className="statCard info">
                <div className="statValue">
                  {isRunning ? liveStats.activeThreads : stats ? config.concurrency : 0}
                </div>
                <div className="statLabel">Threads</div>
              </Card>
            </Col>
            <Col xs={8} sm={4}>
              <Card size="small" className="statCard">
                <div className="statValue">{formatDuration(liveStats.elapsed)}</div>
                <div className="statLabel">Elapsed</div>
              </Card>
            </Col>
          </Row>
        )}

        {/* ---- Results Tabs ---- */}
        {(stats || results.length > 0) && (
          <div className="resultsSection" ref={refResults}>
            <Tabs
              defaultActiveKey="summary"
              items={[
                ...(stats
                  ? [
                      {
                        key: 'summary',
                        label: (
                          <span>
                            <DashboardOutlined /> Aggregate Report
                          </span>
                        ),
                        children: <ResultsSummary stats={stats} />,
                      },
                    ]
                  : []),
                {
                  key: 'table',
                  label: (
                    <span>
                      <ApiOutlined /> View Results in Table
                    </span>
                  ),
                  children: <ResultsTable results={results} />,
                },
                {
                  key: 'log',
                  label: (
                    <span>
                      <ClockCircleOutlined /> View Results Tree
                    </span>
                  ),
                  children: <LiveLog results={results} />,
                },
              ]}
            />
          </div>
        )}
        {/* ---- Limitations Warning ---- */}
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
          message="Limitations"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>
                Runs in the browser context, so subject to <strong>CORS restrictions</strong>{' '}
                (target APIs must allow cross-origin requests or use a proxy).
              </li>
              <li>No TCP-level metrics (connection pooling is handled by the browser).</li>
              <li>No distributed testing (single browser tab).</li>
              <li>localStorage-based test plan storage (not shared across devices).</li>
              <li>
                Max concurrency limited by <strong>browser connection limits</strong> (~6 per domain
                for HTTP/1.1, more for HTTP/2).
              </li>
            </ul>
          }
        />
      </Card>

      {/* ---- Guided Tour ---- */}
      <Tour open={tourOpen} onClose={() => setTourOpen(false)} steps={tourSteps} type="primary" />
    </div>
  );
};

export default StressTestPage;
