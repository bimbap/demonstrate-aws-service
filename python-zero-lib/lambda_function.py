"""
AWS Lambda Demonstration Handler — Zero External Library (Vanilla Python 3.12/3.13)
Dependencies: NONE (100% Native Python Standard Library)

Demonstrates:
1. Python Lambda execution lifecycle & module-level initialization tracking
2. Zero-dependency HTTP requests using native urllib.request (No 'requests' package needed)
3. Structured JSON logging directly consumed by Amazon CloudWatch Logs & Logs Insights
4. CloudWatch Embedded Metric Format (EMF) for zero-latency custom metrics
5. Instant AWS Management Console deployment (Copy-paste code directly without zip or layers)
"""

import json
import os
import sys
import time
import uuid
import datetime
import traceback
import urllib.request
import urllib.error

# Module-level variable evaluated once during Cold Start (Init Phase)
INIT_TIMESTAMP = datetime.datetime.now(datetime.timezone.utc).isoformat()
EXECUTION_COUNTER = 0

def lambda_handler(event, context):
    global EXECUTION_COUNTER
    EXECUTION_COUNTER += 1
    is_cold_start = (EXECUTION_COUNTER == 1)
    start_time = time.time()
    request_id = getattr(context, "aws_request_id", str(uuid.uuid4()))

    # 1. Structured CloudWatch Log: Function Start & Context Details
    request_metadata = {
        "level": "INFO",
        "message": "Lambda execution started (Python Zero-Lib)",
        "requestId": request_id,
        "functionName": getattr(context, "function_name", "wa-demo-python-zero-lib"),
        "functionVersion": getattr(context, "function_version", "$LATEST"),
        "memoryLimitInMB": getattr(context, "memory_limit_in_mb", "128"),
        "pythonVersion": sys.version.split()[0],
        "isColdStart": is_cold_start,
        "executionCounter": EXECUTION_COUNTER,
        "initTimestamp": INIT_TIMESTAMP,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    print(json.dumps(request_metadata))

    # 2. Deterministic Error Simulation Branch
    if event.get("simulateError") is True:
        error_log = {
            "level": "ERROR",
            "message": "Simulated Python runtime exception triggered by event payload",
            "requestId": request_id,
            "errorType": "ValidationOrBusinessException",
            "details": {
                "reason": event.get("errorReason", "Explicit failure flag provided in test event"),
                "receivedPayload": event
            },
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        print(json.dumps(error_log))

        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "success": False,
                "error": error_log["details"]["reason"],
                "requestId": request_id,
                "timestamp": error_log["timestamp"]
            })
        }

    # 3. Business Logic Execution: Native urllib.request HTTP Probe
    target_url = event.get("targetUrl", "https://httpbin.org/status/200")
    external_probe = None

    try:
        req = urllib.request.Request(
            target_url,
            headers={"User-Agent": "AWS-Lambda-Python-Zero-Lib/1.0"}
        )
        with urllib.request.urlopen(req, timeout=2.5) as response:
            external_probe = {
                "targetUrl": target_url,
                "statusCode": response.status,
                "statusReason": response.reason
            }
    except urllib.error.HTTPError as e:
        external_probe = {
            "targetUrl": target_url,
            "statusCode": e.code,
            "statusReason": e.reason
        }
    except Exception as e:
        # Graceful offline / timeout fallback
        external_probe = {
            "targetUrl": target_url,
            "statusCode": 504,
            "statusReason": f"Mock Timeout / Offline ({str(e)})"
        }

    # Statistical computation on input payload
    items = event.get("items", [85, 92, 78, 96, 88])
    stats_summary = {
        "totalCount": len(items),
        "sum": sum(items),
        "average": round(sum(items) / len(items), 2) if items else 0,
        "maximum": max(items) if items else 0
    }

    execution_duration_ms = round((time.time() - start_time) * 1000, 2)

    # 4. CloudWatch Embedded Metric Format (EMF)
    emf_payload = {
        "_aws": {
            "Timestamp": int(time.time() * 1000),
            "CloudWatchMetrics": [
                {
                    "Namespace": "LKS/LambdaDemonstrations",
                    "Dimensions": [["FunctionName"]],
                    "Metrics": [
                        {"Name": "ExecutionDurationMs", "Unit": "Milliseconds"},
                        {"Name": "ItemsProcessed", "Unit": "Count"},
                        {"Name": "ColdStartCount", "Unit": "Count"}
                    ]
                }
            ]
        },
        "FunctionName": getattr(context, "function_name", "wa-demo-python-zero-lib"),
        "ExecutionDurationMs": execution_duration_ms,
        "ItemsProcessed": len(items),
        "ColdStartCount": 1 if is_cold_start else 0,
        "requestId": request_id
    }
    print(json.dumps(emf_payload))

    # 5. Success Response
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps({
            "success": True,
            "message": "Python (Zero-Lib) Lambda execution completed successfully",
            "data": {
                "isColdStart": is_cold_start,
                "executionCounter": EXECUTION_COUNTER,
                "durationMs": execution_duration_ms,
                "statsSummary": stats_summary,
                "externalProbe": external_probe,
                "runtime": f"Python {sys.version.split()[0]}"
            },
            "requestId": request_id
        })
    }

