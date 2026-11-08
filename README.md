# AWS Lambda Demonstration Materials — Quad-Flavor Architecture Matrix

Interactive demonstration packages for **AWS Lambda** presenting the complete $2 \times 2$ architectural matrix across **Languages** (Node.js & Python) and **Dependency Management Patterns** (Zero External Library vs With External Libraries):

1. **Node.js (Zero-Lib)**: Pure Vanilla Node.js 20/24 ESM with native global `fetch()` and `node:crypto`.
2. **Node.js (With-Lib)**: Enterprise Node.js 24 ESM with AWS SDK v3 (`@aws-sdk/client-s3`) & Axios (`axios`).
3. **Python (Zero-Lib)**: Pure Vanilla Python 3.12/3.13 Standard Library with native `urllib.request`.
4. **Python (With-Lib)**: Packaged Python 3.12/3.13 with third-party HTTP client (`requests`).

---

## ⚖️ Architectural Matrix Comparison

| Dimension | Node.js (Zero-Lib) | Node.js (With-Lib) | Python (Zero-Lib) | Python (With-Lib) |
|---|---|---|---|---|
| **Directory** | [`javascript-zero-lib/`](javascript-zero-lib/) | [`javascript-with-lib/`](javascript-with-lib/) | [`python-zero-lib/`](python-zero-lib/) | [`python-with-lib/`](python-with-lib/) |
| **Runtime** | Node.js 20.x / 24.x ESM | Node.js 24.x ESM | Python 3.12 / 3.13 | Python 3.12 / 3.13 |
| **External Packages** | **None (0 dependencies)** | `@aws-sdk/client-s3`, `axios` | **None (0 dependencies)** | `requests` (third-party) |
| **Packaging Step** | **None** (direct console paste) | Zip bundle or Lambda Layer | **None** (direct console paste) | Zip bundle with `-t .` or Layer |
| **Cold Start Latency** | **Sub-40ms** | ~120ms–250ms | **Sub-50ms** | ~90ms–180ms |
| **HTTP Client API** | Native global `fetch()` | `axios.get()` | Native `urllib.request` | `requests.get()` |
| **CloudWatch Logging** | Structured JSON (`console.log`) | Structured JSON (`console.log`) | Structured JSON (`print(json.dumps)`) | Structured JSON (`print(json.dumps)`) |
| **Custom Metrics** | Native CloudWatch EMF | Native CloudWatch EMF | Native CloudWatch EMF | Native CloudWatch EMF |
| **Primary Use Case** | Ultra-fast webhooks, zero supply-chain risk | Rich microservices & AWS SDK calls | Rapid competition tasks, lightweight scripts | Advanced data fetching & REST API calls |

---

## 📁 Repository Layout

```text
lambda/
├── README.md                      # Quad-flavor index and comparative matrix
├── javascript-zero-lib/           # Vanilla Node.js 20/24 ESM (Native fetch, crypto, zero npm)
│   ├── index.js                   # 100% native ESM handler
│   ├── package.json               # Manifest specifying "type": "module"
│   ├── test-local.js              # Offline test harness (cold/warm/error cycles)
│   ├── README.md                  # Deployment & architectural guide
│   └── events/                    # Valid & error test payloads
├── javascript-with-lib/           # Node.js 24 ESM with external dependencies
│   ├── index.js                   # ESM handler using @aws-sdk/client-s3 and axios
│   ├── package.json               # Manifest specifying dependencies
│   ├── test-local.js              # Offline test suite simulating cold/warm/error runs
│   ├── README.md                  # Zip packaging & Lambda Layer deployment guide
│   └── events/                    # Valid & error test payloads
├── python-zero-lib/               # Vanilla Python 3.12 (100% standard library)
│   ├── lambda_function.py         # Standard library handler using urllib.request
│   ├── test-local.py              # Offline test suite validating execution logic
│   ├── README.md                  # Direct console paste & CLI deployment guide
│   └── events/                    # Valid & error test payloads
└── python-with-lib/               # Python 3.12 with external packages
    ├── lambda_function.py         # Handler using third-party requests library
    ├── requirements.txt           # Dependency manifest (requests>=2.31.0)
    ├── test-local.py              # Offline test harness with mock fallback
    ├── README.md                  # Packaging (zip/layer) & deployment guide
    └── events/                    # Valid & error test payloads
```

---

## 🚀 Quick Local Testing

Test each flavor locally using its respective runner:

```bash
# 1. Test Node.js (Zero-Lib) Handler
cd javascript-zero-lib && node test-local.js && cd ..

# 2. Test Node.js (With-Lib) Handler
cd javascript-with-lib && node test-local.js && cd ..

# 3. Test Python (Zero-Lib) Handler
cd python-zero-lib && python test-local.py && cd ..

# 4. Test Python (With-Lib) Handler
cd python-with-lib && python test-local.py && cd ..
```
