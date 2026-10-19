# Pustaka — Digital Book Archive (Amazon S3 Demonstration Material)

An interactive, responsive digital book archive application designed to demonstrate **Amazon S3 Object Storage & Static Website Hosting**.

---

## 📁 Files in This Directory

| File | Description |
|---|---|
| [`index.html`](file:///m:/lks/task/demonstrates-material/s3/index.html) | Standalone single-page application (HTML5, Vanilla CSS, JS) featuring an editorial book catalog, search and category filtering, add/delete book object forms, and a dynamic digital loan receipt popup. |

---

## ✨ Features & Architecture

- **S3 Static Web Ready**: 100% client-side with zero build steps or server dependencies — directly deployable to an Amazon S3 bucket.
- **Editorial Book Catalog**: Realistic books spanning Self Development, Philosophy, Finance, History, and Literature (*Atomic Habits*, *Sapiens*, *Bumi Manusia*, etc.).
- **Live Search & Category Filtering**: Instant multi-parameter search (title, author, publisher, ISBN) and category filtering with dynamic count badges.
- **Interactive Loan Receipt ("Peminjaman Berhasil")**:
  - Interactive loan duration slider & preset chips (**3**, **7**, **14**, and **30 Hari**).
  - Dynamic due date calculation (`Today + X days`) in real-time.
  - Unique transaction ticket code (`#PSTK-XXXXXX`) and active loan status.
- **Client-Side State Persistence**: Retains state across browser sessions using `localStorage`.

---

## 🚀 Deploying to Amazon S3 (Static Website Hosting)

### Method 1: Using the AWS Management Console

1. **Create an S3 Bucket**:
   - Open the **Amazon S3 Console** and click **Create bucket**.
   - Bucket name: e.g. `pustaka-archive-demo-2026` (must be globally unique).
   - Region: Select your preferred region (e.g. `us-east-1` or `ap-southeast-1`).
   - Uncheck **Block *all* public access** (and acknowledge the warning) if using direct static website hosting.

2. **Enable Static Website Hosting**:
   - Open your bucket -> **Properties** tab -> Scroll down to **Static website hosting**.
   - Click **Edit** -> Select **Enable**.
   - Hosting type: **Host a static website**.
   - Index document: `index.html`.
   - Click **Save changes**.

3. **Configure Public Read Bucket Policy**:
   - Go to the **Permissions** tab -> **Bucket policy** -> Click **Edit**.
   - Paste the following policy (replace `<your-bucket-name>` with your actual bucket name):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::<your-bucket-name>/*"
       }
     ]
   }
   ```
   - Click **Save changes**.

4. **Upload `index.html`**:
   - Go to the **Objects** tab -> Click **Upload** -> Select [`index.html`](file:///m:/lks/task/demonstrates-material/s3/index.html) -> Click **Upload**.

5. **Access the Web App**:
   - Return to the **Properties** tab -> **Static website hosting**.
   - Copy the **Bucket website endpoint** URL (e.g. `http://<your-bucket-name>.s3-website.<region>.amazonaws.com`).
   - Open it in your web browser.

---

### Method 2: Using the AWS CLI

```bash
# 1. Create S3 Bucket
aws s3 mb s3://pustaka-archive-demo-2026 --region us-east-1

# 2. Disable Block Public Access
aws s3api put-public-access-block \
  --bucket pustaka-archive-demo-2026 \
  --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# 3. Enable Static Website Hosting
aws s3 website s3://pustaka-archive-demo-2026/ --index-document index.html

# 4. Apply Public Read Policy
aws s3api put-bucket-policy --bucket pustaka-archive-demo-2026 --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::pustaka-archive-demo-2026/*"
    }
  ]
}'

# 5. Upload index.html with public-read and HTML content-type
aws s3 cp index.html s3://pustaka-archive-demo-2026/index.html \
  --content-type "text/html"
```

---

## 💻 Local Preview

Simply double-click [`index.html`](file:///m:/lks/task/demonstrates-material/s3/index.html) in your file explorer or open it in any modern browser (Chrome, Edge, Firefox, Safari). Zero dependencies required.
