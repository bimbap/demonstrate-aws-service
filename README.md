# Amazon API Gateway — Architecture & Mock Demonstration Material

A comprehensive architectural guide and hands-on material for **Amazon API Gateway**, featuring zero-backend **Mock Integrations**, CORS handling, and OpenAPI 3.0 import.

---

## 📁 Files in This Directory

| File | Description |
|---|---|
| [`openapi-mock-spec.yaml`](file:///m:/lks/task/demonstrates-material/api-gateway/openapi-mock-spec.yaml) | Complete OpenAPI 3.0 specification with AWS native `x-amazon-apigateway-integration: mock` extensions. Can be imported directly into AWS Console. |
| [`curl-tests.sh`](file:///m:/lks/task/demonstrates-material/api-gateway/curl-tests.sh) | Executable bash script demonstrating real HTTP calls (`GET`, `POST`, `OPTIONS`) to test endpoints. |

---

## 🌐 What is Amazon API Gateway?

Amazon API Gateway is a fully managed service that makes it easy for developers to create, publish, maintain, monitor, and secure APIs at any scale. It acts as the **"Front Door"** for applications, sitting between client devices (web browsers, mobile apps) and backend services (AWS Lambda, EC2, HTTP endpoints, or VPC services).

```text
[Clients: Web / Mobile / Curl]
             │ (HTTPS)
             ▼
   [Amazon API Gateway]
   ├── 1. Request Validation (Payload / Query / Headers)
   ├── 2. Authentication & Authorization (Cognito / Lambda Authorizer / IAM)
   ├── 3. Throttling & Usage Plans (Rate Limiting)
   ├── 4. Request / Response Transformation (VTL Templates)
   └── 5. CORS Header Injection
             │
             ├── Mock Integration ──> [Returns Instant Mock Response]
             ├── Lambda Proxy ───────> [AWS Lambda Function]
             └── HTTP / VPC Link ────> [EC2 / ALB / ECS]
```

---

## ⚖️ REST API vs. HTTP API vs. WebSocket API

Understanding the distinction is critical for LKS competition problem statements:

| Feature | HTTP API (v2) | REST API (v1) | WebSocket API |
|---|---|---|---|
| **Primary Goal** | Ultra-low latency, 70% cheaper, lightweight serverless proxy. | Feature-rich enterprise API management, transformation & caching. | Real-time bidirectional, full-duplex persistent connections. |
| **Integrations** | Lambda proxy, HTTP endpoints, limited private integrations. | Lambda (proxy & custom), AWS Services (DynamoDB, S3 direct), **Mock**, HTTP. | Lambda, AWS Services, Mock. |
| **Request Transform** | Basic parameter mapping only. | **Full Apache Velocity (VTL)** mapping templates. | VTL mapping templates. |
| **API Caching** | Not supported natively (use CloudFront). | **Supported natively** (per-stage cache clusters). | Not supported. |
| **Usage Plans & Keys** | Not supported. | **Full API Keys & Throttling Usage Plans**. | API Keys supported. |
| **Pricing** | \$1.00 / million requests. | \$3.50 / million requests. | \$1.00 / million connections + \$0.25 / million messages. |

---

## 🎭 The Power of Mock Integrations (Zero Backend)

In testing, workshops, or early frontend prototyping, building a Lambda function just to return static JSON is unnecessary overhead. 

With **Mock Integrations**, API Gateway itself synthesizes HTTP responses directly using VTL context variables:
- `$context.requestId` -> Returns unique AWS Request ID.
- `$context.requestTime` -> Returns ISO request timestamp.
- `$context.identity.sourceIp` -> Returns caller client IP address.

---

## 🚀 Instant Hands-On Lab: Deploying the Mock API in 2 Minutes

### Method 1: Import via AWS Console
1. Open the **Amazon API Gateway Console**.
2. Click **Create API** -> Choose **REST API** -> Click **Build**.
3. Choose **Import from OpenAPI**:
   - Paste or upload the contents of [`openapi-mock-spec.yaml`](openapi-mock-spec.yaml).
4. Click **Import**.
5. Once imported, click **Deploy API**:
   - **Stage**: `*New Stage*`
   - **Stage name**: `prod`
6. Copy the **Invoke URL** (e.g., `https://xxxx.execute-api.us-east-1.amazonaws.com/prod`).

### Method 2: Testing the Live Endpoints
Run curl commands against your Invoke URL:

```bash
# 1. Test health check
curl https://<YOUR_API_ID>.execute-api.<REGION>.amazonaws.com/prod/health

# 2. Test products catalog mock
curl https://<YOUR_API_ID>.execute-api.<REGION>.amazonaws.com/prod/products

# 3. Test order creation mock
curl -X POST https://<YOUR_API_ID>.execute-api.<REGION>.amazonaws.com/prod/orders \
  -H "Content-Type: application/json" \
  -d '{"item": "Serverless-Lab"}'
```

---

## 🔒 Cross-Origin Resource Sharing (CORS) Checklist

When frontend JavaScript (`fetch()` / `axios`) calls API Gateway from a different domain or localhost, browsers trigger a preflight `OPTIONS` request.

For CORS to succeed in API Gateway:
1. Every resource must support the `OPTIONS` method with `200 OK`.
2. Response headers must include:
   - `Access-Control-Allow-Origin: '*'` (or specific frontend domain).
   - `Access-Control-Allow-Methods: 'GET,POST,OPTIONS'`.
   - `Access-Control-Allow-Headers: 'Content-Type,Authorization'`.
3. If using **Lambda Proxy Integration**, the Lambda response payload itself MUST also include the `Access-Control-Allow-Origin` header in its `headers` object!

