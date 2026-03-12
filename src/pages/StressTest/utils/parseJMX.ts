/**
 * JMX (JMeter Test Plan) Parser
 *
 * Parses Apache JMeter .jmx XML files and converts them to our TestConfig format.
 * Supports: ThreadGroup, HTTPSamplerProxy, HeaderManager, CookieManager,
 * ResponseAssertion, DurationAssertion, JSONPathAssertion, SizeAssertion,
 * RegexExtractor, JSONPostProcessor, HtmlExtractor, HeaderExtractor (XPathExtractor2),
 * CSVDataSet, ConstantTimer, UniformRandomTimer, GaussianRandomTimer, PoissonRandomTimer.
 */

import type {
  Assertion,
  AuthConfig,
  CSVDataConfig,
  CookieEntry,
  Extractor,
  HeaderEntry,
  OnSampleError,
  TestConfig,
  TimerConfig,
  UserVariable,
} from '../types';
import { DEFAULT_AUTH, DEFAULT_CONFIG, DEFAULT_CSV, DEFAULT_TIMER, generateId } from '../types';

// ─── XML helpers ────────────────────────────────────────────

const getText = (parent: Element, selector: string): string => {
  const el = parent.querySelector(selector);
  return el?.textContent?.trim() ?? '';
};

const getInt = (parent: Element, selector: string, fallback = 0): number => {
  const v = parseInt(getText(parent, selector), 10);
  return Number.isNaN(v) ? fallback : v;
};

const getBool = (parent: Element, selector: string, fallback = false): boolean => {
  const t = getText(parent, selector);
  if (t === '') return fallback;
  return t === 'true';
};

/** Get props by JMeter name attribute inside stringProp / intProp / boolProp */
const propByName = (parent: Element, propName: string): string => {
  const sel = `[name="${propName}"]`;
  const el = parent.querySelector(sel);
  return el?.textContent?.trim() ?? '';
};

const intPropByName = (parent: Element, propName: string, fallback = 0): number => {
  const v = parseInt(propByName(parent, propName), 10);
  return Number.isNaN(v) ? fallback : v;
};

const boolPropByName = (parent: Element, propName: string, fallback = false): boolean => {
  const t = propByName(parent, propName);
  if (t === '') return fallback;
  return t === 'true';
};

/**
 * Walk the hashTree structure. In JMX, elements are siblings of <hashTree> nodes,
 * and their children live inside the immediately-following <hashTree>.
 */
const findElements = (doc: Document, testclass: string): Element[] => {
  return Array.from(doc.querySelectorAll(`[testclass="${testclass}"]`));
};

// ─── Thread Group ───────────────────────────────────────────

const parseThreadGroup = (el: Element): Partial<TestConfig> => {
  const numThreads = intPropByName(el, 'ThreadGroup.num_threads', 10);
  const rampTime = intPropByName(el, 'ThreadGroup.ramp_time', 0);
  const startupDelay = intPropByName(el, 'ThreadGroup.delay', 0);

  // Loop controller
  const loopCtrl = el.querySelector('[elementType="LoopController"]');
  let loops = 1;
  let scheduleDuration = false;
  if (loopCtrl) {
    const loopStr = propByName(loopCtrl, 'LoopController.loops');
    const continueForever = boolPropByName(loopCtrl, 'LoopController.continue_forever');
    if (loopStr === '-1' || continueForever) {
      scheduleDuration = true;
    } else {
      loops = parseInt(loopStr, 10) || 1;
    }
  }

  // ThreadGroup.scheduler + duration
  const scheduler = boolPropByName(el, 'ThreadGroup.scheduler', false);
  const duration = intPropByName(el, 'ThreadGroup.duration', 60);

  const usesDuration = scheduler || scheduleDuration;

  // ThreadGroup.on_sample_error
  const onSampleError = propByName(el, 'ThreadGroup.on_sample_error') || 'continue';

  return {
    concurrency: numThreads,
    rampUpTime: rampTime,
    startupDelay,
    scheduleMode: usesDuration ? 'duration' : 'simple',
    duration: usesDuration ? duration : 60,
    totalRequests: usesDuration ? 100 : numThreads * loops,
    iterations: loops,
    onSampleError: (['continue', 'stopthread', 'stoptest', 'startnextloop'].includes(onSampleError)
      ? onSampleError
      : 'continue') as OnSampleError,
  };
};

// ─── HTTP Sampler ───────────────────────────────────────────

const parseHTTPSampler = (el: Element): Partial<TestConfig> => {
  const protocol = propByName(el, 'HTTPSampler.protocol') || 'https';
  const domain = propByName(el, 'HTTPSampler.domain');
  const port = propByName(el, 'HTTPSampler.port');
  const path = propByName(el, 'HTTPSampler.path');
  const method = (propByName(el, 'HTTPSampler.method') || 'GET').toUpperCase();

  // Build URL
  let url = '';
  if (domain) {
    url = `${protocol}://${domain}`;
    if (port && port !== '443' && port !== '80') url += `:${port}`;
    url += path.startsWith('/') ? path : `/${path}`;
  } else {
    // might be an absolute URL stored in path
    url = path;
  }

  const followRedirects = boolPropByName(el, 'HTTPSampler.follow_redirects', true);
  const connectTimeout = intPropByName(el, 'HTTPSampler.connect_timeout', 5000);
  const responseTimeout = intPropByName(el, 'HTTPSampler.response_timeout', 30000);

  // Body data
  let body = propByName(el, 'HTTPSampler.postBodyRaw') || '';
  // Some JMX versions store body in Arguments when postBodyRaw = true
  if (!body) {
    const rawPost = boolPropByName(el, 'HTTPSampler.postBodyRaw', false);
    if (rawPost) {
      const argEl = el.querySelector('[name="HTTPsampler.Arguments"] [name="Argument.value"]');
      if (argEl) body = argEl.textContent?.trim() ?? '';
    }
  }

  // Query params encoded in Arguments (non-raw POST or GET params)
  if (!body) {
    const args = el.querySelectorAll('[name="HTTPsampler.Arguments"] [elementType="HTTPArgument"]');
    if (args.length > 0) {
      const pairs: string[] = [];
      args.forEach((arg) => {
        const name = propByName(arg, 'Argument.name');
        const value = propByName(arg, 'Argument.value');
        const alwaysEncode = boolPropByName(arg, 'HTTPArgument.always_encode', false);
        if (name) {
          const encodedValue = alwaysEncode ? encodeURIComponent(value) : value;
          pairs.push(`${name}=${encodedValue}`);
        } else if (value) {
          // Bodydata stored as a single argument without a name
          body = value;
        }
      });
      if (pairs.length > 0 && !body) {
        if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
          const sep = url.includes('?') ? '&' : '?';
          url += sep + pairs.join('&');
        } else {
          body = pairs.join('&');
        }
      }
    }
  }

  let contentType: TestConfig['contentType'] = 'none';
  if (body) {
    try {
      JSON.parse(body);
      contentType = 'json';
    } catch {
      if (body.includes('=') && !body.startsWith('<')) contentType = 'form';
      else if (body.trimStart().startsWith('<')) contentType = 'xml';
      else contentType = 'text';
    }
  }

  return {
    url,
    method,
    body,
    contentType,
    // JMeter's follow_redirects=false uses a native HTTP client that can handle opaque
    // redirects. In a browser, fetch({redirect:'manual'}) returns an opaque redirect
    // response (status 0, unreadable body) which manifests as a CORS/network error.
    // Always follow redirects when running in the browser.
    followRedirects: true,
    timeout: responseTimeout || 30000,
    connectTimeout: connectTimeout || 5000,
  };
};

// ─── Headers ────────────────────────────────────────────────

const parseHeaders = (elements: Element[]): HeaderEntry[] => {
  const headers: HeaderEntry[] = [];
  elements.forEach((el) => {
    const enabled = el.getAttribute('enabled') !== 'false';
    const items = el.querySelectorAll('[elementType="Header"]');
    items.forEach((item) => {
      headers.push({
        id: generateId(),
        key: propByName(item, 'Header.name'),
        value: propByName(item, 'Header.value'),
        enabled,
      });
    });
  });
  return headers;
};

// ─── Cookies ────────────────────────────────────────────────

const parseCookies = (elements: Element[]): CookieEntry[] => {
  const cookies: CookieEntry[] = [];
  elements.forEach((el) => {
    const enabled = el.getAttribute('enabled') !== 'false';
    const items = el.querySelectorAll('[elementType="Cookie"]');
    items.forEach((item) => {
      cookies.push({
        id: generateId(),
        name: propByName(item, 'Cookie.name'),
        value: propByName(item, 'Cookie.value'),
        domain: propByName(item, 'Cookie.domain'),
        path: propByName(item, 'Cookie.path') || '/',
        enabled,
      });
    });
  });
  return cookies;
};

// ─── Assertions ─────────────────────────────────────────────

/**
 * JMeter Assertion.test_type is a bitmask:
 *   1 = Matches (regex)
 *   2 = Contains
 *   4 = NOT modifier
 *   8 = Equals
 *   16 = Substring
 */
const mapResponseAssertionCondition = (testType: number): Assertion['condition'] => {
  const isNot = (testType & 4) !== 0;
  if (testType & 1) return isNot ? 'not-contains' : 'matches';
  if (testType & 8) return isNot ? 'not-contains' : 'equals';
  if (testType & 2 || testType & 16) return isNot ? 'not-contains' : 'contains';
  return 'contains';
};

const mapResponseAssertionType = (field: string): Assertion['type'] => {
  switch (field) {
    case 'Assertion.response_code':
      return 'response-code';
    case 'Assertion.response_headers':
      return 'response-header';
    case 'Assertion.response_data':
    case 'Assertion.response_data_as_document':
    case 'Assertion.response_message':
    default:
      return 'response-body';
  }
};

const parseAssertions = (doc: Document): Assertion[] => {
  const assertions: Assertion[] = [];

  // ResponseAssertion
  findElements(doc, 'ResponseAssertion').forEach((el) => {
    const enabled = el.getAttribute('enabled') !== 'false';
    const name = el.getAttribute('testname') || 'Response Assertion';
    const testField = propByName(el, 'Assertion.test_field');
    const testType = intPropByName(el, 'Assertion.test_type', 2);
    const type = mapResponseAssertionType(testField);
    const condition = mapResponseAssertionCondition(testType);

    // Multiple test strings
    const strings = el.querySelectorAll('[name="Asserion.test_strings"] stringProp');
    strings.forEach((sp) => {
      assertions.push({
        id: generateId(),
        enabled,
        type,
        condition,
        target: sp.textContent?.trim() ?? '',
        name,
      });
    });
    if (strings.length === 0) {
      assertions.push({ id: generateId(), enabled, type, condition, target: '', name });
    }
  });

  // DurationAssertion
  findElements(doc, 'DurationAssertion').forEach((el) => {
    const enabled = el.getAttribute('enabled') !== 'false';
    const name = el.getAttribute('testname') || 'Duration Assertion';
    const duration = propByName(el, 'DurationAssertion.duration');
    assertions.push({
      id: generateId(),
      enabled,
      type: 'response-time',
      condition: 'less-than',
      target: duration || '1000',
      name,
    });
  });

  // JSONPathAssertion
  findElements(doc, 'JSONPathAssertion').forEach((el) => {
    const enabled = el.getAttribute('enabled') !== 'false';
    const name = el.getAttribute('testname') || 'JSON Path Assertion';
    const jsonPath = propByName(el, 'JSON_PATH');
    const expectedValue = propByName(el, 'EXPECTED_VALUE');
    assertions.push({
      id: generateId(),
      enabled,
      type: 'json-path',
      condition: 'equals',
      target: `${jsonPath}=${expectedValue}`,
      name,
    });
  });

  // SizeAssertion
  findElements(doc, 'SizeAssertion').forEach((el) => {
    const enabled = el.getAttribute('enabled') !== 'false';
    const name = el.getAttribute('testname') || 'Size Assertion';
    const size = propByName(el, 'SizeAssertion.size');
    const operator = intPropByName(el, 'SizeAssertion.operator', 1);
    // operators: 1=<, 2=>, 3==, 4=!=, 5=>=, 6=<=
    let condition: Assertion['condition'] = 'less-than';
    if (operator === 2 || operator === 5) condition = 'greater-than';
    else if (operator === 3) condition = 'equals';
    assertions.push({
      id: generateId(),
      enabled,
      type: 'size',
      condition,
      target: size || '0',
      name,
    });
  });

  return assertions;
};

// ─── Extractors ─────────────────────────────────────────────

const parseExtractors = (doc: Document): Extractor[] => {
  const extractors: Extractor[] = [];

  // RegexExtractor
  findElements(doc, 'RegexExtractor').forEach((el) => {
    const enabled = el.getAttribute('enabled') !== 'false';
    const useHeaders = propByName(el, 'RegexExtractor.useHeaders');
    extractors.push({
      id: generateId(),
      enabled,
      type: useHeaders === 'true' ? 'header' : 'regex',
      expression: propByName(el, 'RegexExtractor.regex'),
      variableName: propByName(el, 'RegexExtractor.refname'),
      matchNo: intPropByName(el, 'RegexExtractor.match_number', 1),
      defaultValue: propByName(el, 'RegexExtractor.default'),
    });
  });

  // JSONPostProcessor (JSON Extractor)
  findElements(doc, 'JSONPostProcessor').forEach((el) => {
    const enabled = el.getAttribute('enabled') !== 'false';
    extractors.push({
      id: generateId(),
      enabled,
      type: 'json-path',
      expression: propByName(el, 'JSONPostProcessor.jsonPathExprs'),
      variableName: propByName(el, 'JSONPostProcessor.referenceNames'),
      matchNo: intPropByName(el, 'JSONPostProcessor.match_numbers', 1),
      defaultValue: propByName(el, 'JSONPostProcessor.defaultValues'),
    });
  });

  // HtmlExtractor (CSS/JQuery Extractor)
  findElements(doc, 'HtmlExtractor').forEach((el) => {
    const enabled = el.getAttribute('enabled') !== 'false';
    const expr = propByName(el, 'HtmlExtractor.expr');
    const attr = propByName(el, 'HtmlExtractor.attribute');
    extractors.push({
      id: generateId(),
      enabled,
      type: 'css-selector',
      expression: attr ? `${expr}@${attr}` : expr,
      variableName: propByName(el, 'HtmlExtractor.refname'),
      matchNo: intPropByName(el, 'HtmlExtractor.match_number', 1),
      defaultValue: propByName(el, 'HtmlExtractor.default'),
    });
  });

  // XPath2Extractor
  findElements(doc, 'XPath2Extractor').forEach((el) => {
    const enabled = el.getAttribute('enabled') !== 'false';
    extractors.push({
      id: generateId(),
      enabled,
      type: 'xpath',
      expression: propByName(el, 'XPathExtractor2.xpathQuery'),
      variableName: propByName(el, 'XPathExtractor2.refname'),
      matchNo: intPropByName(el, 'XPathExtractor2.matchNumber', 1),
      defaultValue: propByName(el, 'XPathExtractor2.default'),
    });
  });

  // BoundaryExtractor
  findElements(doc, 'BoundaryExtractor').forEach((el) => {
    const enabled = el.getAttribute('enabled') !== 'false';
    const left = propByName(el, 'BoundaryExtractor.lboundary');
    const right = propByName(el, 'BoundaryExtractor.rboundary');
    extractors.push({
      id: generateId(),
      enabled,
      type: 'boundary',
      expression: `${left}|||${right}`,
      variableName: propByName(el, 'BoundaryExtractor.refname'),
      matchNo: intPropByName(el, 'BoundaryExtractor.match_number', 1),
      defaultValue: propByName(el, 'BoundaryExtractor.default'),
    });
  });

  return extractors;
};

// ─── Auth Manager ───────────────────────────────────────────

const parseAuthManager = (doc: Document): AuthConfig => {
  const el = findElements(doc, 'AuthManager')[0];
  if (!el || el.getAttribute('enabled') === 'false') return { ...DEFAULT_AUTH };

  const auth = el.querySelector('[elementType="Authorization"]');
  if (!auth) return { ...DEFAULT_AUTH };

  const username = propByName(auth, 'Authorization.username');
  const password = propByName(auth, 'Authorization.password');
  const mechanism = propByName(auth, 'Authorization.mechanism') || 'BASIC';

  const type =
    mechanism.toUpperCase() === 'DIGEST'
      ? 'digest'
      : mechanism.toUpperCase() === 'BASIC'
        ? 'basic'
        : 'basic';

  return {
    type,
    username,
    password,
    token: '',
  };
};

// ─── User Defined Variables ─────────────────────────────────

const parseUserDefinedVariables = (doc: Document): UserVariable[] => {
  const vars: UserVariable[] = [];
  findElements(doc, 'Arguments').forEach((el) => {
    // Only UserDefinedVariables GUI class
    const guiclass = el.getAttribute('guiclass');
    if (guiclass && !guiclass.includes('UserDefinedVariables')) return;
    if (el.getAttribute('enabled') === 'false') return;

    const args = el.querySelectorAll('[elementType="Argument"]');
    args.forEach((arg) => {
      const name = propByName(arg, 'Argument.name');
      const value = propByName(arg, 'Argument.value');
      if (name) {
        vars.push({
          id: generateId(),
          name,
          value,
          enabled: true,
        });
      }
    });
  });
  return vars;
};

// ─── Timers ─────────────────────────────────────────────────

const parseTimers = (doc: Document): TimerConfig => {
  // Check each timer type in priority order
  const constant = findElements(doc, 'ConstantTimer')[0];
  if (constant && constant.getAttribute('enabled') !== 'false') {
    return {
      type: 'constant',
      delay: intPropByName(constant, 'ConstantTimer.delay', 300),
      range: 0,
      enabled: true,
    };
  }

  const uniform = findElements(doc, 'UniformRandomTimer')[0];
  if (uniform && uniform.getAttribute('enabled') !== 'false') {
    return {
      type: 'uniform-random',
      delay: intPropByName(uniform, 'ConstantTimer.delay', 100),
      range: intPropByName(uniform, 'RandomTimer.range', 500),
      enabled: true,
    };
  }

  const gaussian = findElements(doc, 'GaussianRandomTimer')[0];
  if (gaussian && gaussian.getAttribute('enabled') !== 'false') {
    return {
      type: 'gaussian-random',
      delay: intPropByName(gaussian, 'ConstantTimer.delay', 300),
      range: intPropByName(gaussian, 'RandomTimer.range', 100),
      enabled: true,
    };
  }

  const poisson = findElements(doc, 'PoissonRandomTimer')[0];
  if (poisson && poisson.getAttribute('enabled') !== 'false') {
    return {
      type: 'poisson',
      delay: intPropByName(poisson, 'ConstantTimer.delay', 300),
      range: intPropByName(poisson, 'RandomTimer.range', 100),
      enabled: true,
    };
  }

  return { ...DEFAULT_TIMER };
};

// ─── CSV Data Set ───────────────────────────────────────────

const parseCSVDataSet = (doc: Document): CSVDataConfig => {
  const el = findElements(doc, 'CSVDataSet')[0];
  if (!el || el.getAttribute('enabled') === 'false') return { ...DEFAULT_CSV };

  const delimiter = propByName(el, 'delimiter') || ',';
  const variableNames = propByName(el, 'variableNames');
  const recycle = boolPropByName(el, 'recycle', true);
  const shareMode = propByName(el, 'shareMode');

  return {
    enabled: true,
    data: [], // CSV file data must be loaded separately
    headers: variableNames ? variableNames.split(delimiter).map((h) => h.trim()) : [],
    delimiter,
    recycle,
    shareMode: shareMode === 'shareMode.thread' ? 'thread' : 'all',
    currentIndex: 0,
  };
};

// ─── Main Parser ────────────────────────────────────────────

export const parseJMX = (xmlString: string): TestConfig => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  // Check for parse errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML: ' + (parseError.textContent?.slice(0, 200) ?? 'parse error'));
  }

  // Verify it's a JMeter test plan
  if (!doc.querySelector('jmeterTestPlan')) {
    throw new Error('Not a valid JMeter test plan (.jmx) file');
  }

  let config: TestConfig = { ...DEFAULT_CONFIG };

  // Thread Group (first one found)
  const threadGroup =
    findElements(doc, 'ThreadGroup')[0] ||
    findElements(doc, 'SetupThreadGroup')[0] ||
    findElements(doc, 'PostThreadGroup')[0];
  if (threadGroup) {
    config = { ...config, ...parseThreadGroup(threadGroup) };
  }

  // HTTP Sampler (first one found)
  const httpSampler = findElements(doc, 'HTTPSamplerProxy')[0];
  if (httpSampler) {
    config = { ...config, ...parseHTTPSampler(httpSampler) };
  }

  // Headers
  const headerManagers = findElements(doc, 'HeaderManager');
  if (headerManagers.length > 0) {
    const parsed = parseHeaders(headerManagers);
    if (parsed.length > 0) config.headers = parsed;
  }

  // Cookies
  const cookieManagers = findElements(doc, 'CookieManager');
  if (cookieManagers.length > 0) {
    config.cookies = parseCookies(cookieManagers);
  }

  // Assertions
  config.assertions = parseAssertions(doc);

  // Extractors
  config.extractors = parseExtractors(doc);

  // Timers
  config.timer = parseTimers(doc);

  // CSV Data Set
  config.csvData = parseCSVDataSet(doc);

  // keepAlive
  if (httpSampler) {
    config.keepAlive = boolPropByName(httpSampler, 'HTTPSampler.use_keepalive', true);
  }

  // Auth Manager
  config.auth = parseAuthManager(doc);

  // User Defined Variables
  config.userVariables = parseUserDefinedVariables(doc);

  return config;
};
