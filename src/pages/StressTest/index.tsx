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
        'Configure your test here:\n\n' +
        '• **HTTP Request** — Set the URL, method, headers, cookies, and request body.\n' +
        '• **Thread Group** — Set number of virtual users (threads), total requests, ramp-up time, schedule mode, and think-time timers.\n' +
        '• **Assertions** — Validate responses (status code, body content, response time, JSON path, etc.).\n' +
        '• **Post-Processors** — Extract values from responses (regex, JSON path, CSS selector) for variable chaining.\n' +
        '• **CSV Data Set** — Parameterize requests with CSV data using ${variable} placeholders.',
      target: () => refConfig.current!,
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
                ),
                children: (
                  <RequestConfig config={config} onChange={updateConfig} disabled={isRunning} />
                ),
              },
              {
                key: 'load',
                label: (
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
                ),
                children: (
                  <LoadConfig config={config} onChange={updateConfig} disabled={isRunning} />
                ),
              },
              {
                key: 'assertions',
                label: (
                  <Space>
                    <CheckCircleOutlined />
                    <span>Assertions</span>
                    {config.assertions.length > 0 && (
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        ({config.assertions.filter((a) => a.enabled).length} active)
                      </Text>
                    )}
                  </Space>
                ),
                children: (
                  <AssertionsConfig config={config} onChange={updateConfig} disabled={isRunning} />
                ),
              },
              {
                key: 'extractors',
                label: (
                  <Space>
                    <ExportOutlined />
                    <span>Post-Processors / Extractors</span>
                    {config.extractors.length > 0 && (
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        ({config.extractors.filter((e) => e.enabled).length} active)
                      </Text>
                    )}
                  </Space>
                ),
                children: (
                  <ExtractorsConfig config={config} onChange={updateConfig} disabled={isRunning} />
                ),
              },
              {
                key: 'csv',
                label: (
                  <Space>
                    <DatabaseOutlined />
                    <span>CSV Data Set Config</span>
                    {config.csvData.enabled && (
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        ({config.csvData.data.length} rows)
                      </Text>
                    )}
                  </Space>
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
