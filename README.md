# EventPass — Tech Summit & Digital Badge Portal (AWS Amplify Demonstration)

An end-to-end hands-on demonstration and production-ready Single Page Application (SPA) designed to showcase **AWS Amplify Hosting**. EventPass is a realistic cloud conference portal featuring keynote exploration, speaker profiles, interactive tier selection, and instant digital lanyard badge generation with client-side state persistence.

---

## 📁 Files in This Directory

| File | Description |
|---|---|
| [`index.html`](file:///m:/lks/task/demonstrates-material/amplify/index.html) | Semantic HTML5 SPA layout featuring Summit Hero, Sessions Catalog, Speaker Lineup, Ticket Tiers, Digital Lanyard Badge modal, and Edge Telemetry HUD. |
| [`style.css`](file:///m:/lks/task/demonstrates-material/amplify/style.css) | Modern dark obsidian theme with glassmorphic cards, AWS orange highlights, responsive grid layouts, and `@media print` rules for printing physical attendee badges. |
| [`app.js`](file:///m:/lks/task/demonstrates-material/amplify/app.js) | Zero-dependency client-side SPA hash router (`#/explore`, `#/speakers`, `#/tickets`, `#/my-pass`), category & search filtering, `localStorage` ticket persistence, and CloudFront edge latency ping. |
| [`amplify.yml`](file:///m:/lks/task/demonstrates-material/amplify/amplify.yml) | Official AWS Amplify Hosting build specification configuring static asset packaging and deployment artifacts. |
| [`redirect-rules.json`](file:///m:/lks/task/demonstrates-material/amplify/redirect-rules.json) | Regex SPA 200 rewrite rule definition required for deep client-side routing on CloudFront edge distributions. |

---

## 🌐 What is AWS Amplify Hosting?

AWS Amplify Hosting provides fully managed, Git-based continuous deployment and hosting for fast, secure, and reliable static and server-side rendered (SSR) web applications.

Under the hood, AWS Amplify provisions and orchestrates:
1. **Amazon S3**: Secure origin storage for static build artifacts.
2. **Amazon CloudFront**: Worldwide Content Delivery Network (CDN) delivering low-latency edge caching across 300+ global Points-of-Presence (PoPs).
3. **AWS Certificate Manager (ACM)**: Free, auto-renewing SSL/TLS HTTPS certificates.
4. **AWS Route 53**: Seamless custom domain and subdomain routing (`summit.yourdomain.com`).
5. **Atomic Deployments**: Instant build promotions and one-click rollbacks with zero downtime.

---

## ⚖️ AWS Amplify Hosting vs. S3 Static Website Hosting

| Capability | AWS Amplify Hosting | Amazon S3 Static Website Hosting |
|---|---|---|
| **HTTPS / SSL** | **Automatic & Default** (Free managed ACM certificate). | Requires manual CloudFront distribution + ACM setup. |
| **CI/CD Integration** | **Native Git Integration** (GitHub, GitLab, Bitbucket, CodeCommit). | Manual GitHub Actions, CodePipeline, or custom bash script. |
| **Atomic Deployments** | **Yes** (Zero downtime; rollback to any previous commit in 1 click). | No (Files overwritten in-place, potential partial reads during upload). |
| **Password Protection** | **Yes** (Built-in basic auth toggle per branch for staging/QA). | Requires complex Lambda@Edge or CloudFront Functions. |
| **SPA 200 Rewrites** | **1-Click / Regex Rule** support built directly into console. | Requires CloudFront custom error response mapping (403/404 -> 200). |
| **Branch Previews** | **Automatic** ephemeral URLs for every pull request. | Manual bucket provisioning per PR branch. |

---

## 🚀 Step-by-Step Deployment Methods

### Method 1: Manual Deploy via AWS Amplify Console (Drag & Drop)
1. Compress the directory contents into a `.zip` archive:
   ```bash
   # Linux / macOS / Git Bash
   zip -r eventpass-amplify.zip index.html style.css app.js amplify.yml redirect-rules.json
   ```
2. Open the **AWS Management Console** and navigate to **AWS Amplify**.
3. Click **Deploy an app** -> Select **Deploy without Git provider**.
4. Enter the App details:
   - **App name**: `wa-eventpass-app`
   - **Environment name**: `prod`
   - **Method**: Drag and drop `eventpass-amplify.zip`.
5. Click **Save and deploy**.
6. Within 60 seconds, AWS Amplify will provision the CloudFront distribution and provide a live public HTTPS URL (e.g. `https://prod.d1xxxxxxxxxxxx.amplifyapp.com`).

---

### Method 2: Continuous Deployment via Git (Recommended for Teams)
1. Push this branch or repository to GitHub / GitLab.
2. In AWS Amplify Console, click **Host web app** -> Choose your Git provider.
3. Authorize GitHub and select the repository and branch (`amplify` or `main`).
4. Amplify will automatically detect `amplify.yml` and configure the build settings.
5. Click **Save and deploy**. Any future `git push` will trigger an automated build, test, and atomic deployment.

---

### Method 3: Deploying via AWS CLI
```bash
# 1. Zip the static assets
zip -r eventpass.zip index.html style.css app.js amplify.yml

# 2. Create the Amplify App
APP_ID=$(aws amplify create-app --name "wa-eventpass-app" --query 'app.appId' --output text)

# 3. Create production branch
aws amplify create-branch --app-id $APP_ID --branch-name prod

# 4. Request deployment upload target
UPLOAD_URL=$(aws amplify create-deployment --app-id $APP_ID --branch-name prod --query 'zipUploadUrl' --output text)
DEPLOYMENT_ID=$(aws amplify create-deployment --app-id $APP_ID --branch-name prod --query 'jobId' --output text)

# 5. Upload zip archive directly to pre-signed S3 URL
curl -X PUT -T eventpass.zip -H "Content-Type: application/zip" "$UPLOAD_URL"

# 6. Trigger deployment execution
aws amplify start-deployment --app-id $APP_ID --branch-name prod --job-id $DEPLOYMENT_ID
```

---

## 🔄 The SPA Rewrite Rule (Mandatory for Single Page Apps)

Single Page Applications (React, Vue, or Vanilla SPA routers) use client-side routing. When a user directly visits or refreshes a URL like `https://yourapp.amplifyapp.com/tickets`, Amazon S3 looks for a physical file at `/tickets/index.html`. Because that file does not exist, S3 returns a `404 Not Found` or `403 Forbidden`.

To resolve this, configure an **Amplify Redirect / Rewrite Rule**:

1. In Amplify Console, navigate to **Rewrites and redirects** under App settings.
2. Click **Add rule** with the following parameters:
   - **Source address**: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>`
   - **Target address**: `/index.html`
   - **Type**: `200 (Rewrite)`
3. Save the rule. CloudFront will now transparently serve `/index.html` with an HTTP 200 status code, allowing the JavaScript client router to render the correct view without page reloads.
