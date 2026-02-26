import { message } from 'antd';
import { useCallback, useRef, useState } from 'react';
import type {
  Assertion,
  AssertionResult,
  CSVDataConfig,
  Extractor,
  LiveStats,
  RequestResult,
  TestConfig,
  TestStats,
  TimerConfig,
} from '../types';
import { interpolateVars, percentile, stdDev } from '../types';

// ---- Timer delay ----
const getTimerDelay = (timer: TimerConfig): number => {
  if (!timer.enabled || timer.type === 'none') return 0;
  switch (timer.type) {
    case 'constant':
      return timer.delay;
    case 'uniform-random':
      return timer.delay - timer.range + Math.random() * 2 * timer.range;
    case 'gaussian-random': {
      // Box-Muller transform
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      return Math.max(0, timer.delay + z * timer.range);
    }
    case 'poisson': {
      // Knuth algorithm
      const L = Math.exp(-timer.delay / 1000);
      let k = 0;
      let p = 1;
      do {
        k++;
        p *= Math.random();
      } while (p > L);
      return (k - 1) * 1000;
    }
    default:
      return 0;
  }
};

// ---- Run assertions against a response ----
const runAssertions = (
  assertions: Assertion[],
  status: number,
  duration: number,
  body: string,
  headers: Record<string, string>,
  size: number,
): AssertionResult[] => {
  return assertions
    .filter((a) => a.enabled)
    .map((a) => {
      let passed = false;
      let actual = '';

      switch (a.type) {
        case 'response-code':
          actual = String(status);
          break;
        case 'response-body':
          actual = body;
          break;
        case 'response-time':
          actual = String(Math.round(duration));
          break;
        case 'response-header':
          actual = JSON.stringify(headers);
          break;
        case 'json-path': {
          try {
            // Simple JSON path: $.path.to.field=expectedValue
            const [pathStr] = a.target.split('=');
            const keys = pathStr.replace('$.', '').split('.');
            let obj = JSON.parse(body);
            for (const k of keys) {
              obj = obj?.[k];
            }
            actual = String(obj ?? '');
          } catch {
            actual = 'PARSE_ERROR';
          }
          break;
        }
        case 'size':
          actual = String(size);
          break;
      }

      const target =
        a.type === 'json-path' && a.target.includes('=')
          ? a.target.split('=').slice(1).join('=')
          : a.target;

      switch (a.condition) {
        case 'equals':
          passed = actual === target;
          break;
        case 'contains':
          passed = actual.includes(target);
          break;
        case 'not-contains':
          if (a.type === 'response-code') {
            passed = actual !== target;
          } else {
            passed = !actual.includes(target);
          }
          break;
        case 'matches':
          try {
            passed = new RegExp(target).test(actual);
          } catch {
            passed = false;
          }
          break;
        case 'greater-than':
          passed = Number(actual) > Number(target);
          break;
        case 'less-than':
          passed = Number(actual) < Number(target);
          break;
      }

      return {
        name: a.name,
        passed,
        message: passed
          ? `Passed: ${a.type} ${a.condition} ${target}`
          : `Failed: ${a.type} ${a.condition} "${target}", got "${actual.slice(0, 100)}"`,
      };
    });
};

// ---- Run extractors ----
const runExtractors = (
  extractors: Extractor[],
  body: string,
  headers: Record<string, string>,
): Record<string, string> => {
  const vars: Record<string, string> = {};

  extractors
    .filter((e) => e.enabled)
    .forEach((ext) => {
      try {
        switch (ext.type) {
          case 'json-path': {
            const keys = ext.expression.replace('$.', '').split('.');
            let obj = JSON.parse(body);
            for (const k of keys) {
              obj = obj?.[k];
            }
            vars[ext.variableName] = obj !== undefined ? String(obj) : ext.defaultValue;
            break;
          }
          case 'regex': {
            const regex = new RegExp(ext.expression, 'g');
            const matches: string[] = [];
            let m;
            while ((m = regex.exec(body)) !== null) {
              matches.push(m[1] || m[0]);
            }
            if (ext.matchNo === 0) {
              vars[ext.variableName] =
                matches.length > 0
                  ? matches[Math.floor(Math.random() * matches.length)]
                  : ext.defaultValue;
            } else if (ext.matchNo === -1) {
              vars[ext.variableName] = matches.length > 0 ? matches.join(',') : ext.defaultValue;
            } else {
              vars[ext.variableName] = matches[ext.matchNo - 1] || ext.defaultValue;
            }
            break;
          }
          case 'header': {
            const headerVal = headers[ext.expression] || headers[ext.expression.toLowerCase()];
            vars[ext.variableName] = headerVal || ext.defaultValue;
            break;
          }
          case 'css-selector': {
            // Browser-side CSS selector extraction
            const parser = new DOMParser();
            const doc = parser.parseFromString(body, 'text/html');
            const els = doc.querySelectorAll(ext.expression);
            if (els.length > 0) {
              if (ext.matchNo === -1) {
                vars[ext.variableName] = Array.from(els)
                  .map((e) => e.textContent || '')
                  .join(',');
              } else {
                const idx =
                  ext.matchNo === 0 ? Math.floor(Math.random() * els.length) : ext.matchNo - 1;
                vars[ext.variableName] = els[idx]?.textContent || ext.defaultValue;
              }
            } else {
              vars[ext.variableName] = ext.defaultValue;
            }
            break;
          }
        }
      } catch {
        vars[ext.variableName] = ext.defaultValue;
      }
    });

  return vars;
};

// ---- Get CSV row for current index ----
const getCSVVars = (csv: CSVDataConfig, index: number): Record<string, string> => {
  if (!csv.enabled || csv.data.length === 0) return {};
  let rowIdx: number;
  if (csv.recycle) {
    rowIdx = index % csv.data.length;
  } else {
    rowIdx = Math.min(index, csv.data.length - 1);
  }
  const row = csv.data[rowIdx];
  const vars: Record<string, string> = {};
  csv.headers.forEach((h, i) => {
    vars[h] = row?.[i] ?? '';
  });
  return vars;
};

// =============================================
// Hook
// =============================================

export const useStressTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [results, setResults] = useState<RequestResult[]>([]);
  const [stats, setStats] = useState<TestStats | null>(null);
  const [liveStats, setLiveStats] = useState<LiveStats>({
    completed: 0,
    success: 0,
    errors: 0,
    avgTime: 0,
    activeThreads: 0,
    elapsed: 0,
  });

  const abortRef = useRef<AbortController | null>(null);
  const pauseRef = useRef(false);
  const activeThreadsRef = useRef(0);
  const startTimeRef = useRef(0);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- Execute single request ----
  const executeRequest = useCallback(
    async (
      config: TestConfig,
      index: number,
      threadId: number,
      iteration: number,
      signal: AbortSignal,
      csvVars: Record<string, string>,
      extractedVars: Record<string, string>,
    ): Promise<RequestResult> => {
      // Merge all variables
      const allVars = { ...csvVars, ...extractedVars };
      const resolvedUrl = interpolateVars(config.url, allVars);
      const resolvedBody = interpolateVars(config.body, allVars);

      const start = performance.now();
      let latency = 0;

      try {
        const headers: Record<string, string> = {};
        config.headers
          .filter((h) => h.enabled && h.key.trim())
          .forEach((h) => {
            headers[interpolateVars(h.key.trim(), allVars)] = interpolateVars(h.value, allVars);
          });

        // Cookies
        if (config.cookies.length > 0) {
          const cookieStr = config.cookies
            .filter((c) => c.enabled && c.name.trim())
            .map((c) => `${c.name}=${interpolateVars(c.value, allVars)}`)
            .join('; ');
          if (cookieStr) headers['Cookie'] = cookieStr;
        }

        const fetchOptions: RequestInit = {
          method: config.method,
          headers,
          signal,
          redirect: config.followRedirects ? 'follow' : 'manual',
        };

        if (['POST', 'PUT', 'PATCH'].includes(config.method) && resolvedBody.trim()) {
          fetchOptions.body = resolvedBody;
        }

        // Timeout via AbortController
        const timeoutCtrl = new AbortController();
        const timeoutId = setTimeout(() => timeoutCtrl.abort(), config.timeout);

        // Combine signals
        const combinedSignal = signal.aborted ? signal : timeoutCtrl.signal;
        fetchOptions.signal = combinedSignal;

        const response = await fetch(resolvedUrl, fetchOptions);
        latency = performance.now() - start;
        clearTimeout(timeoutId);

        const bodyText = await response.text();
        const duration = performance.now() - start;
        const sentBytes = resolvedBody ? new Blob([resolvedBody]).size : 0;

        // Response headers
        const respHeaders: Record<string, string> = {};
        response.headers.forEach((v, k) => {
          respHeaders[k] = v;
        });

        // Run assertions
        const assertionResults = runAssertions(
          config.assertions,
          response.status,
          duration,
          bodyText,
          respHeaders,
          bodyText.length,
        );

        // Run extractors
        const extracted = runExtractors(config.extractors, bodyText, respHeaders);

        return {
          index,
          threadId,
          iteration,
          status: response.status,
          statusText: response.statusText,
          duration,
          latency,
          connectTime: latency * 0.3, // approximate
          size: bodyText.length,
          sentBytes,
          timestamp: Date.now(),
          url: resolvedUrl,
          assertions: assertionResults,
          extractedVars: extracted,
          responseHeaders: respHeaders,
          responseBodySnippet: bodyText.slice(0, 500),
        };
      } catch (err: any) {
        const duration = performance.now() - start;
        return {
          index,
          threadId,
          iteration,
          status: 0,
          statusText: 'Error',
          duration,
          latency: 0,
          connectTime: 0,
          size: 0,
          sentBytes: 0,
          error: err.message || 'Unknown error',
          timestamp: Date.now(),
          url: resolvedUrl,
          assertions: [],
          extractedVars: {},
          responseHeaders: {},
          responseBodySnippet: '',
        };
      }
    },
    [],
  );

  // ---- Build final stats ----
  const computeStats = (
    allResults: RequestResult[],
    startTime: number,
    endTime: number,
  ): TestStats => {
    const durations = allResults.map((r) => r.duration);
    const totalDuration = (endTime - startTime) / 1000;
    const successResults = allResults.filter((r) => r.status >= 200 && r.status < 400);
    const errorResults = allResults.filter((r) => r.status === 0 || r.status >= 400);
    const assertionFailures = allResults.filter((r) => r.assertions.some((a) => !a.passed)).length;

    const statusCodes: Record<number, number> = {};
    const errorMessages: Record<string, number> = {};
    allResults.forEach((r) => {
      statusCodes[r.status] = (statusCodes[r.status] || 0) + 1;
      if (r.error) {
        errorMessages[r.error] = (errorMessages[r.error] || 0) + 1;
      }
    });

    const totalReceived = allResults.reduce((a, b) => a + b.size, 0);
    const totalSent = allResults.reduce((a, b) => a + b.sentBytes, 0);

    // Throughput over time (1-second buckets)
    const throughputOverTime: { time: number; count: number }[] = [];
    const responseTimeOverTime: { time: number; avg: number; max: number; min: number }[] = [];
    const activeThreadsOverTime: { time: number; threads: number }[] = [];

    if (allResults.length > 0) {
      const minTs = Math.min(...allResults.map((r) => r.timestamp));
      const maxTs = Math.max(...allResults.map((r) => r.timestamp));
      const bucketSize = Math.max(1000, Math.ceil((maxTs - minTs) / 60)); // at most 60 buckets

      for (let t = minTs; t <= maxTs; t += bucketSize) {
        const inBucket = allResults.filter((r) => r.timestamp >= t && r.timestamp < t + bucketSize);
        const relTime = Math.round((t - minTs) / 1000);
        throughputOverTime.push({
          time: relTime,
          count: inBucket.length / (bucketSize / 1000),
        });
        if (inBucket.length > 0) {
          const ds = inBucket.map((r) => r.duration);
          responseTimeOverTime.push({
            time: relTime,
            avg: ds.reduce((a, b) => a + b, 0) / ds.length,
            max: Math.max(...ds),
            min: Math.min(...ds),
          });
        }
        // Count unique threads active in this bucket
        const threads = new Set(inBucket.map((r) => r.threadId));
        activeThreadsOverTime.push({ time: relTime, threads: threads.size });
      }
    }

    return {
      totalRequests: allResults.length,
      completedRequests: allResults.length,
      successCount: successResults.length,
      errorCount: errorResults.length,
      assertionFailures,
      minResponseTime: durations.length > 0 ? Math.min(...durations) : 0,
      maxResponseTime: durations.length > 0 ? Math.max(...durations) : 0,
      avgResponseTime:
        durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      stdDevResponseTime: stdDev(durations),
      p50ResponseTime: percentile(durations, 50),
      p90ResponseTime: percentile(durations, 90),
      p95ResponseTime: percentile(durations, 95),
      p99ResponseTime: percentile(durations, 99),
      medianResponseTime: percentile(durations, 50),
      throughput: totalDuration > 0 ? allResults.length / totalDuration : 0,
      receivedKBPerSec: totalDuration > 0 ? totalReceived / 1024 / totalDuration : 0,
      sentKBPerSec: totalDuration > 0 ? totalSent / 1024 / totalDuration : 0,
      totalDataReceived: totalReceived,
      totalDataSent: totalSent,
      startTime,
      endTime,
      statusCodes,
      errorMessages,
      responseTimes: durations,
      throughputOverTime,
      responseTimeOverTime,
      activeThreadsOverTime,
    };
  };

  // ---- Run test ----
  const runTest = useCallback(
    async (config: TestConfig) => {
      if (!config.url.trim()) {
        message.error('Please enter a URL');
        return;
      }

      try {
        // Allow ${var} in URL – check base validity
        const testUrl = config.url.replace(/\$\{[^}]+\}/g, 'placeholder');
        new URL(testUrl);
      } catch {
        message.error('Please enter a valid URL');
        return;
      }

      setIsRunning(true);
      setIsPaused(false);
      pauseRef.current = false;
      setResults([]);
      setStats(null);
      setLiveStats({
        completed: 0,
        success: 0,
        errors: 0,
        avgTime: 0,
        activeThreads: 0,
        elapsed: 0,
      });

      const abortController = new AbortController();
      abortRef.current = abortController;

      // Startup delay
      if (config.startupDelay > 0) {
        await new Promise((res) => setTimeout(res, config.startupDelay * 1000));
      }

      const startTime = Date.now();
      startTimeRef.current = startTime;

      // Elapsed timer
      elapsedIntervalRef.current = setInterval(() => {
        setLiveStats((prev) => ({ ...prev, elapsed: Date.now() - startTimeRef.current }));
      }, 500);

      const allResults: RequestResult[] = [];
      let requestIndex = 0;
      const concurrency = Math.min(
        config.concurrency,
        config.scheduleMode === 'simple' ? config.totalRequests : 500,
      );
      const rampUpDelay = config.rampUpTime > 0 ? (config.rampUpTime * 1000) / concurrency : 0;

      const isDurationMode = config.scheduleMode === 'duration';
      const durationEnd = isDurationMode ? startTime + config.duration * 1000 : 0;
      const totalTarget = isDurationMode ? Infinity : config.totalRequests;

      // Shared extracted vars across requests (for chaining)
      const sharedVars: Record<string, string> = {};

      const runWorker = async (workerId: number) => {
        // Ramp-up delay
        if (rampUpDelay > 0 && workerId > 0) {
          await new Promise((res) => setTimeout(res, rampUpDelay * workerId));
        }

        activeThreadsRef.current++;
        let iteration = 0;

        while (!abortController.signal.aborted) {
          // Duration check
          if (isDurationMode && Date.now() >= durationEnd) break;

          // Pause check
          while (pauseRef.current && !abortController.signal.aborted) {
            await new Promise((res) => setTimeout(res, 100));
          }

          const currentIndex = requestIndex++;
          if (currentIndex >= totalTarget) break;
          iteration++;

          // CSV variables
          const csvVars = getCSVVars(
            config.csvData,
            config.csvData.shareMode === 'all' ? currentIndex : iteration - 1,
          );

          const result = await executeRequest(
            config,
            currentIndex,
            workerId,
            iteration,
            abortController.signal,
            csvVars,
            { ...sharedVars },
          );

          if (abortController.signal.aborted) break;

          // Merge extracted vars into shared pool
          Object.assign(sharedVars, result.extractedVars);

          allResults.push(result);

          // Update live stats
          const completed = allResults.length;
          const successes = allResults.filter((r) => r.status >= 200 && r.status < 400).length;
          const errors = allResults.filter((r) => r.status === 0 || r.status >= 400).length;
          const avgTime = allResults.reduce((a, b) => a + b.duration, 0) / completed;

          if (completed % 3 === 0 || completed >= totalTarget) {
            setResults([...allResults]);
            setLiveStats({
              completed,
              success: successes,
              errors,
              avgTime,
              activeThreads: activeThreadsRef.current,
              elapsed: Date.now() - startTime,
            });
          }

          // Timer / Think time
          const delay = getTimerDelay(config.timer);
          if (delay > 0) {
            await new Promise((res) => setTimeout(res, delay));
          }
        }

        activeThreadsRef.current--;
      };

      try {
        const workers = Array.from({ length: concurrency }, (_, i) => runWorker(i));
        await Promise.all(workers);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          message.error(`Test failed: ${err.message}`);
        }
      }

      const endTime = Date.now();

      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current);
        elapsedIntervalRef.current = null;
      }

      // Final
      setResults([...allResults]);
      if (allResults.length > 0) {
        setStats(computeStats(allResults, startTime, endTime));
      }

      setIsRunning(false);
      setIsPaused(false);
      abortRef.current = null;
      message.success(`Test completed: ${allResults.length} requests`);
    },
    [executeRequest],
  );

  const stopTest = useCallback(() => {
    abortRef.current?.abort();
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
    }
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  const togglePause = useCallback(() => {
    pauseRef.current = !pauseRef.current;
    setIsPaused((v) => !v);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setStats(null);
    setLiveStats({ completed: 0, success: 0, errors: 0, avgTime: 0, activeThreads: 0, elapsed: 0 });
  }, []);

  const exportCSV = useCallback((results: RequestResult[]) => {
    if (results.length === 0) return;
    const csvHeader =
      'Index,Thread,Iteration,Status,StatusText,Duration(ms),Latency(ms),Size(bytes),SentBytes,URL,Error,Timestamp,AssertionsPassed,AssertionsFailed\n';
    const csvRows = results
      .map((r) => {
        const passed = r.assertions.filter((a) => a.passed).length;
        const failed = r.assertions.filter((a) => !a.passed).length;
        return `${r.index},${r.threadId},${r.iteration},${r.status},"${r.statusText}",${r.duration.toFixed(2)},${r.latency.toFixed(2)},${r.size},${r.sentBytes},"${r.url}","${r.error || ''}",${r.timestamp},${passed},${failed}`;
      })
      .join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stress-test-results-${new Date().toISOString().slice(0, 19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return {
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
  };
};
