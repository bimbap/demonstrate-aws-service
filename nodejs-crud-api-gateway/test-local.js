process.env.USE_MOCK_DB = process.env.USE_MOCK_DB || "true";

import fs from "node:fs";
import assert from "node:assert/strict";
import { handler } from "./index.js";

console.log("=== Testing Node.js 20.x-26.x CRUD Lambda (API Gateway REST + DynamoDB Mock) ===\n");

const loadEvent = (file) => JSON.parse(fs.readFileSync(`./events/${file}`, "utf-8"));

const mockContext = {
  awsRequestId: "mock-req-crud-api-gw-001",
  functionName: "wa-demo-nodejs-crud-api-gw",
  functionVersion: "$LATEST",
  memoryLimitInMB: "128"
};

// 1. CREATE (POST /items) - Cold Start
console.log("--> 1. POST /items (Create - Cold Start)");
const createRes = await handler(loadEvent("event-create.json"), mockContext);
const createBody = JSON.parse(createRes.body);
console.log(`Status: ${createRes.statusCode}`, createBody);
assert.equal(createRes.statusCode, 201);
assert.equal(createBody.success, true);
const createdId = createBody.data.id;

// 2. LIST (GET /items) - Warm Start
console.log("\n--> 2. GET /items (List - Warm Start)");
const listRes = await handler(loadEvent("event-list.json"), mockContext);
const listBody = JSON.parse(listRes.body);
console.log(`Status: ${listRes.statusCode}`, listBody);
assert.equal(listRes.statusCode, 200);
assert.equal(listBody.count, 1);

// 3. GET BY ID (GET /items/{id})
console.log(`\n--> 3. GET /items/${createdId}`);
const getEvent = loadEvent("event-get.json");
getEvent.path = `/items/${createdId}`;
getEvent.pathParameters = { id: createdId };
const getRes = await handler(getEvent, mockContext);
const getBody = JSON.parse(getRes.body);
console.log(`Status: ${getRes.statusCode}`, getBody);
assert.equal(getRes.statusCode, 200);
assert.equal(getBody.data.id, createdId);

// 4. UPDATE (PUT /items/{id})
console.log(`\n--> 4. PUT /items/${createdId}`);
const updateEvent = loadEvent("event-update.json");
updateEvent.path = `/items/${createdId}`;
updateEvent.pathParameters = { id: createdId };
const updateRes = await handler(updateEvent, mockContext);
const updateBody = JSON.parse(updateRes.body);
console.log(`Status: ${updateRes.statusCode}`, updateBody);
assert.equal(updateRes.statusCode, 200);
assert.equal(updateBody.data.name, "AWS Lambda Workshop (Updated)");

// 5. DELETE (DELETE /items/{id})
console.log(`\n--> 5. DELETE /items/${createdId}`);
const deleteEvent = loadEvent("event-delete.json");
deleteEvent.path = `/items/${createdId}`;
deleteEvent.pathParameters = { id: createdId };
const deleteRes = await handler(deleteEvent, mockContext);
const deleteBody = JSON.parse(deleteRes.body);
console.log(`Status: ${deleteRes.statusCode}`, deleteBody);
assert.equal(deleteRes.statusCode, 200);

// 6. GET AFTER DELETE (404 Not Found)
console.log(`\n--> 6. GET /items/${createdId} (Expect 404)`);
const missingRes = await handler(getEvent, mockContext);
console.log(`Status: ${missingRes.statusCode}`, JSON.parse(missingRes.body));
assert.equal(missingRes.statusCode, 404);

// 7. VALIDATION ERROR (400 Bad Request)
console.log("\n--> 7. POST /items (Invalid Payload - Expect 400)");
const errorRes = await handler(loadEvent("event-error.json"), mockContext);
console.log(`Status: ${errorRes.statusCode}`, JSON.parse(errorRes.body));
assert.equal(errorRes.statusCode, 400);

// 8. WEBSOCKET $connect -> create -> list -> delete -> $disconnect
console.log("\n--> 8. WebSocket $connect");
const wsConnect = await handler(loadEvent("event-ws-connect.json"), mockContext);
assert.equal(wsConnect.statusCode, 200);

console.log("\n--> 9. WebSocket $default (action: create)");
const wsCreate = await handler(loadEvent("event-ws-crud.json"), mockContext);
const wsCreateBody = JSON.parse(wsCreate.body);
console.log(`Status: ${wsCreate.statusCode}`, wsCreateBody);
assert.equal(wsCreate.statusCode, 201);

console.log("\n--> 10. WebSocket $default (action: list & delete)");
const wsBase = loadEvent("event-ws-crud.json");
const wsList = await handler({ ...wsBase, body: JSON.stringify({ action: "list" }) }, mockContext);
assert.equal(wsList.statusCode, 200);
assert.equal(JSON.parse(wsList.body).count, 1);

const wsDelete = await handler(
  { ...wsBase, body: JSON.stringify({ action: "delete", id: wsCreateBody.data.id }) },
  mockContext
);
assert.equal(wsDelete.statusCode, 200);

console.log("\n--> 11. WebSocket $disconnect");
const wsDisconnect = await handler(loadEvent("event-ws-disconnect.json"), mockContext);
assert.equal(wsDisconnect.statusCode, 200);

console.log("\n[SUCCESS] All REST & WebSocket CRUD API Gateway + DynamoDB local tests passed!");

