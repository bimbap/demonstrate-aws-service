# AWS API Gateway — REST API (v1) Infrastructure Guide

The **REST API** flavor of Amazon API Gateway represents the classic, feature-complete API management service (v1). It provides comprehensive enterprise governance capabilities, including payload transformation, native mock integrations, API key monetization/rate-limiting, request validation, and direct AWS WAF protection.

---

## 🏛️ Infrastructure Execution Lifecycle

Every REST API method executes through a deterministic 4-stage pipeline:

```text
[Client]
   │
   ▼
[Method Request]      ──> Validates headers, query strings, and body against JSON Schemas
   │
   ▼
[Integration Request] ──> Transforms incoming payload using Velocity Template Language (VTL)
   │
   ▼
[Backend Target]      ──> Executes Mock, AWS Lambda, HTTP Endpoint, or AWS Service Proxy
   │
   ▼
[Integration Response]──> Transforms backend response / status code mapping via VTL
   │
   ▼
[Method Response]     ──> Enforces response HTTP status code, schemas, and CORS headers
   │
   ▼
[Client]
```

---

## ⚙️ Core Infrastructure Components

| CloudFormation Resource | Purpose | Key Attributes |
|---|---|---|
| `AWS::ApiGateway::RestApi` | The root container for the REST API. | `Name`, `Description`, `EndpointConfiguration: REGIONAL / EDGE` |
| `AWS::ApiGateway::Resource` | A URL path segment in the resource tree (e.g. `/users`, `/{id}`). | `RestApiId`, `ParentId`, `PathPart` |
| `AWS::ApiGateway::Method` | An HTTP verb on a specific resource (`GET`, `POST`, `OPTIONS`). | `HttpMethod`, `AuthorizationType`, `RequestParameters`, `RequestModels` |
| `AWS::ApiGateway::Integration` | Connects the method to backend compute or mock logic. | `Type: MOCK / AWS / AWS_PROXY / HTTP`, `RequestTemplates`, `Uri` |
| `AWS::ApiGateway::Deployment` | Immutable snapshot of the API resource tree and methods. | `RestApiId`, `Description` |
| `AWS::ApiGateway::Stage` | Named environment reference (`dev`, `staging`, `prod`) pointing to a deployment. | `DeploymentId`, `StageName`, `Variables`, `MethodSettings` (throttling) |
| `AWS::ApiGateway::ApiKey` & `UsagePlan` | Controls throttling and quota per subscriber tier. | `Throttle: RateLimit, BurstLimit`, `Quota: Limit, Period` |

---

## 🧪 Native Mock Integration (Zero Backend Required)

REST API is unique because it supports native **Mock Integrations**. The API Gateway engine returns simulated responses directly using VTL templates without provisioning Lambda, EC2, or a database.

### Integration Request VTL:
Forces a 200 HTTP status code regardless of input:
```json
{
  "statusCode": 200
}
```

### Integration Response VTL:
Generates dynamic JSON using context variables:
```json
{
  "status": "operational",
  "service": "Mock REST API",
  "requestId": "$context.requestId",
  "clientIp": "$context.identity.sourceIp",
  "timestamp": "$context.requestTime"
}
```

---

## 🛠️ Infrastructure as Code (CloudFormation Snippet)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'API Gateway REST API with Native Mock Integration'

Resources:
  RestApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: 'wa-rest-api'
      Description: 'Production REST API Demonstration'
      EndpointConfiguration:
        Types:
          - REGIONAL

  HealthResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref RestApi
      ParentId: !GetAtt RestApi.RootResourceId
      PathPart: 'health'

  HealthGetMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref RestApi
      ResourceId: !Ref HealthResource
      HttpMethod: 'GET'
      AuthorizationType: 'NONE'
      MethodResponses:
        - StatusCode: '200'
          ResponseModels:
            application/json: 'Empty'
          ResponseParameters:
            method.response.header.Access-Control-Allow-Origin: true
      Integration:
        Type: 'MOCK'
        RequestTemplates:
          application/json: '{"statusCode": 200}'
        IntegrationResponses:
          - StatusCode: '200'
            ResponseTemplates:
              application/json: '{"status":"healthy","service":"wa-rest-api","timestamp":"$context.requestTime"}'
            ResponseParameters:
              method.response.header.Access-Control-Allow-Origin: "'*'"

  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: HealthGetMethod
    Properties:
      RestApiId: !Ref RestApi

  ProdStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref RestApi
      DeploymentId: !Ref ApiDeployment
      StageName: 'prod'
```

---

## 💻 CLI Provisioning Commands

```bash
# 1. Create REST API
API_ID=$(aws apigateway create-rest-api --name "wa-rest-api" --region us-east-1 --query 'id' --output text)
ROOT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --query 'items[?path==`\/`].id' --output text)

# 2. Create /health Resource
RES_ID=$(aws apigateway create-resource --rest-api-id $API_ID --parent-id $ROOT_ID --path-part "health" --query 'id' --output text)

# 3. Put GET Method & Mock Integration
aws apigateway put-method --rest-api-id $API_ID --resource-id $RES_ID --http-method GET --authorization-type NONE
aws apigateway put-integration --rest-api-id $API_ID --resource-id $RES_ID --http-method GET --type MOCK \
  --request-templates '{"application/json":"{\"statusCode\": 200}"}'

# 4. Deploy to Stage 'prod'
aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod
```

---

## ⚖️ When to Choose REST API

- You need **Usage Plans, API Keys, and per-client throttling quotas**.
- You need **Request / Response Payload Transformation** via VTL before passing data to the backend.
- You need **AWS WAF protection** directly at the API Gateway layer.
- You need **Mock Integrations** for testing client contracts before backend development begins.
