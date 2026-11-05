# AWS Lambda Demonstration — Python 3.12 (Zero External Library)

A high-performance, lightweight AWS Lambda implementation in **Python 3.12 / 3.13** using **100% native Python standard library** (zero third-party dependencies, zero `pip install`, zero zip packaging).

---

## 📁 Files in This Directory

| File | Description |
|---|---|
| [`lambda_function.py`](file:///m:/lks/task/demonstrates-material/lambda/python-zero-lib/lambda_function.py) | Standalone Lambda handler using standard library `urllib.request`, JSON logging, EMF metrics, and cold start tracking. |
| [`test-local.py`](file:///m:/lks/task/demonstrates-material/lambda/python-zero-lib/test-local.py) | Local Python test runner validating cold start, warm start, and error handling offline. |
| [`events/event-valid.json`](file:///m:/lks/task/demonstrates-material/lambda/python-zero-lib/events/event-valid.json) | Test event payload for successful execution with array calculation and HTTP probe. |
| [`events/event-error.json`](file:///m:/lks/task/demonstrates-material/lambda/python-zero-lib/events/event-error.json) | Test event payload simulating a structured 400 application exception. |

---

## ⚡ Why Zero-Dependency Python?

1. **Fastest Cold Starts**: Without external libraries to decompress and import, cold starts drop to **under 50 milliseconds**.
2. **Instant In-Console Editing**: Because there are no `.whl` files or `site-packages`, you can view and edit the code directly in the AWS Management Console Monaco editor.
3. **Zero Deployment Overhead**: You do not need Docker, virtual environments, or `pip install -t .` commands. Copy-paste `lambda_function.py` directly into the AWS Console!

---

## 🚀 Instant Deployment Methods

### Method 1: Direct AWS Console Paste (Zero Zip)
1. Open **AWS Lambda Console** -> Click **Create function**.
2. **Function name**: `wa-demo-python-zero-lib`
3. **Runtime**: Select `Python 3.12` (or `Python 3.13`).
4. Click **Create function**.
5. Copy the entire contents of [`lambda_function.py`](lambda_function.py) into `lambda_function.py` in the console code editor.
6. Click **Deploy**. Test immediately with the test events!

### Method 2: Deploying via AWS CLI
```bash
# 1. Zip the single python file
zip function.zip lambda_function.py

# 2. Create the Lambda Function
aws lambda create-function \
  --function-name "wa-demo-python-zero-lib" \
  --runtime "python3.12" \
  --role "arn:aws:iam::123456789012:role/LabRole" \
  --handler "lambda_function.lambda_handler" \
  --zip-file "fileb://function.zip"
```

---

## 🧪 Local Testing

Run the test suite directly with Python:
```bash
python test-local.py
```
Expected output: Returns HTTP 200 with Cold Start `True` on invocation 1, Cold Start `False` on invocation 2, and HTTP 400 on error simulation.

