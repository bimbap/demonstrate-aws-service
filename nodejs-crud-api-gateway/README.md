# AWS Lambda CRUD Demonstration — API Gateway (REST API) + DynamoDB (Node.js 20.x–26.x ESM)

A production-style CRUD demonstration for **AWS Lambda** integrated with **Amazon API Gateway (REST API v1.0 Proxy)** and **Amazon DynamoDB**, compatible with **Node.js 20.x, 22.x, 24.x, and 26.x** (`nodejs26.x` recommended).

---

## ❓ Do You Need a Lambda Layer for DynamoDB?

- **For AWS Console Demo / Quick Deployment: NO.**
  AWS Lambda managed Node.js runtimes (`nodejs20.x` through `nodejs26.x`) **already include AWS SDK for JavaScript v3** (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`). You can paste `index.js` directly into the AWS Lambda Console editor without uploading a Layer or `node_modules/`.
- **For Production Workloads: RECOMMENDED.**
  Bundling `@aws-sdk/*` in a `.zip` or **Lambda Layer** pins your exact SDK version so AWS runtime updates never introduce unexpected SDK changes, and allows offline `npm test` against the real SDK package.

---

## 🛣️ Supported REST API Routes

| Method | Path | Action | Success Status |
|---|---|---|---|
| `POST` | `/items` | Create a new item (`name`, optional `description`) | `201 Created` |
| `GET` | `/items` | List all items (`ScanCommand`) | `200 OK` |
| `GET` | `/items/{id}` | Get single item by ID (`GetCommand`) | `200 OK` / `404` |
| `PUT` | `/items/{id}` | Update `name` or `description` (`UpdateCommand`) | `200 OK` / `404` |
| `DELETE` | `/items/{id}` | Delete item by ID (`DeleteCommand`) | `200 OK` / `404` |
| `OPTIONS` | `/*` | CORS preflight response | `200 OK` |

---

## 🧪 Local Testing (Offline Mock Mode)

`test-local.js` runs the full CRUD lifecycle (`POST -> GET list -> GET id -> PUT -> DELETE -> 404 -> 400`) using an in-memory `Map` mock (`USE_MOCK_DB=true`):

```bash
cd nodejs-crud-api-gateway
node test-local.js
```

---

## 🚀 AWS Setup & Deployment Guide

### 1. Create DynamoDB Table
- **Table name:** `wa-demo-items` (or set env var `DYNAMODB_TABLE`)
- **Partition key:** `id` (`String`)

### 2. Create Lambda Function (`nodejs26.x`)
- **Runtime:** `Node.js 26.x` (`nodejs26.x`, compatible down to `nodejs20.x`)
- **IAM Execution Role Permissions:**
  Grant `dynamodb:PutItem`, `dynamodb:GetItem`, `dynamodb:UpdateItem`, `dynamodb:DeleteItem`, `dynamodb:Scan` on your table ARN (plus `AWSLambdaBasicExecutionRole` for CloudWatch Logs).
- **Code Deployment (Zero-Layer):**
  Paste [`index.js`](index.js) into `index.mjs` (or keep `index.js` + `package.json` with `"type": "module"`).

### 3. Integrate with API Gateway (REST API)
1. In **Amazon API Gateway**, create a **REST API** (not HTTP API).
2. Create resources:
   - `/items` with methods `GET`, `POST`
   - `/items/{id}` with methods `GET`, `PUT`, `DELETE`
3. For each method, choose **Integration type: Lambda Function** and **enable "Lambda Proxy integration"** (required so `event.httpMethod`, `event.pathParameters`, and `event.body` are passed intact).
4. Enable **CORS** on `/items` and `/items/{id}` if calling from a browser frontend, then click **Deploy API** to a stage (e.g. `prod` or `dev`).

