# AWS Lambda Demonstration Materials — Dual Flavor Architecture

Interactive demonstration packages for **AWS Lambda** comparing two foundational serverless design patterns:
1. **Zero External Library** (Pure Vanilla Node.js 24 ESM)
2. **With External Libraries** (Python 3.12 with `boto3` & `requests`)

---

## ⚖️ Architectural Comparison

| Dimension | Flavor A: Node.js 24 Zero-Lib | Flavor B: Python 3.12 With-Lib |
|---|---|---|
| **Directory** | [`javascript-zero-lib/`](javascript-zero-lib/) | [`python-with-lib/`](python-with-lib/) |
| **Language & Runtime** | JavaScript (`.js`), Node.js 24.x ESM | Python (`.py`), Python 3.12 / 3.13 |
| **Third-Party Packages** | **None (100% Native Standard Library)** | `boto3`, `botocore`, `requests` |
| **Packaging Step** | None (instant copy-paste in AWS Console) | Zip archive with `pip install -t package/` or Layer |
| **Cold Start Latency** | **Sub-15ms** (minimal container init overhead) | ~150ms–350ms (depends on package size) |
| **CloudWatch Logging** | Structured JSON (`console.log`) | Structured JSON (`print(json.dumps)`) |
| **Custom Metrics** | Native Embedded Metric Format (EMF) | Native Embedded Metric Format (EMF) |
| **Ideal Use Case** | Webhooks, lightweight API routers, micro-tasks | Data analysis, heavy SDK automation, REST integrations |

---

## 📁 Repository Layout

```text
lambda/
├── README.md                      # Dual-flavor index and comparative analysis
├── javascript-zero-lib/           # Vanilla Node.js 24 serverless implementation
│   ├── index.js                   # Pure ESM handler using node:crypto and console.log EMF
│   ├── package.json               # Manifest specifying Node >=24.0.0 and local test runner
│   ├── README.md                  # Detailed deployment guide
│   └── events/                    # Valid & error test payloads
└── python-with-lib/               # Python 3.12 serverless implementation with dependencies
    ├── lambda_function.py         # Handler using boto3 SDK and requests HTTP client
    ├── requirements.txt           # Dependency definition (boto3, requests)
    ├── README.md                  # Zip packaging & Lambda Layer deployment guide
    └── events/                    # Valid & error test payloads
```

---

## 🚀 Quick Local Testing

### 1. Test Node.js 24 Zero-Library Handler
```bash
cd javascript-zero-lib
npm run test:local
```

### 2. Test Python With-Library Handler
```bash
cd python-with-lib
python -c "import lambda_function; print(lambda_function.lambda_handler({'taskName': 'Test', 'items': [10, 20]}, None))"
```
