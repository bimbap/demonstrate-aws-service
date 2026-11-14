# CLI & Event Testing Guide (`nodejs-crud-api-gateway/events`)

Reference guide for testing the CRUD REST API (`https://py4o28qqd9.execute-api.us-east-1.amazonaws.com/prod`) from **Git Bash** and **Windows PowerShell**, plus local Lambda event payloads.

---

## 📁 Event Payloads in This Folder

| File | Protocol | Purpose |
|---|---|---|
| [`event-create.json`](event-create.json) | REST API | `POST /prod/items` — Create item |
| [`event-list.json`](event-list.json) | REST API | `GET /prod/items` — List all items |
| [`event-get.json`](event-get.json) | REST API | `GET /prod/items/{id}` — Get item by ID |
| [`event-update.json`](event-update.json) | REST API | `PUT /prod/items/{id}` — Update item by ID |
| [`event-delete.json`](event-delete.json) | REST API | `DELETE /prod/items/{id}` — Delete item by ID |
| [`event-error.json`](event-error.json) | REST API | `POST /prod/items` — Validation error (`400`) |
| [`event-ws-connect.json`](event-ws-connect.json) | WebSocket | `$connect` lifecycle event |
| [`event-ws-crud.json`](event-ws-crud.json) | WebSocket | `$default` CRUD message (`action: "create"`) |
| [`event-ws-disconnect.json`](event-ws-disconnect.json) | WebSocket | `$disconnect` lifecycle event |

---

## 🐧 Git Bash / Linux / macOS (`curl`)

> Use `BASE="..."` (no `$` on assignment, no spaces around `=`) and single-quoted JSON `'{"name":...}'`.

```bash
BASE="https://py4o28qqd9.execute-api.us-east-1.amazonaws.com/prod"

# 1. CREATE (POST /items)
curl -X POST "$BASE/items" \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo Kelas","description":"Test dari Git Bash"}'

# 2. LIST (GET /items)
curl "$BASE/items"

# 3. GET BY ID (replace <ID> with the id returned by POST)
curl "$BASE/items/<ID>"

# 4. UPDATE (PUT /items/<ID>)
curl -X PUT "$BASE/items/<ID>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo Kelas Updated","description":"Updated via Git Bash"}'

# 5. DELETE (DELETE /items/<ID>)
curl -X DELETE "$BASE/items/<ID>"
```

---

## 🪟 Windows PowerShell (`curl.exe`)

> In PowerShell, `curl` is an alias for `Invoke-WebRequest`. Always use **`curl.exe`** and escape inner double quotes with `\"`.

```powershell
$BASE = "https://{py4o28qqd9}.execute-api.us-east-1.amazonaws.com/prod"

# 1. CREATE (POST /items)
curl.exe -X POST "$BASE/items" `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Demo Kelas\",\"description\":\"Test dari PowerShell\"}'

# 2. LIST (GET /items)
curl.exe "$BASE/items"

# 3. GET BY ID (replace <ID> with the id returned by POST)
curl.exe "$BASE/items/<ID>"

# 4. UPDATE (PUT /items/<ID>)
curl.exe -X PUT "$BASE/items/<ID>" `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Demo Kelas Updated\",\"description\":\"Updated via PowerShell\"}'

# 5. DELETE (DELETE /items/<ID>)
curl.exe -X DELETE "$BASE/items/<ID>"
```

---

## 🧪 Offline Local Harness (No AWS Needed)

Run all 11 REST + WebSocket test scenarios locally using the in-memory mock:

```bash
cd ..
node test-local.js
```
