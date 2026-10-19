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

# 5. Prepare web root directory and permissions
echo "=== Preparing Web Root Directory (/var/www/html) ==="
mkdir -p /var/www/html
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
