# AWS Lambda — Zero External Library (Vanilla Node.js 24 ESM)

A lightweight, high-performance AWS Lambda demonstration implemented in **Node.js 24.x** with **zero third-party dependencies**, utilizing pure native standard library modules (`node:crypto`, `console.log` JSON structured logging, and Embedded Metric Format).

---

## ⚡ Why Zero-Library Serverless?

1. **Sub-10ms Cold Starts**: Without `node_modules` to read or decompress from disk, container initialization is instantaneous.
2. **Zero Maintenance**: Eliminates `npm audit` security vulnerabilities and supply-chain dependencies.
3. **Instant Console Editing**: Code can be edited and tested directly inside the AWS Management Console Code Editor without any zip build step.

---

## 📁 Files in This Directory

| File | Description |
|---|---|
| [`index.js`](file:///m:/lks/task/demonstrates-material/lambda/javascript-zero-lib/index.js) | Standalone Node.js 24 ESM handler with cold start tracking, structured CloudWatch JSON logging, and native EMF metrics. |
| [`package.json`](file:///m:/lks/task/demonstrates-material/lambda/javascript-zero-lib/package.json) | Node manifest with `"type": "module"` and local test command (`npm run test:local`). |
| [`events/event-valid.json`](file:///m:/lks/task/demonstrates-material/lambda/javascript-zero-lib/events/event-valid.json) | Standard calculation test event payload. |
| [`events/event-error.json`](file:///m:/lks/task/demonstrates-material/lambda/javascript-zero-lib/events/event-error.json) | Error simulation test event payload. |

---

## 🚀 Deployment to AWS Lambda

1. Create a Lambda function with runtime **Node.js 20.x** or **Node.js 24**.
2. Copy and paste the entire code from [`index.js`](index.js) into the console code editor.
3. Set the handler to: `index.handler`.
4. Click **Deploy** and test using the test event payloads!
