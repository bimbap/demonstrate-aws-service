# Amazon CloudWatch — Logs, Metrics & Insights (Demonstration Material)

A practical, hands-on tutorial and reference architecture for **Amazon CloudWatch**, covering Log Groups, Log Streams, Metric Filters, CloudWatch Alarms, and CloudWatch Logs Insights.

---

## 📁 Files in This Directory

| File | Description |
|---|---|
| [`queries/logs-insights.sql`](file:///m:/lks/task/demonstrates-material/cloudwatch/queries/logs-insights.sql) | Five production & competition queries for CloudWatch Logs Insights (P95 latency, error filtering, cold start percentage). |
| [`dashboards/lambda-monitoring-dashboard.json`](file:///m:/lks/task/demonstrates-material/cloudwatch/dashboards/lambda-monitoring-dashboard.json) | CloudWatch Dashboard JSON definition featuring time-series metrics and live error table widget. |
| [`alarms/alarm-definitions.json`](file:///m:/lks/task/demonstrates-material/cloudwatch/alarms/alarm-definitions.json) | JSON specifications for CloudWatch Alarms (Error Rate & Latency Spike). |

---

## 🏛️ Core CloudWatch Architecture

```text
[AWS Resources] (EC2 / Lambda / API Gateway)
       │
       ├── Streams raw stdout/stderr ──> [CloudWatch Logs]
       │                                     ├── Log Group (/aws/lambda/...)
       │                                     ├── Log Streams (Container Instances)
       │                                     ├── Metric Filters (Regex/JSON -> Metrics)
       │                                     └── Logs Insights (Ad-hoc Analytics)
       │
       └── Publishes telemetry ────────> [CloudWatch Metrics]
                                             ├── Standard Metrics (Invocations, Errors, Duration)
                                             ├── Alarms (Threshold evaluation -> SNS Alerts)
                                             └── Dashboards (Unified operational views)
```

---

## 🔍 1. CloudWatch Logs vs. CloudWatch Metrics

| Concept | CloudWatch Logs | CloudWatch Metrics |
|---|---|---|
| **Data Nature** | Discrete text records, JSON payloads, timestamps. | Numeric time-series data points (datapoint + timestamp + unit). |
| **Storage Unit** | Log Groups (`/aws/lambda/<name>`) & Streams. | Namespaces (`AWS/Lambda`) & Dimensions (`FunctionName`). |
| **Searchability** | Full-text query, JSON attribute extraction. | Aggregated stats (Sum, Average, Min, Max, p50, p95, p99). |
| **Retention** | Configurable (1 day to Never Expire). | 15 months (resolution reduces gradually over time). |

---

## ⚡ 2. Setting Up CloudWatch Metric Filters

A Metric Filter monitors log streams in real-time and converts matching log events into numerical metrics without altering application code.

### Step-by-Step Console Guide:
1. Open **CloudWatch Console** -> **Log groups** -> select `/aws/lambda/lks-demo-logger`.
2. Under **Metric filters** tab -> click **Create metric filter**.
3. **Filter pattern**:
   ```text
   { $.level = "ERROR" }
   ```
4. Click **Next**:
   - **Filter name**: `LKS-ApplicationErrorFilter`
   - **Metric namespace**: `LKS/CustomMetrics`
   - **Metric name**: `AppErrorCount`
   - **Metric value**: `1`
   - **Default value**: `0`
5. Click **Create metric filter**.
6. Every time a Lambda execution logs `{ "level": "ERROR" }`, this metric increments by 1!

---

## 🚨 3. Creating CloudWatch Alarms

### Via AWS Management Console:
1. Open **CloudWatch Console** -> **Alarms** -> **All alarms** -> **Create alarm**.
2. Click **Select metric** -> `AWS/Lambda` -> `By Function Name` -> Select `Errors` for `lks-demo-logger`.
3. Set conditions:
   - **Threshold type**: Static
   - **Whenever Errors is...**: Greater than or equal to `1`
   - **Period**: `1 minute`
4. Configure actions:
   - **Alarm state trigger**: `In alarm`
   - **Send a notification to**: Select or create an SNS Topic (e.g. `lks-cloudwatch-alerts-email`).
5. Name the alarm: `lks-demo-lambda-error-alarm` -> Click **Create alarm**.

---

## 📊 4. Importing the Operational Dashboard

You can instantly recreate a full operational monitoring dashboard using the AWS CLI:

```bash
aws cloudwatch put-dashboard \
  --dashboard-name "LKS-Lambda-Monitoring" \
  --dashboard-body file://dashboards/lambda-monitoring-dashboard.json
```

Or copy the JSON into the **CloudWatch Console -> Dashboards -> Create dashboard -> Actions -> View/edit source**.

---

## 🔎 5. How to Run CloudWatch Logs Insights Queries

CloudWatch Logs Insights is an interactive search and query engine for real-time log data analysis. It uses a purpose-built query language (piped commands like Unix shells: `fields`, `filter`, `stats`, `sort`, `limit`) to slice millions of log lines within seconds.

### 🌐 Method A: Running Queries via AWS Management Console (Interactive)

1. Open the **AWS Management Console** and search for **CloudWatch**.
2. In the left navigation panel, expand **Logs** and click **Logs Insights** (or navigate to `https://console.aws.amazon.com/cloudwatch/home#logsV2:logs-insights`).
3. In the **Select log group(s)** dropdown search bar, check your target log group (e.g., `/aws/lambda/wa-backend` or `/aws/lambda/lks-demo-logger`). You can select up to 50 log groups simultaneously for cross-service tracing.
4. Set the **Time range** in the top right corner (e.g., `1h`, `12h`, `3d`, or custom timestamps).
5. In the central query code editor, copy and paste any query from [`queries/logs-insights.sql`](file:///m:/lks/task/demonstrates-material/cloudwatch/queries/logs-insights.sql).
6. Click the orange **Run query** button (or press `Ctrl + Enter` / `Cmd + Enter`).
7. Inspect the generated output:
   - **Bar Chart (Histogram)**: Shows the distribution of matching events across the selected time period.
   - **Results Table**: Displays matched fields, structured columns, and raw log lines with expandable JSON attributes.

---

### 📌 Method B: Pinning a Query as a Live Dashboard Widget

1. After running a successful query in Logs Insights, click the **Add to dashboard** button at the top right of the query editor.
2. Select an existing dashboard (e.g., `LKS-Lambda-Monitoring`) or click **Create new**.
3. Choose the widget display format:
   - **Logs table**: Displays live tabular rows (ideal for error logs and audit trails).
   - **Line chart / Stacked area**: Plots aggregated statistical metrics over time (`bin(5m)`).
4. Enter a descriptive title (e.g., `Live Application Errors` or `P95 Execution Latency`).
5. Click **Add to dashboard**. The query will now refresh automatically whenever the dashboard is viewed.

---

### 💻 Method C: Running Queries via AWS CLI

You can automate log auditing and incident detection using the AWS CLI:

```bash
# 1. Start an asynchronous Logs Insights query
QUERY_ID=$(aws logs start-query \
  --log-group-name "/aws/lambda/wa-backend" \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, @message | filter level = "ERROR" | limit 20' \
  --query 'queryId' \
  --output text)

# 2. Retrieve query execution results
aws logs get-query-results \
  --query-id "$QUERY_ID" \
  --query 'results' \
  --output table
```

---

### 📚 Query Reference Catalog (From `queries/logs-insights.sql`)

| No | Purpose | Query Syntax | What It Solves |
|:--:|---|---|---|
| **1** | **P95 Latency & Memory Peak** | `filter @type = "REPORT" \| stats avg(@duration), pct(@duration, 95), max(@maxMemoryUsed / 1000000) by bin(5m)` | Identifies memory leaks, over-provisioned RAM, and 95th percentile latency bottlenecks without third-party APM tools. |
| **2** | **Structured JSON Error Audit** | `fields @timestamp, level, message, details.reason, requestId \| filter level = "ERROR" \| sort @timestamp desc \| limit 50` | Filters application exceptions instantly with their correlation `requestId` for fast root-cause isolation. |
| **3** | **Cold Start Ratio Analysis** | `fields @timestamp, isColdStart \| filter ispresent(isColdStart) \| stats count(*), sum(isColdStart = true), (sum(isColdStart = true) / count(*)) * 100 as ColdStartPct by bin(1h)` | Quantifies the percentage of requests suffering from initialization latency to evaluate provisioned concurrency requirements. |
| **4** | **Timeout & Crash Detection** | `filter @message like /Task timed out/ or @message like /Runtime exited/ \| stats count(*) as ExecutionFailures by bin(1m)` | Pinpoints exact minutes when Lambda functions were terminated by AWS due to execution timeout limits or out-of-memory faults. |
| **5** | **Business Metric Extraction** | `fields @timestamp, resultSummary.taskName, resultSummary.totalAmount \| stats sum(resultSummary.totalAmount) by resultSummary.taskName` | Extracts numerical domain values embedded in stdout JSON logs to generate business analytics without querying the database. |
