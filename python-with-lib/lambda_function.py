"""
AWS Lambda Demonstration Handler — With External Libraries (Python 3.12 / 3.13)
Dependencies: requests (Third-Party HTTP Client Library)

Demonstrates:
1. Python Lambda execution lifecycle & module-level initialization tracking
2. Packaging third-party Python dependencies via zip or AWS Lambda Layer
3. Advanced HTTP requests using 'requests' library with timeouts and session handling
4. Structured JSON logging directly consumed by Amazon CloudWatch Logs & Logs Insights
5. CloudWatch Embedded Metric Format (EMF) for zero-latency custom metrics
"""

import json
import os
import sys
import time
import uuid
import datetime
import traceback

# Dynamic import of third-party 'requests' with graceful fallback for offline test harness
try:
    import requests
    HAS_NATIVE_REQUESTS = True
except ImportError:
    HAS_NATIVE_REQUESTS = False
    import urllib.request
    import urllib.error

    class MockResponse:
        def __init__(self, status_code, text, reason="OK"):
            self.status_code = status_code
            self.text = text
            self.reason = reason

        def json(self):
            try:
                return json.loads(self.text)
            except Exception:
                return {"raw": self.text}

    class MockRequests:
        @staticmethod
        def get(url, timeout=3.0, headers=None):
            req = urllib.request.Request(url, headers=headers or {"User-Agent": "MockRequests/1.0"})
            try:
                with urllib.request.urlopen(req, timeout=timeout) as response:
                    return MockResponse(response.status, response.read().decode("utf-8"), response.reason)
            except urllib.error.HTTPError as e:
                return MockResponse(e.code, e.read().decode("utf-8"), e.reason)
            except Exception as e:
                return MockResponse(504, json.dumps({"error": str(e)}), "Gateway Timeout (Offline Mock)")

    requests = MockRequests()

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
        "message": "Lambda execution started (Python With-Lib)",
        "requestId": request_id,
        "functionName": getattr(context, "function_name", "wa-demo-python-with-lib"),
        "functionVersion": getattr(context, "function_version", "$LATEST"),
        "memoryLimitInMB": getattr(context, "memory_limit_in_mb", "128"),
        "pythonVersion": sys.version.split()[0],
        "hasNativeRequests": HAS_NATIVE_REQUESTS,
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

    # 3. Business Logic Execution: External API Probe via requests
    target_url = event.get("targetUrl", "https://httpbin.org/status/200")
    external_probe = {}

    try:
        response = requests.get(
            target_url,
            timeout=2.5,
            headers={"User-Agent": "AWS-Lambda-Python-WithLib/1.0"}
        )
        external_probe = {
            "targetUrl": target_url,
            "statusCode": response.status_code,
            "statusText": getattr(response, "reason", "OK")
        }
    except Exception as exc:
        external_probe = {
            "targetUrl": target_url,
            "statusCode": 504,
            "statusText": f"Request Failed ({type(exc).__name__})"
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
                        {"Name": "ProcessedCount", "Unit": "Count"},
                        {"Name": "ColdStartCount", "Unit": "Count"}
                    ]
                }
            ]
        },
        "FunctionName": getattr(context, "function_name", "wa-demo-python-with-lib"),
        "ExecutionDurationMs": execution_duration_ms,
        "ProcessedCount": 1,
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
            "message": "Python (With-Lib) Lambda execution completed successfully",
            "data": {
                "isColdStart": is_cold_start,
                "executionCounter": EXECUTION_COUNTER,
                "durationMs": execution_duration_ms,
                "externalProbe": external_probe,
                "libraryUsed": "requests (third-party package)" if HAS_NATIVE_REQUESTS else "urllib fallback (offline mock)",
                "hasNativeRequests": HAS_NATIVE_REQUESTS,
                "runtime": f"Python {sys.version.split()[0]}"
            },
            "requestId": request_id
        })
    }
