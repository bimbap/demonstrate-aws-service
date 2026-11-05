-- ==============================================================================
-- CloudWatch Logs Insights - LKS Cloud Computing Query Library
-- Target Log Group: /aws/lambda/<function-name>
-- ==============================================================================

-- 1. Find Slowest Executions & Memory Usage from REPORT lines
filter @type = "REPORT"
| stats count(*) as Invocations,
        avg(@duration) as AvgDuration,
        max(@duration) as MaxDuration,
        pct(@duration, 95) as P95Duration,
        max(@maxMemoryUsed / 1000000) as MaxMemoryMB
  by bin(5m)

-- 2. Extract and Filter Structured JSON Application Errors
fields @timestamp, level, message, details.reason, requestId
| filter level = "ERROR"
| sort @timestamp desc
| limit 50

-- 3. Cold Start Ratio Analysis
fields @timestamp, isColdStart, requestId
| filter ispresent(isColdStart)
| stats count(*) as TotalRequests,
        sum(isColdStart = true) as ColdStarts,
        (sum(isColdStart = true) / count(*)) * 100 as ColdStartPercentage
  by bin(1h)

-- 4. Lambda Concurrency and Throttling Trends
filter @message like /Task timed out/ or @message like /Runtime exited/
| stats count(*) as ExecutionFailures by bin(1m)

-- 5. Business Metric Summary from Embedded JSON
fields @timestamp, resultSummary.taskName as Task, resultSummary.totalAmount as Amount
| filter ispresent(resultSummary.totalAmount)
| stats sum(Amount) as AggregateAmount, count(*) as TasksCompleted by Task

