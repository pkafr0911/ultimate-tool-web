# Stress Test – HTTP Load Testing Tool

A browser-based HTTP load/stress testing tool inspired by [Apache JMeter](https://jmeter.apache.org/). Configure, execute, and analyze load tests entirely in your browser — no server or Java installation required.

---

## Features

| Feature | Description | JMeter Equivalent |
| --- | --- | --- |
| **HTTP Request** | Configure URL, method, headers, cookies, body (JSON/form/XML/GraphQL) | HTTP Request Sampler |
| **Thread Group** | Concurrent virtual users, ramp-up, schedule modes (simple / duration / stepping) | Thread Group |
| **Timers** | Constant, Uniform Random, Gaussian Random, Poisson think-time delays | Constant Timer, Gaussian Timer, etc. |
| **Assertions** | Validate response code, body, time, headers, JSON path, size | Response Assertion, JSON Assertion, Duration Assertion |
| **Post-Processors** | Extract values via regex, JSON path, CSS selector, headers | Extractors (Regex, JSON Path, CSS/jQuery) |
| **CSV Data Set** | Parameterize requests with CSV data using `${variable}` placeholders | CSV Data Set Config |
| **Test Plans** | Save / load / import / export configurations as JSON | Test Plan (.jmx) |
| **Aggregate Report** | Min/Max/Avg/StdDev/P50/P90/P95/P99, throughput, error rate, status codes | Aggregate Report Listener |
| **View Results in Table** | Per-request detail table with expandable assertion & extractor info | View Results in Table |
| **View Results Tree** | Live scrolling log with timestamps, thread IDs, status codes | View Results Tree |
| **Export CSV** | Download all results as CSV for external analysis | CSV export |

---

## Quick Start

1. Navigate to **Utility Tools → Stress Test** in the sidebar.
2. Enter a target URL (e.g. `https://jsonplaceholder.typicode.com/posts`).
3. Click **Run Test**.
4. View real-time progress and results.

> **Tip:** Click the **?** button in the top-right corner for an interactive guided tour.

---

## Page Layout

### 1. Toolbar (top-right)

| Button                | Action                        |
| --------------------- | ----------------------------- |
| ▶ **Run Test**       | Start the load test           |
| ⏸ **Pause / Resume** | Pause/resume during execution |
| ⏹ **Stop**           | Abort the test immediately    |
| 🧹 **Clear**          | Reset all results             |
| ⬇ **Export CSV**     | Download results as CSV       |
| **?**                 | Open the guided help tour     |

### 2. Test Plan Manager

- **Save** – Save the current config with a name (stored in localStorage).
- **Load** – Browse and load previously saved plans.
- **Export JSON** – Download the config as a `.json` file.
- **Import JSON** – Load a config from a `.json` file.

### 3. Configuration Panels (Collapse)

#### HTTP Request

- **Method**: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- **URL**: Supports `${variable}` placeholders from CSV Data Set
- **Headers**: Add/remove/enable/disable custom headers
- **Cookies**: Manage request cookies
- **Body**: JSON, Form URL-Encoded, XML, Plain Text, GraphQL
- **Options**: Follow Redirects, Keep-Alive

#### Thread Group

- **Schedule Mode**:
  - **Simple** – Send a fixed number of total requests
  - **Duration** – Run for N seconds continuously
  - **Stepping** – Gradually add threads over time
- **Threads (Users)** – Number of concurrent virtual users (1–500)
- **Ramp-Up** – Time to start all threads gradually
- **Startup Delay** – Wait before starting
- **Timeout** – Per-request timeout
- **Timer / Think Time** – Delay between requests per thread:
  - Constant, Uniform Random, Gaussian Random, Poisson

#### Assertions

Validate each response automatically:

- **Response Code** – equals / not equals
- **Response Body** – contains / not contains / equals / matches regex
- **Response Time** – less than / greater than (ms)
- **Response Header** – contains / matches
- **JSON Path** – `$.path.to.field=expectedValue`
- **Size** – less than / greater than / equals (bytes)

#### Post-Processors / Extractors

Extract values from responses for variable chaining:

- **JSON Path** – e.g. `$.data.token`
- **Regular Expression** – e.g. `"token":"(.+?)"`
- **Response Header** – e.g. `X-Auth-Token`
- **CSS Selector** – e.g. `div.result`

Extracted values are stored as variables and can be used in subsequent requests via `${variableName}`.

#### CSV Data Set Config

- Upload or paste CSV data
- First row = header names → variables (`${column}`)
- Configure delimiter, recycle on EOF, sharing mode
- Variables auto-replace in URL, headers, and body

### 4. Live Dashboard (during test)

- **Progress Bar** – Shows completion percentage
- **Stats Cards** – Completed, Success, Errors, Avg Response, Active Threads, Elapsed Time

### 5. Results Tabs (after test)

#### Aggregate Report

- Response time statistics: Min, Max, Average, Std Deviation, P50, P90, P95, P99
- Throughput (req/s), KB/s received, total duration
- Error rate with assertion failure count
- Status code distribution with counts and percentages
- Error messages aggregation
- Response time distribution histogram
- Throughput over time chart

#### View Results in Table

- Sortable & filterable table of all requests
- Columns: #, Thread, Status, Duration, Latency, Size, Assertions, URL, Error
- Expandable rows with assertion details, extracted variables, and response body snippet

#### View Results Tree

- Real-time scrolling log (last 300 entries)
- Each entry shows: timestamp, request #, thread ID, status code, duration, errors

---

## Variable Substitution

Use `${variableName}` syntax anywhere in:

- URL: `https://api.example.com/users/${userId}`
- Headers: `Authorization: Bearer ${token}`
- Body: `{"id": ${id}, "name": "${name}"}`

Variables can come from:

1. **CSV Data Set** – columns become variables
2. **Extractors** – values extracted from previous responses

---

## Example Test Plans

### Simple GET

```json
{
  "url": "https://jsonplaceholder.typicode.com/posts",
  "method": "GET",
  "concurrency": 5,
  "totalRequests": 50,
  "rampUpTime": 2,
  "scheduleMode": "simple"
}
```

### POST with Assertions

```json
{
  "url": "https://jsonplaceholder.typicode.com/posts",
  "method": "POST",
  "contentType": "json",
  "body": "{\"title\": \"Test\", \"body\": \"Hello\", \"userId\": 1}",
  "concurrency": 10,
  "totalRequests": 30,
  "assertions": [
    {
      "id": "a1",
      "enabled": true,
      "type": "response-code",
      "condition": "equals",
      "target": "201",
      "name": "Created"
    }
  ]
}
```

### Duration-based with Timer

```json
{
  "url": "https://jsonplaceholder.typicode.com/users",
  "method": "GET",
  "concurrency": 8,
  "scheduleMode": "duration",
  "duration": 15,
  "timer": { "type": "uniform-random", "delay": 300, "range": 200, "enabled": true }
}
```

> Use **Import JSON** in the Test Plan Manager to load any of these.

---

## File Structure

```
src/pages/StressTest/
├── index.tsx                          # Main page orchestrator + Tour
├── styles.less                        # All styles
├── types.ts                           # Types, constants, helpers, storage utils
├── README.md                          # This file
├── hooks/
│   └── useStressTest.ts               # Core test execution engine
└── components/
    ├── RequestConfig.tsx              # HTTP request configuration
    ├── LoadConfig.tsx                 # Thread group & timer settings
    ├── AssertionsConfig.tsx           # Response assertions
    ├── ExtractorsConfig.tsx           # Post-processor extractors
    ├── CSVDataSetConfig.tsx           # CSV data parameterization
    ├── TestPlanManager.tsx            # Save / load / import / export plans
    ├── ResultsSummary.tsx             # Aggregate report
    ├── ResultsTable.tsx               # Results table with expandable rows
    └── LiveLog.tsx                    # Real-time results tree
```

---

## Limitations

- Runs in the browser context, so subject to CORS restrictions (target APIs must allow cross-origin requests or use a proxy)
- No TCP-level metrics (connection pooling is handled by the browser)
- No distributed testing (single browser tab)
- localStorage-based test plan storage (not shared across devices)
- Max concurrency limited by browser connection limits (~6 per domain for HTTP/1.1, more for HTTP/2)
