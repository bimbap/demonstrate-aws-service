import json
import os
import sys
from lambda_function import lambda_handler

print("=== Testing Python (Zero-Lib) Lambda Locally ===\n")

# Load mock test events
with open("events/event-valid.json", "r") as f:
    valid_event = json.load(f)

with open("events/event-error.json", "r") as f:
    error_event = json.load(f)

class MockContext:
    aws_request_id = "mock-req-python-zero-lib-98765"
    function_name = "wa-demo-python-zero-lib"
    function_version = "$LATEST"
    memory_limit_in_mb = "128"

context = MockContext()

# Test 1: Cold Start Valid Invocation
print("--> Executing Test 1: Valid Event (Cold Start)")
res1 = lambda_handler(valid_event, context)
print(f"Status: {res1['statusCode']}")
print("Response Body:", json.loads(res1["body"]))

# Test 2: Warm Start Valid Invocation
print("\n--> Executing Test 2: Valid Event (Warm Start)")
res2 = lambda_handler(valid_event, context)
print(f"Status: {res2['statusCode']}")
print("Is Cold Start:", json.loads(res2["body"])["data"]["isColdStart"])

# Test 3: Error Simulation Invocation
print("\n--> Executing Test 3: Simulated Error Event")
res3 = lambda_handler(error_event, context)
print(f"Status: {res3['statusCode']}")
print("Response Body:", json.loads(res3["body"]))

if res1["statusCode"] == 200 and res3["statusCode"] == 400:
    print("\n[SUCCESS] All Python (Zero-Lib) local tests passed!")
else:
    print("\n[FAILURE] Unexpected status code returned.")
    sys.exit(1)
