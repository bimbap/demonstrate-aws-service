# AWS API Gateway — Infrastructure Architecture & Types Guide

A comprehensive architectural comparison and infrastructure reference for the three API flavors supported by **Amazon API Gateway**: **REST API**, **HTTP API**, and **WebSocket API**.

---

## 🧭 Infrastructure Comparison Matrix

| Feature / Dimension | REST API (v1) | HTTP API (v2) | WebSocket API (v2) |
|---|---|---|---|
| **Protocol** | HTTP/1.1, HTTP/2 (Stateless) | HTTP/1.1, HTTP/2 (Stateless) | `wss://` (Stateful Duplex) |
| **AWS CLI Namespace** | `aws apigateway` | `aws apigatewayv2` | `aws apigatewayv2` |
| **AWS CloudFormation Type** | `AWS::ApiGateway::*` | `AWS::ApiGatewayV2::*` | `AWS::ApiGatewayV2::*` |
| **Median Added Latency** | ~35 ms - 50 ms | **~10 ms** (Up to 60% faster) | ~15 ms (Sub-second push) |
| **Pricing (per Million)** | **$3.50** | **$1.00** (~71% cheaper) | **$1.00** / million msgs + $0.25 / million connection mins |
| **Routing Mechanism** | Resource Tree (`/users/{id}`) + Method (`GET`) | Routes (`GET /users/{id}`, `$default`) | Route Selection Expression (`$request.body.action`) |
| **Built-in Mock Integration** | **Yes** (Native VTL template engine) | No (Requires mock Lambda) | No (Requires Lambda or mock) |
| **Data Transformation (VTL)** | **Yes** (Request/Response mapping) | No (Pass-through only) | No (Pass-through only) |
| **API Keys & Usage Plans** | **Yes** (Rate limiting per client) | No (Requires Lambda Authorizer) | No |
| **Native JWT Authorizer** | No (Requires Lambda Authorizer) | **Yes** (Built-in OIDC / Cognito) | No (Lambda Authorizer on `$connect`) |
| **CORS Configuration** | Manual per-method OPTIONS / GatewayResponses | **1-Click Declarative CORS** | Not Applicable (WebSocket protocol) |
| **Client Pushes / Callbacks** | No (Request-Response only) | No (Request-Response only) | **Yes** (`@connections/{id}` push) |
| **AWS WAF Integration** | **Yes** (Direct association) | No | No |
| **Private Endpoints (VPC)** | Interface VPC Endpoints (`execute-api`) | VPC Link (Private ALB / NLB / Service Discovery) | VPC Link |

---

## 🎯 Architecture Decision Flowchart

```text
Do you need real-time, bi-directional, push-based communication (e.g. Chat, Live Ticker, Collaborative Canvas)?
  ├── YES ──> [WEBSOCKET API]
  │           └── wss:// protocol, persistent connection, state stored in DynamoDB, push via @connections
  │
  └── NO  ──> Do you need API Keys/Usage Plans, VTL Data Transformation, Mock Integrations, or AWS WAF?
                ├── YES ──> [REST API (v1)]
                │           └── Enterprise features, request/response validation, mock testing without backend
                │
                └── NO  ──> [HTTP API (v2)]
                            └── Best for standard microservices, lowest latency, cheapest cost, native JWT & CORS
```

---

## 📚 Dedicated Infrastructure Guides

1. **[`infrastructure/rest-api.md`](file:///m:/lks/task/demonstrates-material/api-gateway/infrastructure/rest-api.md)**: Resource tree hierarchy, method execution cycle, VTL mock integration, CloudFormation IaC, and CLI automation.
2. **[`infrastructure/http-api.md`](file:///m:/lks/task/demonstrates-material/api-gateway/infrastructure/http-api.md)**: Route definitions, Payload Format Version 2.0, native JWT authorizer, auto-deploying stages, and VPC Link private integrations.
3. **[`infrastructure/websocket-api.md`](file:///m:/lks/task/demonstrates-material/api-gateway/infrastructure/websocket-api.md)**: Stateful duplex connections, `$connect` / `$disconnect` lifecycle, DynamoDB connection tracking, and the `@connections` asynchronous push callback API.

