"""
AWS Lambda Demonstration Handler — With External Libraries (Python 3.12/3.13)
Dependencies: boto3, botocore, requests

Demonstrates:
1. Python Lambda execution lifecycle & module-level initialization
2. Structured JSON logging to Amazon CloudWatch Logs
3. Interacting with AWS SDK (boto3) and external third-party HTTP client (requests)
4. CloudWatch Embedded Metric Format (EMF)
5. Robust exception handling and error stack trace capture
"""

import json
import os
import sys
import time
import uuid
import datetime
import traceback
# AWS SDK (pre-installed on AWS Lambda runtime)
try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError
    HAS_BOTO3 = True
    s3_client = boto3.client("s3")
except ImportError:
    HAS_BOTO3 = False
    s3_client = None

# Third-party library demonstrated
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

# Module-level variable evaluated once during Cold Start (Init Phase)
INIT_TIMESTAMP = datetime.datetime.now(datetime.timezone.utc).isoformat()
EXECUTION_COUNTER = 0

def lambda_handler(event, context):
    global EXECUTION_COUNTER
    EXECUTION_COUNTER += 1
    is_cold_start = (EXECUTION_COUNTER == 1)
    start_time = time.time()
    request_id = getattr(context, "aws_request_id", str(uuid.uuid4()))

    # 1. Structured CloudWatch Log: Function Start & Context
    request_metadata = {
        "level": "INFO",
        "message": "Lambda execution started (Python With-Lib)",
        "requestId": request_id,
        "functionName": getattr(context, "function_name", "demo-python-lib"),
        "functionVersion": getattr(context, "function_version", "$LATEST"),
        "memoryLimitInMB": getattr(context, "memory_limit_in_mb", "128"),
        "pythonVersion": sys.version.split()[0],
        "hasRequestsLib": HAS_REQUESTS,
        "isColdStart": is_cold_start,
        "executionCounter": EXECUTION_COUNTER,
        "initTimestamp": INIT_TIMESTAMP,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    print(json.dumps(request_metadata))

    # 2. Error Simulation Branch
    if event.get("simulateError") is True:
        error_log = {
            "level": "ERROR",
            "message": "Simulated runtime exception triggered by event payload",
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
            "headers": { "Content-Type": "application/json" },
            "body": json.dumps({
                "status": "error",
                "flavor": "Python 3.12 With-Library",
                "message": "Simulated execution error occurred. Check CloudWatch Logs for full stack details.",
                "requestId": request_id
            })
        }

    # 3. Third-party Library Usage Demonstration (requests)
    external_ip_info = {}
    if HAS_REQUESTS and event.get("checkExternalHealth") is True:
        try:
            # Demonstration of third-party HTTP call with requests library
            res = requests.get("https://checkip.amazonaws.com", timeout=3)
            external_ip_info = {
                "egressIp": res.text.strip(),
                "httpStatus": res.status_code
            }
        except Exception as ex:
            external_ip_info = { "error": str(ex) }

    # 4. Processing Logic & Calculations
    task_name = event.get("taskName", "CalculateAggregations")
    items = event.get("items", [120, 340, 560, 80])
    total_amount = sum(items)
    processing_duration_ms = round((time.time() - start_time) * 1000, 2)

    # 5. CloudWatch Embedded Metric Format (EMF)
    emf_payload = {
        "_aws": {
            "Timestamp": int(time.time() * 1000),
            "CloudWatchMetrics": [
                {
                    "Namespace": "LKS/Demonstration/Lambda",
                    "Dimensions": [["Flavor", "Environment"]],
                    "Metrics": [
                        { "Name": "ProcessingDurationMs", "Unit": "Milliseconds" },
                        { "Name": "TotalProcessedAmount", "Unit": "Count" },
                        { "Name": "SuccessfulRuns", "Unit": "Count" }
                    ]
                }
            ]
        },
        "Flavor": "Python-WithLib",
        "Environment": os.environ.get("ENV", "production"),
        "ProcessingDurationMs": processing_duration_ms,
        "TotalProcessedAmount": total_amount,
        "SuccessfulRuns": 1
    }
    print(json.dumps(emf_payload))

    # 6. Completion Summary Log
    completion_log = {
        "level": "INFO",
        "message": "Lambda execution completed successfully",
        "requestId": request_id,
        "executionDurationMs": processing_duration_ms,
        "resultSummary": {
            "taskName": task_name,
            "itemCount": len(items),
            "totalAmount": total_amount
        },
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    print(json.dumps(completion_log))

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "X-Flavor": "Python-WithLib",
            "X-Custom-Cold-Start": str(is_cold_start),
            "X-Execution-Count": str(EXECUTION_COUNTER)
        },
        "body": json.dumps({
            "status": "success",
            "flavor": "Python 3.12 With-Library (boto3 + requests)",
            "message": "Lambda executed with third-party libraries successfully",
            "requestId": request_id,
            "isColdStart": is_cold_start,
            "executionCounter": EXECUTION_COUNTER,
            "data": {
                "taskName": task_name,
                "totalAmount": total_amount,
                "externalIpInfo": external_ip_info,
                "executionDurationMs": processing_duration_ms
            }
        })
    }
