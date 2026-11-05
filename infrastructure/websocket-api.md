# AWS API Gateway — WebSocket API (v2) Infrastructure Guide

The **WebSocket API** flavor of Amazon API Gateway provides a fully managed, stateful, bi-directional communication service operating over the `wss://` protocol. It enables real-time data exchange—such as live chat, multi-user collaboration, real-time sports tickers, and trading dashboards—without requiring clients to poll the backend.

---

## 🏛️ Infrastructure & Connection Lifecycle Architecture

Unlike stateless HTTP/REST APIs, a WebSocket API maintains an open TCP socket connection between the client and AWS API Gateway edge nodes. 

```text
[Client Device (Browser / Mobile / wscat)]
        ▲
        │ Persistent wss:// Connection
        ▼
[Amazon API Gateway (WebSocket API)]
        │
        ├── 1. Handshake Phase: Route '$connect' ──> [Connect Lambda] ──> Store connectionId in [DynamoDB]
        │
        ├── 2. Message Phase: Action Route ────────> [Action Lambda]  ──> Process message
        │
        ├── 3. Async Push: Calls @connections API <── [Worker Lambda]  <── DynamoDB Stream / EventBridge
        │         │
        │         └── POST /@connections/{id} ──> Pushes data down open socket
        │
        └── 4. Teardown Phase: Route '$disconnect' ─> [Disconnect Lambda] ──> Remove connectionId from [DynamoDB]
```

---

## ⚙️ Core Infrastructure Components

| CloudFormation Resource | Purpose | Key Attributes |
|---|---|---|
| `AWS::ApiGatewayV2::Api` | Root container for the WebSocket API. | `ProtocolType: WEBSOCKET`, `RouteSelectionExpression: "$request.body.action"` |
| `AWS::ApiGatewayV2::Route` | Event dispatcher based on payload content. | `RouteKey: $connect, $disconnect, $default, <customAction>` |
| `AWS::ApiGatewayV2::Integration` | Connects the route to backend execution. | `IntegrationType: AWS_PROXY`, `IntegrationUri: <lambda-arn>` |
| `AWS::ApiGatewayV2::Stage` | Deployment environment with auto-deploy. | `StageName: prod`, `AutoDeploy: true` |
| `AWS::DynamoDB::Table` | Essential connection state repository. | `PartitionKey: connectionId (String)`, `TTL: expireAt (Number)` |

---

## 🔄 The 4 Essential Routes

1. **`$connect`**: Triggered when a client initiates the WebSocket handshake (`new WebSocket('wss://...')`).
   - Use cases: Authentication, JWT validation, registering the `connectionId` in DynamoDB.
   - If Lambda returns `200`, the connection is established; if it returns `403` or throws an error, the connection is instantly rejected.
2. **`$disconnect`**: Triggered when the client closes the socket, network drops, or the server terminates the connection.
   - Use cases: Removing stale `connectionId` records from DynamoDB to prevent failed callback pushes.
3. **`$default`**: Triggered when the message sent by the client does not match any custom route.
   - Use cases: Catch-all error logging, fallback messaging.
4. **Custom Action Routes** (e.g. `sendMessage`, `joinRoom`):
   - Resolved by the `RouteSelectionExpression` (e.g., matching JSON `{ "action": "sendMessage", "text": "hello" }`).

---

## 📡 The Asynchronous Callback Push Mechanism (`@connections`)

When backend services (Lambda, SNS, DynamoDB Streams) need to push data to connected clients, they use the dedicated API Gateway Management API endpoint:

```text
POST https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/@connections/{connectionId}
```

### AWS SDK (Node.js) Callback Push Pattern:
```javascript
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

const apiGwClient = new ApiGatewayManagementApiClient({
  endpoint: "https://d123456789.execute-api.us-east-1.amazonaws.com/prod"
});

export const pushMessageToClient = async (connectionId, payload) => {
  const command = new PostToConnectionCommand({
    ConnectionId: connectionId,
    Data: Buffer.from(JSON.stringify(payload))
  });

  try {
    await apiGwClient.send(command);
  } catch (err) {
    if (err.statusCode === 410) {
      // 410 Gone: The client disconnected without clean $disconnect
      console.log(`Connection ${connectionId} is stale. Deleting from DynamoDB...`);
    }
  }
};
```

---

## 🛠️ Infrastructure as Code (CloudFormation Snippet)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production WebSocket API with DynamoDB Connection Tracking'

Resources:
  # 1. DynamoDB Table for Storing Active Connection IDs
  ConnectionsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: 'wa-websocket-connections'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: 'connectionId'
          AttributeType: 'S'
      KeySchema:
        - AttributeName: 'connectionId'
          KeyType: 'HASH'
      TimeToLiveSpecification:
        AttributeName: 'expireAt'
        Enabled: true

  # 2. WebSocket API Definition
  WebSocketApi:
    Type: AWS::ApiGatewayV2::Api
    Properties:
      Name: 'wa-chat-websocket'
      ProtocolType: 'WEBSOCKET'
      RouteSelectionExpression: '$request.body.action'

  # 3. Connect Route & Integration
  ConnectIntegration:
    Type: AWS::ApiGatewayV2::Integration
    Properties:
      ApiId: !Ref WebSocketApi
      IntegrationType: 'AWS_PROXY'
      IntegrationUri: !GetAtt ConnectLambda.Arn

  ConnectRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref WebSocketApi
      RouteKey: '$connect'
      Target: !Join ['/', ['integrations', !Ref ConnectIntegration]]

  # 4. Disconnect Route & Integration
  DisconnectIntegration:
    Type: AWS::ApiGatewayV2::Integration
    Properties:
      ApiId: !Ref WebSocketApi
      IntegrationType: 'AWS_PROXY'
      IntegrationUri: !GetAtt DisconnectLambda.Arn

  DisconnectRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref WebSocketApi
      RouteKey: '$disconnect'
      Target: !Join ['/', ['integrations', !Ref DisconnectIntegration]]

  # 5. Production Stage
  ProdStage:
    Type: AWS::ApiGatewayV2::Stage
    Properties:
      ApiId: !Ref WebSocketApi
      StageName: 'prod'
      AutoDeploy: true
```

---

## 💻 CLI Provisioning Commands

```bash
# 1. Create WebSocket API
API_ID=$(aws apigatewayv2 create-api \
  --name "wa-chat-websocket" \
  --protocol-type WEBSOCKET \
  --route-selection-expression '$request.body.action' \
  --query 'ApiId' --output text)

# 2. Create Connect Integration & Route
INT_ID=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri "arn:aws:lambda:us-east-1:123456789012:function:wa-ws-connect" \
  --query 'IntegrationId' --output text)

aws apigatewayv2 create-route --api-id $API_ID --route-key '$connect' --target "integrations/$INT_ID"
aws apigatewayv2 create-route --api-id $API_ID --route-key '$disconnect' --target "integrations/$INT_ID"
aws apigatewayv2 create-route --api-id $API_ID --route-key '$default' --target "integrations/$INT_ID"

# 3. Create Stage
aws apigatewayv2 create-stage --api-id $API_ID --stage-name prod --auto-deploy
```

---

## 🧪 Testing via `wscat` CLI

You can interactively test the live WebSocket API directly from your terminal using `wscat`:

```bash
# 1. Install wscat globally
npm install -g wscat

# 2. Connect to the WebSocket Stage URL
wscat -c "wss://{api-id}.execute-api.us-east-1.amazonaws.com/prod"

# 3. Send structured JSON actions
> {"action": "sendMessage", "recipient": "all", "message": "Hello from LKS Cloud!"}
< {"status": "broadcast_delivered", "activeClients": 14}
```

---

## ⚖️ When to Choose WebSocket API

- You need **continuous bi-directional push notifications** (Live Chat, Multiplayer Games, Real-Time Fleet Tracking).
- You want to eliminate **polling latency and unnecessary HTTP request overhead**.
- You need server-side push capabilities without maintaining long-running EC2/Docker Socket.IO servers.

