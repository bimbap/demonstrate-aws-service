# AWS Lambda Demonstration Materials — Dual Flavor Architecture

Interactive demonstration packages for **AWS Lambda** comparing two foundational serverless design patterns:
1. **With External Libraries** (Modern Node.js 24 ESM with AWS SDK v3 `@aws-sdk/client-s3` & Axios `axios`)
2. **Zero External Library** (Pure Vanilla Python 3.12 Standard Library with `urllib.request`)

---

## ⚖️ Architectural Comparison

| Dimension | Flavor A: Node.js 24 With-Lib | Flavor B: Python 3.12 Zero-Lib |
|---|---|---|
| **Directory** | [`javascript-with-lib/`](file:///m:/lks/task/demonstrates-material/lambda/javascript-with-lib/) | [`python-zero-lib/`](file:///m:/lks/task/demonstrates-material/lambda/python-zero-lib/) |
| **Language & Runtime** | JavaScript (`.js`), Node.js 24.x ESM | Python (`.py`), Python 3.12 / 3.13 |
| **Third-Party Packages** | `@aws-sdk/client-s3`, `axios` | **None (100% Native Python Standard Library)** |
| **Packaging Step** | Zip archive with `node_modules/` or Lambda Layer | **None** (instant copy-paste in AWS Console web editor) |
| **Cold Start Latency** | ~120ms–250ms (bundle decompression) | **Sub-50ms** (minimal container init overhead) |
| **CloudWatch Logging** | Structured JSON (`console.log`) | Structured JSON (`print(json.dumps)`) |
| **Custom Metrics** | Native Embedded Metric Format (EMF) | Native Embedded Metric Format (EMF) |
| **Ideal Use Case** | Full-scale microservices, rich HTTP clients, multi-service AWS orchestration | Fast webhooks, lightweight alert processors, instant competition tasks |

---

## 📁 Repository Layout

```text
lambda/
├── README.md                      # Dual-flavor index and comparative analysis
├── javascript-with-lib/           # Node.js 24 implementation with external libraries
│   ├── index.js                   # ESM handler using @aws-sdk/client-s3 and axios
│   ├── package.json               # Manifest specifying Node >=24.0.0 and dependencies
│   ├── test-local.js              # Offline test suite simulating cold/warm/error runs
│   ├── README.md                  # Zip packaging & Lambda Layer deployment guide
│   └── events/                    # Valid & error test payloads
└── python-zero-lib/               # Python 3.12 serverless implementation with zero dependencies
    ├── lambda_function.py         # 100% standard library handler using urllib.request
    ├── test-local.py              # Offline test suite validating execution logic
    ├── README.md                  # Console direct paste & CLI deployment guide
    └── events/                    # Valid & error test payloads
```

---

## 🚀 Quick Local Testing

### 1. Test Node.js 24 With-Library Handler
```bash
cd javascript-with-lib
node test-local.js
```

### 2. Test Python Zero-Library Handler
```bash
cd python-zero-lib
python test-local.py
```
