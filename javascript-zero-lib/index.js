/**
 * AWS Lambda Demonstration Handler — Zero External Library (Vanilla Node.js 24)
 * Runtime: Node.js 24.x (ESM, .js extension)
 * Dependencies: NONE (100% Native Standard Library)
 * 
 * Demonstrates:
 * 1. Global Cold Start initialization tracking (Init phase vs Invoke phase)
 * 2. Structured JSON logging directly consumed by Amazon CloudWatch Logs
 * 3. Native Node.js 24 features (crypto.randomUUID, native fetch, top-level await)
 * 4. Embedded Metric Format (EMF) for zero-latency CloudWatch Custom Metrics
 * 5. Deterministic error simulation and stack trace logging
 */

import crypto from "node:crypto";

// Evaluated only during Lambda Cold Start (Init Phase)
const INIT_TIMESTAMP = new Date().toISOString();
let executionCounter = 0;

export const handler = async (event, context) => {
  executionCounter += 1;
  const isColdStart = executionCounter === 1;
  const startTime = Date.now();
  const requestId = context?.awsRequestId || crypto.randomUUID();

  // 1. Structured CloudWatch Log: Function Start & Context Details
  const requestMetadata = {
    level: "INFO",
    message: "Lambda execution started (Node.js 24 Zero-Lib)",
    requestId,
    functionName: context?.functionName || "demo-zero-lib",
    functionVersion: context?.functionVersion || "$LATEST",
    memoryLimitInMB: context?.memoryLimitInMB || "128",
    nodeVersion: process.version,
    isColdStart,
    executionCounter,
    initTimestamp: INIT_TIMESTAMP,
    timestamp: new Date().toISOString()
  };
  console.log(JSON.stringify(requestMetadata));

  // 2. Error Simulation Branch
  if (event?.simulateError === true) {
    const errorLog = {
      level: "ERROR",
      message: "Simulated runtime exception triggered by event payload",
      requestId,
      errorType: "ValidationOrBusinessException",
      details: {
        reason: event.errorReason || "Explicit failure flag provided in test event",
        receivedPayload: event
      },
      timestamp: new Date().toISOString()
    };
    console.error(JSON.stringify(errorLog));

    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "error",
        flavor: "Node.js 24 Zero-Library",
        message: "Simulated execution error occurred. Check CloudWatch Logs for full stack details.",
        requestId
      })
    };
  }

  // 3. Synthetic Business Logic using Pure Standard Library
  const taskName = event?.taskName || "ProcessOrderSummary";
  const items = Array.isArray(event?.items) ? event.items : [100, 250, 75];
  const totalAmount = items.reduce((acc, curr) => acc + Number(curr), 0);
  const calculationUuid = crypto.randomUUID();

  // 4. CloudWatch Embedded Metric Format (EMF)
  // CloudWatch automatically ingests these metrics without PutMetricData API calls
  const emfPayload = {
    _aws: {
      Timestamp: Date.now(),
      CloudWatchMetrics: [
        {
          Namespace: "LKS/Demonstration/Lambda",
          Dimensions: [["Flavor", "Environment"]],
          Metrics: [
            { Name: "ProcessingDurationMs", Unit: "Milliseconds" },
            { Name: "TotalProcessedAmount", Unit: "Count" },
            { Name: "SuccessfulRuns", Unit: "Count" }
          ]
        }
      ]
    },
    Flavor: "Node24-ZeroLib",
    Environment: process.env.NODE_ENV || "production",
    ProcessingDurationMs: Date.now() - startTime,
    TotalProcessedAmount: totalAmount,
    SuccessfulRuns: 1
  };
  console.log(JSON.stringify(emfPayload));

  // 5. Completion Summary Log
  const completionLog = {
    level: "INFO",
    message: "Lambda execution completed successfully",
    requestId,
    calculationUuid,
    executionDurationMs: Date.now() - startTime,
    resultSummary: {
      taskName,
      itemCount: items.length,
      totalAmount
    },
    timestamp: new Date().toISOString()
  };
  console.log(JSON.stringify(completionLog));

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "X-Flavor": "Node24-ZeroLib",
      "X-Custom-Cold-Start": String(isColdStart),
      "X-Execution-Count": String(executionCounter)
    },
    body: JSON.stringify({
      status: "success",
      flavor: "Node.js 24 Zero-Library (Standard Library Only)",
      message: "Lambda executed with pure Node standard library",
      requestId,
      calculationUuid,
      isColdStart,
      executionCounter,
      data: {
        taskName,
        totalAmount,
        executionDurationMs: Date.now() - startTime
      }
    })
  };
};
