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
  SettingOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  FieldTimeOutlined,
  TeamOutlined,
  HistoryOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Collapse,
  Progress,
  Space,
  Tabs,
  Tag,
  Tooltip,
  Tour,
  Typography,
} from 'antd';
import type { TourProps } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import AssertionsConfig from './components/AssertionsConfig';
import CSVDataSetConfig from './components/CSVDataSetConfig';
import ExtractorsConfig from './components/ExtractorsConfig';
import LiveLog from './components/LiveLog';
import LoadConfig from './components/LoadConfig';
import RequestConfig from './components/RequestConfig';
import ResultsSummary from './components/ResultsSummary';
import ResultsTable from './components/ResultsTable';
import TestPlanManager from './components/TestPlanManager';
import UserVariablesConfig from './components/UserVariablesConfig';
import { useStressTest } from './hooks/useStressTest';
import type { TestConfig } from './types';
import { DEFAULT_CONFIG, formatDuration } from './types';
import './styles.less';

const { Title, Text } = Typography;

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
  const refPanelVars = useRef<HTMLDivElement>(null);
  const refRunBtn = useRef<HTMLDivElement>(null);
  const refToolbar = useRef<HTMLDivElement>(null);
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
        'This tool lets you perform HTTP load testing similar to Apache JMeter — right from your browser.',
      target: null,
    },
    {
      title: '💾 Test Plan Manager',
      description:
        'Save your test configurations for later, load previously saved plans, or import/export as JSON files.',
      target: () => refTestPlan.current!,
      placement: 'bottom',
    },
    {
      title: '⚙️ Configuration Panels',
      description:
        'Five panels — request, threads, assertions, extractors, CSV data, and user variables.',
      target: () => refConfig.current!,
      placement: 'top',
    },
    {
      title: '🌐 HTTP Request',
      description:
        'Define the HTTP request: method, URL, headers, cookies, body. All fields support `${variable}` placeholders.',
      target: () => refPanelRequest.current!,
      placement: 'bottom',
    },
    {
      title: '🧵 Thread Group',
      description:
        'Concurrency, ramp-up, schedule mode (request count or duration), startup delay, and per-thread think-time timer.',
      target: () => refPanelLoad.current!,
      placement: 'bottom',
    },
    {
      title: '✅ Assertions',
      description:
        'Validate every response: status code, body contains/regex, response time, JSON path, or header value.',
      target: () => refPanelAssertions.current!,
      placement: 'bottom',
    },
    {
      title: '🔗 Post-Processors / Extractors',
      description:
        'Extract values via regex, JSON path, CSS selector, or response header — reuse them as `${var}` in subsequent requests.',
      target: () => refPanelExtractors.current!,
      placement: 'bottom',
    },
    {
      title: '📋 CSV Data Set Config',
      description:
        'Parameterize requests with external CSV data. Header row defines variable names.',
      target: () => refPanelCSV.current!,
      placement: 'top',
    },
    {
      title: '▶️ Run Your Test',
      description: 'Start, pause/resume, or stop. Live stats and progress update in real-time.',
      target: () => refRunBtn.current!,
      placement: 'bottom',
    },
    {
      title: '🧹 Toolbar Actions',
      description: 'Clear all results or export every request as CSV.',
      target: () => refToolbar.current!,
      placement: 'bottom',
    },
    {
      title: '📊 Results & Reports',
      description:
        'Three tabs: Aggregate Report (P50–P99, throughput, error rate), Results Table (per-request rows), and Results Tree (live log).',
      target: null,
    },
    {
      title: '🚀 Quick Start',
      description: 'Try `https://jsonplaceholder.typicode.com/posts` for a quick test.',
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

  const totalCompleted = stats?.completedRequests ?? liveStats.completed;
  const totalSuccess = stats?.successCount ?? liveStats.success;
  const totalErrors = stats?.errorCount ?? liveStats.errors;
  const errorRate = useMemo(() => {
    if (!totalCompleted) return 0;
    return (totalErrors / totalCompleted) * 100;
  }, [totalCompleted, totalErrors]);
  const throughput = useMemo(() => {
    if (stats?.throughput) return stats.throughput;
    const sec = (liveStats.elapsed || 0) / 1000;
    if (!sec || !totalCompleted) return 0;
    return totalCompleted / sec;
  }, [liveStats.elapsed, stats, totalCompleted]);

  const heroStatusLabel = isRunning
    ? isPaused
      ? 'Paused'
      : 'Running'
    : stats
      ? errorRate > 0
        ? 'Completed with errors'
        : 'Completed'
      : 'Idle';
  const heroStatusTone: 'idle' | 'running' | 'paused' | 'success' | 'danger' = isRunning
    ? isPaused
      ? 'paused'
      : 'running'
    : stats
      ? errorRate > 0
        ? 'danger'
        : 'success'
      : 'idle';

  const ghostButtonStyle = {
    background: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.25)',
    color: '#fff',
  };

  return (
    <div className="container stressTestPage">
      <div className="shell">
        {/* === Hero === */}
        <div className="hero">
          <div className="heroOverlay" />
          <div className="heroRow">
            <div className="heroTitleBlock">
              <span className="heroBadge">
                <ThunderboltOutlined />
              </span>
              <div>
                <span className="heroEyebrow">Stress Test</span>
                <Title level={4} style={{ color: '#fff', margin: '4px 0 0', lineHeight: 1.25 }}>
                  HTTP load testing — JMeter-style, in your browser
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                  Threads · ramp-up · timers · assertions · extractors · CSV · live aggregate report
                </Text>
              </div>
              <span className={`heroStatus heroStatus-${heroStatusTone}`}>
                <span className="heroStatusDot" />
                {heroStatusLabel}
              </span>
            </div>
            <Space className="heroActions" wrap>
              <div ref={refRunBtn} style={{ display: 'inline-flex', gap: 8 }}>
                {!isRunning ? (
                  <Button
                    className="primaryAction"
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
                      style={ghostButtonStyle}
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
                <Tooltip title="Clear all results">
                  <Button
                    icon={<ClearOutlined />}
                    onClick={clearResults}
                    disabled={isRunning}
                    style={ghostButtonStyle}
                  >
                    Clear
                  </Button>
                </Tooltip>
                <Tooltip title="Export results to CSV">
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() => exportCSV(results)}
                    disabled={results.length === 0}
                    style={ghostButtonStyle}
                  >
                    Export
                  </Button>
                </Tooltip>
              </div>
              <Tooltip title="Help tour">
                <Button
                  icon={<QuestionCircleOutlined />}
                  onClick={() => setTourOpen(true)}
                  shape="circle"
                  style={ghostButtonStyle}
                />
              </Tooltip>
            </Space>
          </div>
        </div>

        {/* === Stat strip === */}
        <div className="statStrip">
          <div className="statChip">
            <span className="statIcon">
              <RocketOutlined />
            </span>
            <div className="statBody">
              <span className="statLabel">Completed</span>
              <span className="statValue">{totalCompleted.toLocaleString()}</span>
            </div>
          </div>
          <div className={`statChip ${totalSuccess > 0 ? 'success' : ''}`}>
            <span className="statIcon">
              <CheckCircleFilled />
            </span>
            <div className="statBody">
              <span className="statLabel">Success</span>
              <span className="statValue">{totalSuccess.toLocaleString()}</span>
            </div>
          </div>
          <div className={`statChip ${totalErrors > 0 ? 'danger' : ''}`}>
            <span className="statIcon">
              <CloseCircleFilled />
            </span>
            <div className="statBody">
              <span className="statLabel">Errors</span>
              <span className="statValue">
                {totalErrors.toLocaleString()}
                {totalCompleted > 0 && <span className="statSub"> · {errorRate.toFixed(1)}%</span>}
              </span>
            </div>
          </div>
          <div className="statChip">
            <span className="statIcon">
              <FieldTimeOutlined />
            </span>
            <div className="statBody">
              <span className="statLabel">Avg response</span>
              <span className="statValue">
                {formatDuration(stats?.avgResponseTime ?? liveStats.avgTime)}
              </span>
            </div>
          </div>
          <div className="statChip">
            <span className="statIcon">
              <TeamOutlined />
            </span>
            <div className="statBody">
              <span className="statLabel">Threads</span>
              <span className="statValue">
                {isRunning ? liveStats.activeThreads : stats ? config.concurrency : 0}
                <span className="statSub"> / {config.concurrency}</span>
              </span>
            </div>
          </div>
          <div className="statChip">
            <span className="statIcon">
              <DashboardOutlined />
            </span>
            <div className="statBody">
              <span className="statLabel">Throughput</span>
              <span className="statValue">{throughput.toFixed(1)} req/s</span>
            </div>
          </div>
          <div className="statChip">
            <span className="statIcon">
              <HistoryOutlined />
            </span>
            <div className="statBody">
              <span className="statLabel">Elapsed</span>
              <span className="statValue">{formatDuration(liveStats.elapsed)}</span>
            </div>
          </div>
        </div>

        {/* === Live Progress === */}
        {(isRunning || results.length > 0) && (
          <div className="panel progressPanel">
            <div className="panelHeader">
              <span className="panelTitle">
                <DashboardOutlined /> Live progress
              </span>
              <Space size={6} wrap>
                <Tag color="blue" style={{ margin: 0 }}>
                  {config.scheduleMode === 'duration'
                    ? `${config.duration}s window`
                    : `${config.totalRequests} reqs`}
                </Tag>
                <Tag style={{ margin: 0 }}>{config.concurrency} threads</Tag>
                {config.rampUpTime > 0 && (
                  <Tag style={{ margin: 0 }}>ramp {config.rampUpTime}s</Tag>
                )}
              </Space>
            </div>
            <Progress
              percent={progressPercent}
              status={isRunning ? 'active' : stats ? 'success' : 'normal'}
              strokeColor={{ '0%': '#108ee9', '100%': '#fa541c' }}
              format={() => progressFormat}
            />
          </div>
        )}

        {/* === Test Plan Manager === */}
        <div ref={refTestPlan} className="panel planPanel">
          <TestPlanManager config={config} onLoad={setConfig} disabled={isRunning} />
        </div>

        {/* === Configuration === */}
        <div ref={refConfig} className="panel configPanel">
          <div className="panelHeader">
            <span className="panelTitle">
              <SettingOutlined /> Configuration
            </span>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Request · Thread group · Assertions · Extractors · CSV · Variables
            </Text>
          </div>
          <Collapse
            defaultActiveKey={['request', 'load']}
            className="configCollapse"
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
              {
                key: 'variables',
                label: (
                  <div ref={refPanelVars}>
                    <Space>
                      <SettingOutlined />
                      <span>User Defined Variables</span>
                      {config.userVariables.length > 0 && (
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          ({config.userVariables.filter((v) => v.enabled).length} active)
                        </Text>
                      )}
                    </Space>
                  </div>
                ),
                children: (
                  <UserVariablesConfig
                    config={config}
                    onChange={updateConfig}
                    disabled={isRunning}
                  />
                ),
              },
            ]}
          />
        </div>

        {/* === Results === */}
        {(stats || results.length > 0) && (
          <div className="panel resultsSection" ref={refResults}>
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

        {/* === Limitations === */}
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          className="limitationsAlert"
          message="Browser-side limitations"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>
                Subject to <strong>CORS restrictions</strong> — target APIs must allow cross-origin
                requests or be proxied.
              </li>
              <li>No TCP-level metrics; connection pooling is handled by the browser.</li>
              <li>No distributed testing (single browser tab).</li>
              <li>Test plans stored in localStorage (not shared across devices).</li>
              <li>
                Concurrency capped by <strong>browser connection limits</strong> (~6/domain
                HTTP/1.1, more on HTTP/2).
              </li>
            </ul>
          }
        />
      </div>

      <Tour open={tourOpen} onClose={() => setTourOpen(false)} steps={tourSteps} type="primary" />
    </div>
  );
};

export default StressTestPage;
