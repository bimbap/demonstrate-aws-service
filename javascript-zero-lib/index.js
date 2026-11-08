/**
 * AWS Lambda Demonstration Handler — Zero External Library (Vanilla Node.js 20/24 ESM)
 * Runtime: Node.js 20.x / 24.x ESM
 * Dependencies: NONE (100% Native Node.js Standard Library & Global Web APIs)
 * 
 * Demonstrates:
 * 1. Global Cold Start initialization tracking (Init phase vs Invoke phase)
 * 2. Zero-dependency HTTP requests using native global fetch() & AbortSignal (Node 18+)
 * 3. Cryptographic UUID generation and hashing via built-in node:crypto
 * 4. Structured JSON logging directly consumed by Amazon CloudWatch Logs & Logs Insights
 * 5. CloudWatch Embedded Metric Format (EMF) for zero-latency custom metrics
 * 6. Instant AWS Console web editor deployment (No npm install, zip, or layers needed)
 */

import crypto from "node:crypto";

// Module-level variable evaluated once during Cold Start (Init Phase)
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
    message: "Lambda execution started (Node.js Zero-Lib)",
    requestId,
    functionName: context?.functionName || "wa-demo-nodejs-zero-lib",
    functionVersion: context?.functionVersion || "$LATEST",
    memoryLimitInMB: context?.memoryLimitInMB || "128",
    nodeVersion: process.version,
    isColdStart,
    executionCounter,
    initTimestamp: INIT_TIMESTAMP,
    timestamp: new Date().toISOString()
  };
  console.log(JSON.stringify(requestMetadata));

  // 2. Deterministic Error Simulation Branch
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
        success: false,
        error: errorLog.details.reason,
        requestId,
        timestamp: errorLog.timestamp
      })
    };
  }

  // 3. Business Logic: Native Global Fetch & Crypto Hash (Zero Third-Party Dependency)
  let externalProbe = null;
  const targetUrl = event?.checkExternalUrl || "https://httpbin.org/status/200";

  try {
    const res = await fetch(targetUrl, {
      method: "GET",
      headers: { "User-Agent": "AWS-Lambda-Node-ZeroLib/1.0" },
      signal: AbortSignal.timeout(2500)
    });

    externalProbe = {
      targetUrl,
      statusCode: res.status,
      statusText: res.statusText || "OK"
    };
  } catch (fetchErr) {
    // Offline or network timeout fallback
    externalProbe = {
      targetUrl,
      statusCode: 504,
      statusText: `Gateway Timeout (${fetchErr.name || "NetworkUnreachable"})`
    };
  }

  // Generate lightweight internal hash verification
  const payloadHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(event || {}))
    .digest("hex")
    .slice(0, 16);

  const executionDurationMs = Date.now() - startTime;

  // 4. CloudWatch Embedded Metric Format (EMF) — Zero SDK Required
  const emfPayload = {
    "_aws": {
      "Timestamp": Date.now(),
      "CloudWatchMetrics": [
        {
          "Namespace": "LKS/LambdaDemonstrations",
          "Dimensions": [["FunctionName"]],
          "Metrics": [
            { "Name": "ExecutionDurationMs", "Unit": "Milliseconds" },
            { "Name": "ProcessedCount", "Unit": "Count" },
            { "Name": "ColdStartCount", "Unit": "Count" }
          ]
        }
      ]
    },
    "FunctionName": context?.functionName || "wa-demo-nodejs-zero-lib",
    "ExecutionDurationMs": executionDurationMs,
    "ProcessedCount": 1,
    "ColdStartCount": isColdStart ? 1 : 0,
    "requestId": requestId
  };
  console.log(JSON.stringify(emfPayload));

  // 5. Success Response
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      success: true,
      message: "Node.js 20/24 (Zero-Lib) Lambda execution completed successfully",
      data: {
        isColdStart,
        executionCounter,
        durationMs: executionDurationMs,
        payloadHash,
        externalProbe,
        runtime: `Node.js ${process.version} (Zero-Lib Native)`
      },
      requestId
    })
  };
};
