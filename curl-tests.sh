#!/usr/bin/env bash
# ==============================================================================
# Amazon API Gateway - Demonstration Testing Commands
# Replace <API_ID> and <REGION> with your deployed API Gateway Stage URL
# ==============================================================================

BASE_URL="https://<API_ID>.execute-api.<REGION>.amazonaws.com/prod"

echo "=== 1. Testing GET /health ==="
curl -i -X GET "${BASE_URL}/health"

echo -e "\n\n=== 2. Testing GET /products ==="
curl -i -X GET "${BASE_URL}/products"

echo -e "\n\n=== 3. Testing POST /orders ==="
curl -i -X POST "${BASE_URL}/orders" \
  -H "Content-Type: application/json" \
  -d '{"item": "EC2-Instance", "quantity": 2}'

echo -e "\n\n=== 4. Testing Preflight CORS OPTIONS /health ==="
curl -i -X OPTIONS "${BASE_URL}/health" \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: GET"

