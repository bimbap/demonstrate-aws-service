# AWS Amplify (Hosting) — Hands-On Demonstration Material

A comprehensive hands-on demonstration and practical guide to **AWS Amplify Hosting**, covering global static/SPA web deployments, managed SSL certificates, continuous deployment, and single-page application (SPA) rewrite rules.

---

## 📁 Files in This Directory

| File | Description |
|---|---|
| [`index.html`](file:///m:/lks/task/demonstrates-material/amplify/index.html) | Standalone interactive single-page application demonstrating Amplify features (SPA routing simulator, environment inspector, latency ping). |
| [`style.css`](file:///m:/lks/task/demonstrates-material/amplify/style.css) | Modern responsive glassmorphic dark interface. |
| [`app.js`](file:///m:/lks/task/demonstrates-material/amplify/app.js) | Interactive tab switcher, route simulator, and live edge latency probe. |
| [`amplify.yml`](file:///m:/lks/task/demonstrates-material/amplify/amplify.yml) | Official Amplify Hosting build specification file. |
| [`redirect-rules.json`](file:///m:/lks/task/demonstrates-material/amplify/redirect-rules.json) | Regex SPA rewrite rule definition required for deep client-side routing. |

---

## 🌐 What is AWS Amplify Hosting?

AWS Amplify Hosting is a fully managed, Git-based continuous deployment and hosting service for fast, secure, and reliable static and server-side rendered (SSR) web applications.

Under the hood, AWS Amplify provisions and orchestrates:
1. **Amazon S3**: Secure origin storage for static build artifacts.
2. **Amazon CloudFront**: Worldwide Content Delivery Network (CDN) delivering low-latency edge caching.
3. **AWS Certificate Manager (ACM)**: Free, auto-renewing SSL/TLS HTTPS certificates.
4. **AWS Route 53**: Seamless custom domain and subdomain routing (`app.yourdomain.com`).

---

## ⚖️ AWS Amplify Hosting vs. S3 Static Website Hosting

| Feature | AWS Amplify Hosting | Amazon S3 Static Hosting |
|---|---|---|
| **HTTPS / SSL** | **Default & Automatic** (free managed cert). | Requires manual CloudFront + ACM setup. |
| **CI/CD Integration** | **Native Git Integration** (GitHub, GitLab, CodeCommit). | Manual GitHub Actions or custom CI script. |
| **Atomic Deployments** | **Yes** (zero downtime, rollback in 1 click). | No (files uploaded in-place, potential partial reads). |
| **Password Protection** | **Yes** (built-in per-branch access restriction). | Complex Lambda@Edge / CloudFront Functions. |
| **SPA 200 Rewrites** | **1-Click / Regex Rule** support. | Requires CloudFront custom error response (403/404 -> 200). |
| **Feature Branch Previews** | **Automatic** on pull requests. | Manual bucket provisioning. |

---

## 🚀 Step-by-Step Deployment Methods

### Method 1: Manual Deploy via AWS Amplify Console (Drag & Drop)
1. Select all files in this directory (`index.html`, `style.css`, `app.js`, `amplify.yml`) and compress them into a `.zip` archive (e.g. `amplify-demo.zip`).
2. Open the **AWS Amplify Console**:
   - Click **Deploy an app** -> Select **Deploy without Git provider**.
   - **App name**: `lks-amplify-demo`
   - **Environment name**: `prod`
   - **Method**: Drag & drop `amplify-demo.zip`.
3. Click **Save and deploy**.
4. In under 60 seconds, AWS Amplify assigns a live public URL (e.g., `https://main.d1xxxxxxxxx.amplifyapp.com`).

---

### Method 2: Deploying via AWS CLI
```bash
# 1. Zip the assets
zip -r amplify-demo.zip index.html style.css app.js

# 2. Create the Amplify App
APP_ID=$(aws amplify create-app --name "lks-amplify-demo" --query 'app.appId' --output text)

# 3. Create a branch
aws amplify create-branch --app-id $APP_ID --branch-name main

# 4. Create deployment package
DEPLOYMENT_ID=$(aws amplify create-deployment --app-id $APP_ID --branch-name main --query 'jobId' --output text)
UPLOAD_URL=$(aws amplify create-deployment --app-id $APP_ID --branch-name main --query 'zipUploadUrl' --output text)

# 5. Upload zip file to pre-signed S3 URL
curl -X PUT -T amplify-demo.zip -H "Content-Type: application/zip" "$UPLOAD_URL"

# 6. Start deployment
aws amplify start-deployment --app-id $APP_ID --branch-name main --job-id $DEPLOYMENT_ID
```

---

## 🔄 The SPA Rewrite Rule (Mandatory for React / Vue / Angular)

Without this rewrite rule, refreshing a page at `https://yourapp.amplifyapp.com/settings` returns **404 Not Found** because S3 looks for a physical file named `/settings`.

In Amplify Console -> **Rewrites and redirects** -> Add Rule:
- **Source address**: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>`
- **Target address**: `/index.html`
- **Type**: `200 (Rewrite)`

