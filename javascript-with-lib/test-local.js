import { handler } from "./index.js";
import fs from "node:fs";

console.log("=== Testing Node.js 24 Lambda (With-Lib) Locally ===\n");

const validEvent = JSON.parse(fs.readFileSync("./events/event-valid.json", "utf-8"));
const errorEvent = JSON.parse(fs.readFileSync("./events/event-error.json", "utf-8"));

const mockContext = {
  awsRequestId: "mock-req-nodejs-with-lib-12345",
  functionName: "wa-demo-nodejs-lib",
  functionVersion: "$LATEST",
  memoryLimitInMB: "128"
};

// Test 1: Cold Start Valid Invocation
console.log("--> Executing Test 1: Valid Event (Cold Start)");
const res1 = await handler(validEvent, mockContext);
console.log(`Status: ${res1.statusCode}`);
console.log("Response Body:", JSON.parse(res1.body));

// Test 2: Warm Start Valid Invocation
console.log("\n--> Executing Test 2: Valid Event (Warm Start)");
const res2 = await handler(validEvent, mockContext);
console.log(`Status: ${res2.statusCode}`);
console.log("Is Cold Start:", JSON.parse(res2.body).data.isColdStart);

// Test 3: Error Simulation Invocation
console.log("\n--> Executing Test 3: Simulated Error Event");
const res3 = await handler(errorEvent, mockContext);
console.log(`Status: ${res3.statusCode}`);
console.log("Response Body:", JSON.parse(res3.body));

if (res1.statusCode === 200 && res3.statusCode === 400) {
  console.log("\n[SUCCESS] All Node.js 24 (With-Lib) local tests passed!");
} else {
  console.error("\n[FAILURE] Unexpected status code returned.");
  process.exit(1);
}
