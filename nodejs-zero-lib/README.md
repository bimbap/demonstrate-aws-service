# AWS Lambda Demonstration — Zero External Library (Node.js 20.x–26.x ESM)

A production-grade, zero-dependency demonstration package for **AWS Lambda** written in **modern ECMAScript Modules (ESM)**.

---

## ⚡ Why Zero-Library for Node.js?

1. **Instant Web Editor Deployment**: Zero `npm install`, zero zip packaging, zero Lambda Layers required. You can paste `index.js` directly into the AWS Lambda Console code editor.
2. **Sub-50ms Cold Starts**: Without decompressing external `node_modules/`, initialization happens almost instantaneously.
3. **Native Global Fetch**: Leverages standard Web API `fetch()` and `AbortSignal.timeout()` built natively into Node.js 20.x–26.x.
4. **Native Cryptography**: High-performance UUIDs and cryptographic hashing via built-in `node:crypto`.
5. **Native EMF Metrics**: Emits CloudWatch Embedded Metric Format custom metrics directly to standard output without needing AWS SDK clients or CloudWatch APIs.

---

## 📁 Directory Structure

```text
nodejs-zero-lib/
├── index.js               # 100% native Node.js 20.x-26.x ESM handler
├── package.json           # Manifest with "type": "module" and 0 dependencies
├── test-local.js          # Offline test harness (cold/warm/error cycles)
├── README.md              # Architectural and deployment guide
└── events/
    ├── event-valid.json   # Sample payload for successful invocation
    └── event-error.json   # Payload triggering deterministic error handling
```

---

## 🧪 Local Testing

Execute the local test harness using native Node.js (Node >= 20.0.0):

```bash
cd nodejs-zero-lib
node test-local.js
```

---

## 🚀 AWS Console Deployment

1. Create an AWS Lambda Function:
   - **Function Name**: `wa-demo-nodejs-zero-lib`
   - **Runtime**: `Node.js 20.x` – `Node.js 26.x` (`nodejs26.x` recommended)
   - **Architecture**: `x86_64` or `arm64`
2. In the AWS Management Console Code Source editor:
   - Copy the contents of [`index.js`](index.js) and paste it into `index.mjs` (or keep `index.js` with `package.json` specifying `"type": "module"`).
   - Click **Deploy**.
3. Create a Test Event using [`events/event-valid.json`](events/event-valid.json) and click **Test**.
4. Check **CloudWatch Logs** and CloudWatch Metrics (`Namespace: LKS/LambdaDemonstrations`).
