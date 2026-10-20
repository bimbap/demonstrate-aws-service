#!/bin/bash
# ==============================================================================
# AWS EC2 UserData — EFS Client & Auto-Mount Bootstrap Script
# OS        : Ubuntu 22.04 / 24.04 LTS
# Target    : Install EFS tools, prepare mount point, and configure /etc/fstab
# ==============================================================================

set -euo pipefail

# 1. Log all execution details to /var/log/user-data.log
exec > >(tee -a /var/log/user-data.log) 2>&1
echo "=== [$(date)] Starting EFS Client Setup & Auto-Mount ==="

# ------------------------------------------------------------------------------
# CONFIGURATION: Set your EFS File System ID below (or pass via IMDS/tags)
# ------------------------------------------------------------------------------
EFS_FS_ID="${EFS_FS_ID:-fs-CHANGEME}"
MOUNT_POINT="${MOUNT_POINT:-/mnt/efs}"

# 2. Non-interactive apt environment
export DEBIAN_FRONTEND=noninteractive

# 3. Update repositories and install prerequisites
echo "=== Updating package repositories and installing prerequisites ==="
apt-get update -y
apt-get install -y \
  nfs-common \
  binutils \
  git \
  curl \
  wget \
  awscli \
  jq

# 4. Build and install amazon-efs-utils (enables TLS & IAM authentication)
if ! command -v amazon-efs-mount-watchdog > /dev/null 2>&1; then
  echo "=== Building and installing amazon-efs-utils ==="
  TEMP_BUILD_DIR=$(mktemp -d)
  git clone https://github.com/aws/efs-utils "$TEMP_BUILD_DIR/efs-utils"
  (
    cd "$TEMP_BUILD_DIR/efs-utils"
    ./build-deb.sh
    apt-get install -y ./build/amazon-efs-utils*deb
  )
  rm -rf "$TEMP_BUILD_DIR"
fi

# 5. Create local mount directory
echo "=== Creating mount directory at $MOUNT_POINT ==="
mkdir -p "$MOUNT_POINT"

# 6. Configure persistent auto-mount in /etc/fstab
if [ "$EFS_FS_ID" != "fs-CHANGEME" ]; then
  echo "=== Configuring /etc/fstab for persistent mount on reboot ==="
  if ! grep -q "$EFS_FS_ID" /etc/fstab; then
    # _netdev ensures network stack is ready before mounting; nofail prevents boot hang if offline
    echo "$EFS_FS_ID:/ $MOUNT_POINT efs _netdev,tls,nofail 0 0" >> /etc/fstab
  fi

  echo "=== Mounting file system via mount -a ==="
  mount -a || true

  # Set open permissions for application access
  chmod 777 "$MOUNT_POINT"
else
  echo "=== Note: EFS_FS_ID is set to placeholder 'fs-CHANGEME'. Skipping immediate mount. ==="
  echo "=== Run: sudo mount -t efs -o tls <YOUR_FS_ID>:/ $MOUNT_POINT ==="
fi

# 7. Verification
echo "=== Mount verification ==="
df -h -T "$MOUNT_POINT" || true
echo "=== [$(date)] EFS Client Setup Complete! ==="
