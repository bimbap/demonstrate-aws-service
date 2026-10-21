#!/bin/bash
# ==============================================================================
# AWS EC2 UserData — Server Preparation Script
# OS        : Ubuntu 22.04 / 24.04 LTS
# Target    : Nginx Web Server & Base Environment Preparation
# ==============================================================================

set -euo pipefail

# 1. Log all output to /var/log/user-data.log for debugging
exec > >(tee -a /var/log/user-data.log) 2>&1
echo "=== [$(date)] Starting EC2 Server Preparation ==="

# 2. Non-interactive frontend for apt
export DEBIAN_FRONTEND=noninteractive

# 3. Update package repositories
echo "=== Updating package index ==="
apt-get update -y

# 4. Install Nginx and essential utilities
echo "=== Installing Nginx, Curl, Git, and essential tools ==="
apt-get install -y \
  nginx \
  curl \
  wget \
  git \
  unzip \
  jq

# 5. Prepare web root directory and create custom index.html
echo "=== Preparing Web Root Directory and index.html ==="
mkdir -p /var/www/html

cat <<'EOF' > /var/www/html/index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EC2 Web Server</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1rem;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      padding: 2.5rem;
      border-radius: 12px;
      text-align: center;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    }
    .badge {
      display: inline-block;
      background: #065f46;
      color: #34d399;
      font-size: 0.85rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 1.5rem;
      color: #38bdf8;
      margin-bottom: 0.5rem;
    }
    p {
      color: #94a3b8;
      font-size: 0.95rem;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Online</div>
    <h1>Server Berhasil Aktif</h1>
    <p>Nginx udah jalan normal di EC2!</p>
  </div>
</body>
</html>
EOF

chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html

# 6. Enable and start Nginx service
echo "=== Enabling and starting Nginx service ==="
systemctl enable nginx
systemctl restart nginx

# 7. Verification check
echo "=== Verifying Nginx service status ==="
if systemctl is-active --quiet nginx; then
  echo "=== [$(date)] EC2 Server Preparation SUCCESS! Nginx is running and ready for deployment. ==="
else
  echo "=== [$(date)] Warning: Nginx service is not active. Check /var/log/nginx/error.log ==="
fi
