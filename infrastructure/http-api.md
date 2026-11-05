# AWS API Gateway — HTTP API (v2) Infrastructure Guide

The **HTTP API** flavor of Amazon API Gateway represents the modern, next-generation RESTful API engine (v2). Architected from the ground up for serverless microservices and container backends, HTTP API delivers **up to 60% lower latency** (~10 ms overhead) and is **~71% cheaper** ($1.00/million requests) than classic REST API.

---

## 🏛️ Infrastructure Architecture

Unlike REST API which uses a hierarchical resource tree, HTTP API uses a simplified flat **Route-to-Integration mapping**:

```text
[Client HTTPS Request]
        │
        ▼
[HTTP API Engine] (Amazon CloudFront Edge / Regional Endpoint)
        │
        ├── 1. Built-in CORS Preflight (Evaluated automatically, zero Lambda cost)
        ├── 2. Native JWT Authorizer (Validates OIDC/Cognito token at edge)
        │
        ▼
[Route Resolution] (e.g. "GET /attendees" or "ANY /items/{id}" or "$default")
        │
        ▼
[Integration] (Payload Format Version 2.0)
        │
        ├── AWS_PROXY ──> AWS Lambda (Pass-through event)
        ├── HTTP_PROXY ─> Public HTTP / REST Endpoint
        └── PRIVATE ────> VPC Link (Private ALB, NLB, ECS, EC2 in private VPC)
```

---

## ⚙️ Core Infrastructure Components

| CloudFormation Resource | Purpose | Key Attributes |
|---|---|---|
| `AWS::ApiGatewayV2::Api` | Root container for the HTTP API. | `ProtocolType: HTTP`, `CorsConfiguration`, `Name` |
| `AWS::ApiGatewayV2::Route` | Path + HTTP method combination (e.g. `POST /rsvp`, `ANY /proxy`). | `RouteKey`, `Target: integrations/<id>`, `AuthorizationType: JWT / NONE` |
| `AWS::ApiGatewayV2::Integration` | Backend target connection. | `IntegrationType: AWS_PROXY / HTTP_PROXY`, `PayloadFormatVersion: "2.0"` |
| `AWS::ApiGatewayV2::Authorizer` | Native edge JWT validator (zero Lambda code). | `AuthorizerType: JWT`, `IdentitySource`, `JwtConfiguration: Audience, Issuer` |
| `AWS::ApiGatewayV2::Stage` | Named deployment environment. | `StageName: $default`, `AutoDeploy: true` (instant live sync) |
| `AWS::ApiGatewayV2::VpcLink` | Secure tunnel into private VPC subnets. | `SubnetIds`, `SecurityGroupIds` |

---

## 🌟 Key Infrastructure Advantages

### 1. Payload Format Version 2.0
HTTP API introduces a streamlined, cleaner JSON payload structure for Lambda functions:
- Headers are lowercase and de-duplicated.
- Cookies are extracted into a dedicated `cookies` array.
- Request context is compact and fast to parse.

### 2. Declarative Built-in CORS
No need to create dummy `OPTIONS` methods or VTL mock responses. CORS is configured at the API level:
```yaml
CorsConfiguration:
  AllowOrigins:
    - '*'
  AllowMethods:
    - 'GET'
    - 'POST'
    - 'OPTIONS'
  AllowHeaders:
    - 'Content-Type'
    - 'Authorization'
  MaxAge: 3600
```

### 3. Native JWT Authorizer (OIDC / Cognito)
Validates OpenID Connect (OIDC) tokens issued by AWS Cognito User Pools, Auth0, Okta, or Google without spinning up a Lambda Authorizer:
```yaml
Authorizer:
  Type: AWS::ApiGatewayV2::Authorizer
  Properties:
    ApiId: !Ref HttpApi
    AuthorizerType: JWT
    Name: 'cognito-jwt-authorizer'
    IdentitySource:
      - '$request.header.Authorization'
    JwtConfiguration:
      Audience:
        - 'my-client-app-id'
      Issuer: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_xxxxxxxxx'
```

### 4. Auto-Deploying Stages
In HTTP API, setting `AutoDeploy: true` on the `$default` stage removes the requirement to create manual `AWS::ApiGateway::Deployment` resources. Any route or integration modification takes effect immediately!

---

## 🛠️ Infrastructure as Code (CloudFormation Snippet)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production HTTP API with Lambda Proxy Integration and CORS'

Resources:
  HttpApi:
    Type: AWS::ApiGatewayV2::Api
    Properties:
      Name: 'wa-http-api'
      ProtocolType: 'HTTP'
      CorsConfiguration:
        AllowOrigins:
          - '*'
        AllowMethods:
          - 'GET'
          - 'POST'
          - 'OPTIONS'
        AllowHeaders:
          - '*'

  LambdaIntegration:
    Type: AWS::ApiGatewayV2::Integration
    Properties:
      ApiId: !Ref HttpApi
      IntegrationType: 'AWS_PROXY'
      IntegrationUri: !GetAtt MyBackendLambda.Arn
      PayloadFormatVersion: '2.0'

  PostRsvpRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref HttpApi
      RouteKey: 'POST /rsvp'
      Target: !Join ['/', ['integrations', !Ref LambdaIntegration]]

  GetAttendeesRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref HttpApi
      RouteKey: 'GET /attendees'
      Target: !Join ['/', ['integrations', !Ref LambdaIntegration]]

  DefaultStage:
    Type: AWS::ApiGatewayV2::Stage
    Properties:
      ApiId: !Ref HttpApi
      StageName: '$default'
      AutoDeploy: true
```

---

## 💻 CLI Provisioning Commands

```bash
# 1. Create HTTP API with built-in CORS
API_ID=$(aws apigatewayv2 create-api \
  --name "wa-http-api" \
  --protocol-type HTTP \
  --cors-configuration "AllowOrigins=*,AllowMethods=GET,POST,OPTIONS" \
  --query 'ApiId' --output text)

# 2. Create Lambda Proxy Integration (Payload Format 2.0)
INT_ID=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri "arn:aws:lambda:us-east-1:123456789012:function:wa-backend" \
  --payload-format-version "2.0" \
  --query 'IntegrationId' --output text)

# 3. Create Routes
aws apigatewayv2 create-route --api-id $API_ID --route-key "POST /rsvp" --target "integrations/$INT_ID"
aws apigatewayv2 create-route --api-id $API_ID --route-key "GET /attendees" --target "integrations/$INT_ID"

# 4. Create $default Auto-Deploying Stage
aws apigatewayv2 create-stage --api-id $API_ID --stage-name '$default' --auto-deploy
```

---

## ⚖️ When to Choose HTTP API

- You are building **serverless applications, mobile backends, or microservices** where low latency is critical.
- You want **minimal cost** ($1.00 vs $3.50 per million requests).
- You want **instant OIDC / Cognito JWT authorization** without writing custom auth Lambdas.
- You do **not** require VTL payload transformations, API keys, or WAF at the gateway.

