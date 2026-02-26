// =============================================
// StressTest – Shared Types, Constants, Helpers
// =============================================

// ---------- IDs ----------
export const generateId = () => Math.random().toString(36).substr(2, 9);

// ---------- Types ----------

export interface HeaderEntry {
  key: string;
  value: string;
  id: string;
  enabled: boolean;
}

export interface CookieEntry {
  name: string;
  value: string;
  domain: string;
  path: string;
  id: string;
  enabled: boolean;
}

/** JMeter-style assertion */
export interface Assertion {
  id: string;
  enabled: boolean;
  type:
    | 'response-code'
    | 'response-body'
    | 'response-time'
    | 'response-header'
    | 'json-path'
    | 'size';
  condition: 'equals' | 'contains' | 'not-contains' | 'matches' | 'greater-than' | 'less-than';
  target: string; // expected value or pattern
  name: string;
}

/** Variable extractor (like JMeter Post-Processors) */
export interface Extractor {
  id: string;
  enabled: boolean;
  type: 'regex' | 'json-path' | 'css-selector' | 'header';
  expression: string;
  variableName: string;
  matchNo: number; // 0 = random, -1 = all, n = nth
  defaultValue: string;
}

/** Timer config (like JMeter Timers) */
export interface TimerConfig {
  type: 'none' | 'constant' | 'uniform-random' | 'gaussian-random' | 'poisson';
  delay: number; // ms – constant delay or mean
  range: number; // ms – deviation / range for random timers
  enabled: boolean;
}

/** CSV Data Set config (like JMeter CSV Data Set Config) */
export interface CSVDataConfig {
  enabled: boolean;
  data: string[][]; // parsed rows
  headers: string[]; // column names → become ${var} in URL/body
  delimiter: string;
  recycle: boolean; // restart when exhausted
  shareMode: 'all' | 'thread'; // share rows across threads or per-thread
  currentIndex: number;
}

/** Thread Group schedule mode */
export type ScheduleMode = 'simple' | 'stepping' | 'duration';

export interface TestConfig {
  // -- Request --
  url: string;
  method: string;
  headers: HeaderEntry[];
  cookies: CookieEntry[];
  body: string;
  contentType: 'none' | 'json' | 'form' | 'xml' | 'text' | 'graphql';
  followRedirects: boolean;
  // -- Load / Thread Group --
  concurrency: number;
  totalRequests: number;
  rampUpTime: number; // s
  timeout: number; // ms
  iterations: number; // loops per thread (0 = use totalRequests)
  scheduleMode: ScheduleMode;
  duration: number; // s – for duration mode
  startupDelay: number; // s
  // -- Advanced --
  timer: TimerConfig;
  assertions: Assertion[];
  extractors: Extractor[];
  csvData: CSVDataConfig;
  keepAlive: boolean;
  connectTimeout: number; // ms
}

export interface AssertionResult {
  name: string;
  passed: boolean;
  message: string;
}

export interface RequestResult {
  index: number;
  threadId: number;
  iteration: number;
  status: number;
  statusText: string;
  duration: number; // ms
  latency: number; // time-to-first-byte ms
  connectTime: number; // ms
  size: number; // bytes
  sentBytes: number;
  error?: string;
  timestamp: number;
  url: string;
  assertions: AssertionResult[];
  extractedVars: Record<string, string>;
  responseHeaders: Record<string, string>;
  responseBodySnippet: string; // first 500 chars
}

export interface TestStats {
  totalRequests: number;
  completedRequests: number;
  successCount: number;
  errorCount: number;
  assertionFailures: number;
  minResponseTime: number;
  maxResponseTime: number;
  avgResponseTime: number;
  stdDevResponseTime: number;
  p50ResponseTime: number;
  p90ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  medianResponseTime: number;
  throughput: number; // req/s
  receivedKBPerSec: number;
  sentKBPerSec: number;
  totalDataReceived: number;
  totalDataSent: number;
  startTime: number;
  endTime: number;
  statusCodes: Record<number, number>;
  errorMessages: Record<string, number>;
  responseTimes: number[];
  // per-second throughput for time-series
  throughputOverTime: { time: number; count: number }[];
  responseTimeOverTime: { time: number; avg: number; max: number; min: number }[];
  activeThreadsOverTime: { time: number; threads: number }[];
}

export interface LiveStats {
  completed: number;
  success: number;
  errors: number;
  avgTime: number;
  activeThreads: number;
  elapsed: number; // ms
}

export interface TestPlan {
  id: string;
  name: string;
  config: TestConfig;
  createdAt: number;
  updatedAt: number;
}

// ---------- Defaults ----------

export const DEFAULT_TIMER: TimerConfig = {
  type: 'none',
  delay: 0,
  range: 0,
  enabled: false,
};

export const DEFAULT_CSV: CSVDataConfig = {
  enabled: false,
  data: [],
  headers: [],
  delimiter: ',',
  recycle: true,
  shareMode: 'all',
  currentIndex: 0,
};

export const DEFAULT_CONFIG: TestConfig = {
  url: '',
  method: 'GET',
  headers: [{ key: 'Content-Type', value: 'application/json', id: '1', enabled: true }],
  cookies: [],
  body: '',
  contentType: 'none',
  followRedirects: true,
  concurrency: 10,
  totalRequests: 100,
  rampUpTime: 0,
  timeout: 30000,
  iterations: 0,
  scheduleMode: 'simple',
  duration: 60,
  startupDelay: 0,
  timer: { ...DEFAULT_TIMER },
  assertions: [],
  extractors: [],
  csvData: { ...DEFAULT_CSV },
  keepAlive: true,
  connectTimeout: 5000,
};

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;

export const CONTENT_TYPES: Record<string, string> = {
  json: 'application/json',
  form: 'application/x-www-form-urlencoded',
  xml: 'application/xml',
  text: 'text/plain',
  graphql: 'application/json',
};

// ---------- Formatting Helpers ----------

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

export const percentile = (arr: number[], p: number): number => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
};

export const stdDev = (arr: number[]): number => {
  if (arr.length === 0) return 0;
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  const sqDiffs = arr.map((v) => Math.pow(v - avg, 2));
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / arr.length);
};

export const getStatusColor = (status: number) => {
  if (status === 0) return 'error';
  if (status < 300) return 'success';
  if (status < 400) return 'processing';
  if (status < 500) return 'warning';
  return 'error';
};

export const getDistribution = (responseTimes: number[], total: number) => {
  const buckets = [
    { label: '<100ms', min: 0, max: 100, count: 0, color: '#52c41a' },
    { label: '100-300ms', min: 100, max: 300, count: 0, color: '#73d13d' },
    { label: '300-500ms', min: 300, max: 500, count: 0, color: '#faad14' },
    { label: '500ms-1s', min: 500, max: 1000, count: 0, color: '#fa8c16' },
    { label: '1s-3s', min: 1000, max: 3000, count: 0, color: '#ff4d4f' },
    { label: '3s-5s', min: 3000, max: 5000, count: 0, color: '#cf1322' },
    { label: '>5s', min: 5000, max: Infinity, count: 0, color: '#820014' },
  ];
  responseTimes.forEach((t) => {
    for (const b of buckets) {
      if (t >= b.min && t < b.max) {
        b.count++;
        break;
      }
    }
  });
  return buckets;
};

/** Interpolate CSV variables in a string: ${colName} → value */
export const interpolateVars = (template: string, vars: Record<string, string>): string => {
  return template.replace(/\$\{(\w+)\}/g, (_, key) => vars[key] ?? `\${${key}}`);
};

/** Parse CSV text into rows */
export const parseCSV = (
  text: string,
  delimiter = ',',
): { headers: string[]; data: string[][] } => {
  const lines = text.trim().split('\n');
  if (lines.length === 0) return { headers: [], data: [] };
  const headers = lines[0].split(delimiter).map((h) => h.trim());
  const data = lines.slice(1).map((line) => line.split(delimiter).map((c) => c.trim()));
  return { headers, data };
};

// ---------- Test Plan Storage ----------

const STORAGE_KEY = 'stress-test-plans';

export const saveTestPlan = (plan: TestPlan) => {
  const plans = loadTestPlans();
  const idx = plans.findIndex((p) => p.id === plan.id);
  if (idx >= 0) {
    plans[idx] = { ...plan, updatedAt: Date.now() };
  } else {
    plans.push(plan);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
};

export const loadTestPlans = (): TestPlan[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const deleteTestPlan = (id: string) => {
  const plans = loadTestPlans().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
};
