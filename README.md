# Amazon CloudWatch — Logs, Metrics & Insights (Demonstration Material)

A practical, hands-on tutorial and reference architecture for **Amazon CloudWatch**, covering Log Groups, Log Streams, Metric Filters, CloudWatch Alarms, and CloudWatch Logs Insights.

---

## 📁 Files in This Directory

| File | Description |
|---|---|
| [`queries/logs-insights.sql`](file:///m:/lks/task/demonstrates-material/cloudwatch/queries/logs-insights.sql) | Five production & competition queries for CloudWatch Logs Insights (p95 latency, error filtering, cold start percentage). |
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

