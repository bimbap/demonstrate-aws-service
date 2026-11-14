/**
 * AWS Lambda CRUD Handler — API Gateway (REST API v1.0) + Amazon DynamoDB
 * Runtime: Node.js 20.x / 22.x / 24.x / 26.x ESM
 *
 * Note on AWS Lambda Layers:
 *   AWS Lambda managed runtimes (nodejs20.x - nodejs26.x) include AWS SDK v3
 *   pre-installed, so this handler can run in the AWS Console without a Layer.
 *   For local offline testing without AWS credentials, it automatically falls
 *   back to an in-memory Map store.
 */

import crypto from "node:crypto";

const TABLE_NAME = process.env.DYNAMODB_TABLE || "wa-demo-items";
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const INIT_TIMESTAMP = new Date().toISOString();
let executionCounter = 0;

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization"
};

/**
 * Creates a DynamoDB DocumentClient or an in-memory mock when offline/unconfigured.
 */
async function createStore() {
  const forceMock = process.env.USE_MOCK_DB === "true";
  if (!forceMock) {
    try {
      const [{ DynamoDBClient }, libDdb] = await Promise.all([
        import("@aws-sdk/client-dynamodb"),
        import("@aws-sdk/lib-dynamodb")
      ]);
      const client = new DynamoDBClient({ region: AWS_REGION });
      return {
        mode: "dynamodb",
        docClient: libDdb.DynamoDBDocumentClient.from(client),
        commands: {
          PutCommand: libDdb.PutCommand,
          GetCommand: libDdb.GetCommand,
          ScanCommand: libDdb.ScanCommand,
          UpdateCommand: libDdb.UpdateCommand,
          DeleteCommand: libDdb.DeleteCommand
        }
      };
    } catch {
      // Fall through to in-memory mock when SDK is not installed locally
    }
  }

  return createMockStore();
}

function createMockStore() {
  const store = new Map();

  class Command {
    constructor(input) {
      this.input = input;
    }
  }
  class PutCommand extends Command {}
  class GetCommand extends Command {}
  class ScanCommand extends Command {}
  class UpdateCommand extends Command {}
  class DeleteCommand extends Command {}

  const docClient = {
    async send(cmd) {
      if (cmd instanceof PutCommand) {
        store.set(cmd.input.Item.id, cmd.input.Item);
        return {};
      }
      if (cmd instanceof GetCommand) {
        return { Item: store.get(cmd.input.Key.id) };
      }
      if (cmd instanceof ScanCommand) {
        return { Items: Array.from(store.values()) };
      }
      if (cmd instanceof UpdateCommand) {
        const existing = store.get(cmd.input.Key.id);
        if (!existing) {
          const err = new Error("The conditional request failed");
          err.name = "ConditionalCheckFailedException";
          throw err;
        }
        const vals = cmd.input.ExpressionAttributeValues || {};
        const updated = {
          ...existing,
          ...(vals[":name"] !== undefined ? { name: vals[":name"] } : {}),
          ...(vals[":description"] !== undefined ? { description: vals[":description"] } : {}),
          updatedAt: vals[":updatedAt"] || new Date().toISOString()
        };
        store.set(existing.id, updated);
        return { Attributes: updated };
      }
      if (cmd instanceof DeleteCommand) {
        const existing = store.get(cmd.input.Key.id);
        if (!existing) {
          const err = new Error("The conditional request failed");
          err.name = "ConditionalCheckFailedException";
          throw err;
        }
        store.delete(cmd.input.Key.id);
        return { Attributes: existing };
      }
      throw new Error("Unsupported mock DynamoDB command");
    }
  };

  return {
    mode: "in-memory-mock",
    docClient,
    commands: { PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand }
  };
}

const storePromise = createStore();

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(payload)
  };
}

function parseBody(event) {
  if (!event?.body) return null;
  if (typeof event.body === "object") return event.body;
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf-8")
    : event.body;
  return JSON.parse(raw);
}

function emitEmfMetric(functionName, durationMs, isColdStart, requestId) {
  console.log(
    JSON.stringify({
      _aws: {
        Timestamp: Date.now(),
        CloudWatchMetrics: [
          {
            Namespace: "LKS/LambdaDemonstrations",
            Dimensions: [["FunctionName"]],
            Metrics: [
              { Name: "ExecutionDurationMs", Unit: "Milliseconds" },
              { Name: "ProcessedCount", Unit: "Count" },
              { Name: "ColdStartCount", Unit: "Count" }
            ]
          }
        ]
      },
      FunctionName: functionName,
      ExecutionDurationMs: durationMs,
      ProcessedCount: 1,
      ColdStartCount: isColdStart ? 1 : 0,
      requestId
    })
  );
}

async function handleCreate(docClient, { PutCommand }, event, requestId) {
  let payload;
  try {
    payload = parseBody(event);
  } catch {
    return jsonResponse(400, { success: false, error: "Invalid JSON body", requestId });
  }

  if (!payload?.name || typeof payload.name !== "string" || !payload.name.trim()) {
    return jsonResponse(400, {
      success: false,
      error: "Field 'name' is required and must be a non-empty string",
      requestId
    });
  }

  const now = new Date().toISOString();
  const item = {
    id: crypto.randomUUID(),
    name: payload.name.trim(),
    description: typeof payload.description === "string" ? payload.description.trim() : "",
    createdAt: now,
    updatedAt: now
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    })
  );

  return jsonResponse(201, { success: true, data: item, requestId });
}

async function handleList(docClient, { ScanCommand }, requestId) {
  const result = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
  const items = result.Items || [];
  return jsonResponse(200, { success: true, count: items.length, data: items, requestId });
}

async function handleGet(docClient, { GetCommand }, id, requestId) {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { id }
    })
  );

  if (!result.Item) {
    return jsonResponse(404, { success: false, error: `Item '${id}' not found`, requestId });
  }
  return jsonResponse(200, { success: true, data: result.Item, requestId });
}

async function handleUpdate(docClient, { UpdateCommand }, id, event, requestId) {
  let payload;
  try {
    payload = parseBody(event);
  } catch {
    return jsonResponse(400, { success: false, error: "Invalid JSON body", requestId });
  }

  if (!payload || (payload.name === undefined && payload.description === undefined)) {
    return jsonResponse(400, {
      success: false,
      error: "Provide at least 'name' or 'description' to update",
      requestId
    });
  }

  const updates = ["updatedAt = :updatedAt"];
  const values = { ":updatedAt": new Date().toISOString() };
  const names = {};

  if (payload.name !== undefined) {
    if (typeof payload.name !== "string" || !payload.name.trim()) {
      return jsonResponse(400, { success: false, error: "'name' must be non-empty", requestId });
    }
    updates.push("#n = :name");
    names["#n"] = "name";
    values[":name"] = payload.name.trim();
  }

  if (payload.description !== undefined) {
    updates.push("description = :description");
    values[":description"] = String(payload.description).trim();
  }

  try {
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: `SET ${updates.join(", ")}`,
        ...(Object.keys(names).length > 0 ? { ExpressionAttributeNames: names } : {}),
        ExpressionAttributeValues: values,
        ConditionExpression: "attribute_exists(id)",
        ReturnValues: "ALL_NEW"
      })
    );
    return jsonResponse(200, { success: true, data: result.Attributes, requestId });
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return jsonResponse(404, { success: false, error: `Item '${id}' not found`, requestId });
    }
    throw err;
  }
}

async function handleDelete(docClient, { DeleteCommand }, id, requestId) {
  try {
    const result = await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { id },
        ConditionExpression: "attribute_exists(id)",
        ReturnValues: "ALL_OLD"
      })
    );
    return jsonResponse(200, {
      success: true,
      message: `Item '${id}' deleted`,
      deleted: result.Attributes,
      requestId
    });
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return jsonResponse(404, { success: false, error: `Item '${id}' not found`, requestId });
    }
    throw err;
  }
}

export const handler = async (event, context) => {
  executionCounter += 1;
  const isColdStart = executionCounter === 1;
  const startTime = Date.now();
  const requestId = context?.awsRequestId || crypto.randomUUID();
  const functionName = context?.functionName || "wa-demo-nodejs-crud-api-gw";

  const method = (event?.httpMethod || "GET").toUpperCase();
  const path = event?.path || "/items";
  const itemId = event?.pathParameters?.id;
  const { mode, docClient, commands } = await storePromise;

  console.log(
    JSON.stringify({
      level: "INFO",
      message: "API Gateway REST request received",
      requestId,
      method,
      path,
      itemId: itemId || null,
      storageMode: mode,
      tableName: TABLE_NAME,
      nodeVersion: process.version,
      isColdStart,
      executionCounter,
      initTimestamp: INIT_TIMESTAMP,
      timestamp: new Date().toISOString()
    })
  );

  if (method === "OPTIONS") {
    return jsonResponse(200, { ok: true });
  }

  try {
    let response;
    if (method === "POST" && !itemId) {
      response = await handleCreate(docClient, commands, event, requestId);
    } else if (method === "GET" && !itemId) {
      response = await handleList(docClient, commands, requestId);
    } else if (method === "GET" && itemId) {
      response = await handleGet(docClient, commands, itemId, requestId);
    } else if (method === "PUT" && itemId) {
      response = await handleUpdate(docClient, commands, itemId, event, requestId);
    } else if (method === "DELETE" && itemId) {
      response = await handleDelete(docClient, commands, itemId, requestId);
    } else {
      response = jsonResponse(405, {
        success: false,
        error: `Method ${method} on path '${path}' is not supported`,
        requestId
      });
    }

    emitEmfMetric(functionName, Date.now() - startTime, isColdStart, requestId);
    return response;
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "ERROR",
        message: "Unhandled CRUD error",
        requestId,
        error: err.message,
        name: err.name,
        timestamp: new Date().toISOString()
      })
    );
    return jsonResponse(500, {
      success: false,
      error: "Internal Server Error",
      requestId
    });
  }
};

