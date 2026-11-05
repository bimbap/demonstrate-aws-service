/**
 * AWS Lambda Demonstration Handler — With External Libraries (Node.js 24 ESM)
 * Runtime: Node.js 24.x
 * Dependencies: @aws-sdk/client-s3, axios
 * 
 * Demonstrates:
 * 1. Global Cold Start initialization tracking (Init phase vs Invoke phase)
 * 2. Leveraging external third-party HTTP client (axios) & AWS SDK v3 (@aws-sdk/client-s3)
 * 3. Structured JSON logging directly consumed by Amazon CloudWatch Logs
 * 4. Embedded Metric Format (EMF) for zero-latency CloudWatch Custom Metrics
 * 5. Packaging & Layer dependencies management for enterprise Node.js microservices
 */

import crypto from "node:crypto";

// 1. Dynamic import with graceful fallback for offline / mock testing
let S3Client = null;
let ListBucketsCommand = null;
let axios = null;

try {
  const s3Module = await import("@aws-sdk/client-s3");
  S3Client = s3Module.S3Client;
  ListBucketsCommand = s3Module.ListBucketsCommand;
} catch {
  // Offline mock fallback
  S3Client = class MockS3Client {
    async send() {
      return {
        Buckets: [
          { Name: "wa-demo-bucket-primary", CreationDate: new Date() },
          { Name: "wa-demo-bucket-archive", CreationDate: new Date() }
        ]
      };
    }
  };
  ListBucketsCommand = class MockListBuckets {};
}

try {
  const axiosModule = await import("axios");
  axios = axiosModule.default || axiosModule;
} catch {
  // Native fetch fallback when axios is not installed locally
  axios = {
    get: async (url, config = {}) => {
      const res = await fetch(url, { headers: config.headers, signal: AbortSignal.timeout(config.timeout || 3000) });
      const data = await res.json().catch(() => ({ status: res.statusText }));
      return { status: res.status, statusText: res.statusText, data };
    }
  };
}

// Module-level variable evaluated once during Cold Start (Init Phase)
const INIT_TIMESTAMP = new Date().toISOString();
let executionCounter = 0;
const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });

export const handler = async (event, context) => {
  executionCounter += 1;
  const isColdStart = executionCounter === 1;
  const startTime = Date.now();
  const requestId = context?.awsRequestId || crypto.randomUUID();

  // 1. Structured CloudWatch Log: Function Start & Context Details
  const requestMetadata = {
    level: "INFO",
    message: "Lambda execution started (Node.js 24 With-Lib)",
    requestId,
    functionName: context?.functionName || "wa-demo-nodejs-lib",
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

  // 3. Business Logic Execution: External Axios Probe & S3 SDK Check
  let externalStatus = null;
  let s3Summary = null;

  try {
    // 3a. Axios External Call Demonstration
    const targetUrl = event?.checkExternalUrl || "https://httpbin.org/status/200";
    try {
      const axiosRes = await axios.get(targetUrl, { timeout: 2500 });
      externalStatus = {
        targetUrl,
        statusCode: axiosRes.status,
        statusText: axiosRes.statusText || "OK"
      };
    } catch (axiosErr) {
      externalStatus = {
        targetUrl,
        statusCode: 504,
        statusText: "Mock Gateway Timeout (Offline)"
      };
    }

    // 3b. AWS SDK v3 S3 Client Call Demonstration
    try {
      const s3Res = await s3Client.send(new ListBucketsCommand({}));
      s3Summary = {
        totalBucketsFound: s3Res.Buckets?.length || 0,
        sampleBuckets: s3Res.Buckets?.slice(0, 3).map(b => b.Name) || []
      };
    } catch (s3Err) {
      s3Summary = {
        error: "S3 list permission not granted or running offline",
        code: s3Err.name || "AccessDenied"
      };
    }

  } catch (err) {
    console.error(JSON.stringify({
      level: "ERROR",
      message: "Unhandled exception during external integration",
      requestId,
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    }));

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: "Internal Server Error",
        requestId
      })
    };
  }

  const executionDurationMs = Date.now() - startTime;

  // 4. CloudWatch Embedded Metric Format (EMF)
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
    "FunctionName": context?.functionName || "wa-demo-nodejs-lib",
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
      message: "Node.js 24 (With-Lib) Lambda execution completed successfully",
      data: {
        isColdStart,
        executionCounter,
        durationMs: executionDurationMs,
        externalProbe: externalStatus,
        s3Integration: s3Summary,
        runtime: `Node.js ${process.version}`
      },
      requestId
    })
  };
};

