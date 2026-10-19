# TaskFlow — EC2 Background Compute Engine (Demonstration Material)

A modern, interactive background task processing engine web application designed to demonstrate **Amazon EC2 compute capabilities, CPU/RAM workload dynamics, and worker concurrency**.

---

## 📁 Files in This Directory

| File | Description |
|---|---|
| [`index.html`](file:///m:/lks/task/demonstrates-material/ec2/index.html) | Standalone single-page web application (HTML, CSS, JS) with live server vitals HUD, worker thread queue, and job execution simulator. |
| [`user-data.sh`](file:///m:/lks/task/demonstrates-material/ec2/user-data.sh) | EC2 UserData bootstrap script for **Ubuntu 22.04 / 24.04 LTS** focused purely on **Server & Nginx Preparation** (updates apt, installs Nginx, Git, Curl, JQ, and configures web root permissions). |

---

## ⚙️ What `user-data.sh` Does

The UserData script is dedicated strictly to **server environment preparation**:
1. Sets non-interactive apt environment.
2. Updates Ubuntu package repositories (`apt-get update -y`).
3. Installs `nginx`, `curl`, `wget`, `git`, `unzip`, and `jq`.
4. Prepares `/var/www/html` with proper `www-data` ownership and `755` permissions.
5. Enables and starts the Nginx service.
6. Logs all execution details to `/var/log/user-data.log`.

---

## 🚀 Deployment Workflow

### Step 1: Launch EC2 Instance with UserData
- **AMI**: Ubuntu Server 24.04 LTS or 22.04 LTS (`ami-...`)
- **Instance Type**: `t2.micro` or `t3.micro`
- **Security Group Inbound Rules**:
  - `HTTP` (Port 80): `0.0.0.0/0`
  - `SSH` (Port 22): `My IP` or `0.0.0.0/0`
- **User data**: Paste [`user-data.sh`](file:///m:/lks/task/demonstrates-material/ec2/user-data.sh) into **Advanced Details** -> **User data**.

---

### Step 2: Deploy `index.html` to Server

Once the instance is running and Nginx is prepared, deploy the web application:

#### Option A: Copy via SCP
```bash
scp -i <my-key.pem> index.html ubuntu@<EC2-PUBLIC-IP>:/tmp/
ssh -i <my-key.pem> ubuntu@<EC2-PUBLIC-IP> "sudo mv /tmp/index.html /var/www/html/index.html && sudo chown www-data:www-data /var/www/html/index.html"
```

#### Option B: Pull from S3 (If using S3 Bucket / IAM Role)
```bash
aws s3 cp s3://<my-bucket>/index.html /var/www/html/index.html
sudo chown www-data:www-data /var/www/html/index.html
```

---

## 🔍 Verification

1. Open in browser: `http://<EC2-PUBLIC-IP>`
2. Inspect UserData logs:
   ```bash
   sudo cat /var/log/user-data.log
   ```
3. Check Nginx service:
   ```bash
   sudo systemctl status nginx
   ```
