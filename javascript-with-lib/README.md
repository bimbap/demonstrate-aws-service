# AWS Lambda Demonstration — Node.js 24 (With External Libraries)

A production-grade AWS Lambda implementation showcasing modern **Node.js 24 ESM** utilizing external libraries: **AWS SDK v3 (`@aws-sdk/client-s3`)** and **Axios (`axios`)**.

---

## 📁 Files in This Directory

| File | Description |
|---|---|
| [`index.js`](file:///m:/lks/task/demonstrates-material/lambda/javascript-with-lib/index.js) | Primary Lambda handler utilizing dynamic library imports, CloudWatch structured JSON logging, EMF metrics, and cold start tracking. |
| [`package.json`](file:///m:/lks/task/demonstrates-material/lambda/javascript-with-lib/package.json) | NPM package definition requiring `"type": "module"`, `node: ">=24.0.0"`, `@aws-sdk/client-s3`, and `axios`. |
| [`test-local.js`](file:///m:/lks/task/demonstrates-material/lambda/javascript-with-lib/test-local.js) | Local test suite simulating Cold Start, Warm Start, and Error payload executions. |
| [`events/event-valid.json`](file:///m:/lks/task/demonstrates-material/lambda/javascript-with-lib/events/event-valid.json) | Test event payload for successful execution with external probe and S3 check. |
| [`events/event-error.json`](file:///m:/lks/task/demonstrates-material/lambda/javascript-with-lib/events/event-error.json) | Test event payload simulating a structured 400 application exception. |

---

## 📦 Packaging & Deployment Strategies

Because this implementation utilizes external libraries (`axios`, `@aws-sdk/client-s3`), you must package `node_modules` before deploying to AWS.

### Strategy 1: Standard .zip Archive Packaging
```bash
# 1. Install production dependencies
npm install --omit=dev

# 2. Package index.js, package.json, and node_modules into a zip file
zip -r function.zip index.js package.json node_modules/

# 3. Deploy via AWS CLI
aws lambda create-function \
  --function-name "wa-demo-nodejs-lib" \
  --runtime "nodejs24.x" \
  --role "arn:aws:iam::123456789012:role/LabRole" \
  --handler "index.handler" \
  --zip-file "fileb://function.zip"
```

### Strategy 2: AWS Lambda Layer (Recommended)
Package dependencies into a reusable layer:
1. Create layer directory structure: `nodejs/node_modules/`.
2. Run `npm install axios @aws-sdk/client-s3` inside `nodejs/`.
3. Zip `nodejs/` into `layer.zip` and publish:
   ```bash
   aws lambda publish-layer-version \
     --layer-name "wa-nodejs-dependencies" \
     --zip-file "fileb://layer.zip" \
     --compatible-runtimes "nodejs24.x"
   ```
4. Attach the layer to `wa-demo-nodejs-lib`. Your function code zip is now under 5 KB!

---

## 🧪 Local Testing

Run the test suite directly with Node.js 24:
```bash
node test-local.js
```
Expected output: Returns HTTP 200 with Cold Start `true` on invocation 1, Cold Start `false` on invocation 2, and HTTP 400 on error event.

