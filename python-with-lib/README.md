# AWS Lambda Demonstration — With External Libraries (Python 3.12 / 3.13)

A production-grade demonstration package for **AWS Lambda** written in **Python 3.12/3.13** utilizing external third-party dependencies (`requests`).

---

## ⚡ Packaging Python Dependencies for AWS Lambda

Unlike standard environments, AWS Lambda does not run `pip install` at runtime. External packages must be bundled in one of two patterns:

### Pattern A: Direct Zip Bundle (`.zip`)
Install dependencies directly into the root deployment package:
```bash
pip install -r requirements.txt -t .
zip -r lambda-package.zip . -x "*.git*" "test-local.py" "__pycache__/*"
```
Upload `lambda-package.zip` directly to the function code in AWS Lambda.

### Pattern B: AWS Lambda Layer (Recommended for Enterprise)
Package dependencies into the required Python Layer directory structure:
```text
python-layer.zip
└── python/
    └── lib/
        └── python3.12/
            └── site-packages/
                └── requests/
```
Or simply:
```text
python-layer.zip
└── python/
    └── requests/
```
Upload `python-layer.zip` as a **Lambda Layer** and attach it to your Python function.

---

## 📁 Directory Structure

```text
python-with-lib/
├── lambda_function.py     # Python handler using third-party requests library
├── requirements.txt       # Dependency manifest (requests>=2.31.0)
├── test-local.py          # Offline test harness (cold/warm/error cycles)
├── README.md              # Packaging & deployment guide
└── events/
    ├── event-valid.json   # Sample payload for successful invocation
    └── event-error.json   # Payload triggering deterministic error handling
```

---

## 🧪 Local Testing

Execute the local test suite (Python 3.10+):

```bash
cd python-with-lib
python test-local.py
```
*(Note: If `requests` is not installed locally, `test-local.py` automatically falls back to an offline mock wrapper for zero-barrier testing).*

---

## 🚀 AWS Console Deployment

1. Create an AWS Lambda Function:
   - **Function Name**: `wa-demo-python-with-lib`
   - **Runtime**: `Python 3.12` or `Python 3.13`
   - **Architecture**: `x86_64`
2. Bundle dependencies and code into `function.zip`:
   ```bash
   pip install -r requirements.txt -t package/
   cp lambda_function.py package/
   cd package && zip -r ../function.zip . && cd ..
   ```
3. Upload `function.zip` via **Upload from -> .zip file** in the AWS Lambda Console.
4. Execute with [`events/event-valid.json`](events/event-valid.json) and observe execution logs in **CloudWatch Logs**!
