# Amazon EFS (Elastic File System) — Hands-On Guide & Tutorial

A comprehensive, competition-ready introduction and practical tutorial on **Amazon EFS (Elastic File System)** for AWS Cloud Computing practitioners and LKS competitors.

---

## 📌 Table of Contents
1. [Overview: What is Amazon EFS?](#-overview-what-is-amazon-efs)
2. [Storage Comparison: EFS vs. EBS vs. S3](#-storage-comparison-efs-vs-ebs-vs-s3)
3. [Architecture Blueprint](#-architecture-blueprint)
4. [Key Concepts & Terminology](#-key-concepts--terminology)
5. [Prerequisites & Security Group Setup](#-prerequisites--security-group-setup)
6. [Step-by-Step Hands-On Tutorial](#-step-by-step-hands-on-tutorial)
   - [Step 1: Create an EFS File System](#step-1-create-an-efs-file-system)
   - [Step 2: Prepare EC2 Client Instances](#step-2-prepare-ec2-client-instances)
   - [Step 3: Mount EFS to EC2 Instances](#step-3-mount-efs-to-ec2-instances)
   - [Step 4: Configure Auto-Mount on Boot (/etc/fstab)](#step-4-configure-auto-mount-on-boot-etcfstab)
   - [Step 5: Multi-Instance Concurrency Lab Test](#step-5-multi-instance-concurrency-lab-test)
   - [Step 6: Working with EFS Access Points](#step-6-working-with-efs-access-points)
7. [Automated Bootstrap (EC2 UserData Script)](#-automated-bootstrap-ec2-userdata-script)
8. [Troubleshooting & Common Gotchas](#-troubleshooting--common-gotchas)
9. [LKS Competition & Real-World Best Practices](#-lks-competition--real-world-best-practices)

---

## 📖 Overview: What is Amazon EFS?

**Amazon Elastic File System (Amazon EFS)** is a serverless, fully managed, highly available, and scalable Network File System (NFSv4) that can be concurrently mounted by hundreds or thousands of compute instances (EC2, ECS, EKS, AWS Lambda, and on-premises servers).

### Key Characteristics:
- **POSIX Compliant**: Supports standard file system semantics (directories, permissions, locks, links, read/write/append).
- **Multi-AZ Durability & Availability**: Data is redundantly stored across multiple Availability Zones within an AWS Region.
- **Elastic Auto-Scaling**: Grows automatically as you add files, shrinks as you remove files. You only pay for the storage you consume — no manual partition resizing or disk provisioning.
- **Concurrent Access (ReadWriteMany - RWX)**: Multiple EC2 instances across different subnets can read and write to the same shared directory simultaneously.

---

## ⚖️ Storage Comparison: EFS vs. EBS vs. S3

Understanding when to choose EFS over EBS or S3 is a frequent LKS competition question and cloud architecture interview scenario:

| Feature | Amazon EBS | Amazon EFS | Amazon S3 |
|---|---|---|---|
| **Storage Type** | Block Storage (`/dev/xvda`, `/dev/nvme0n1`) | Distributed File Storage (NFSv4) | Object Storage (Bucket / Key / Value) |
| **Interface** | Raw block device formatted to ext4/xfs | POSIX file system (`mount -t efs / nfs`) | HTTP REST API (`GET`, `PUT`, `DELETE`) |
| **Access Pattern** | Single instance per volume (RWO)* | **Concurrent Multi-Instance (RWX)** | Web-scale distributed access |
| **Scope** | Locked to a single Availability Zone (AZ) | **Multi-AZ Regional File System** | Global namespace, Regional redundancy |
| **Capacity** | Pre-provisioned fixed size (e.g. 50 GB) | **Elastic (grows/shrinks automatically)** | Virtually infinite (5 TB per object) |
| **Primary Use Cases** | OS Boot disk, databases (MySQL/PostgreSQL), high-IOPS transactional storage | Shared web media (`/wp-content/uploads`), shared app configs, container persistent storage, CI/CD artifacts | Static website hosting, backups, data lakes, public downloads |

*\* Note: EBS Multi-Attach exists only for io1/io2 SSD volumes within the same single AZ with cluster-aware filesystem support.*

---

## 🏗️ Architecture Blueprint

The following diagram illustrates how multiple EC2 instances residing in distinct Availability Zones concurrently access a centralized EFS file system via dedicated Mount Targets:

```text
                  VPC: 10.0.0.0/16
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Availability Zone A                 Availability Zone B   │
│  ┌────────────────────────┐          ┌────────────────────┐ │
│  │ Subnet Public A        │          │ Subnet Public B    │ │
│  │ (10.0.1.0/24)          │          │ (10.0.2.0/24)      │ │
│  │                        │          │                    │ │
│  │  ┌──────────────────┐  │          │ ┌────────────────┐ │ │
│  │  │  EC2 Node Alpha  │  │          │ │ EC2 Node Beta  │ │ │
│  │  │  (10.0.1.50)     │  │          │ │ (10.0.2.60)    │ │ │
│  │  │  SG: ec2-app-sg  │  │          │ │ SG: ec2-app-sg │ │ │
│  │  └────────┬─────────┘  │          │ └───────┬────────┘ │ │
│  │           │            │          │         │          │ │
│  │   NFS Port 2049        │          │ NFS Port 2049      │ │
│  │           ▼            │          │         ▼          │ │
│  │  ┌──────────────────┐  │          │ ┌────────────────┐ │ │
│  │  │ EFS Mount Target │  │          │ │EFS Mount Target│ │ │
│  │  │ (10.0.1.15)      │  │          │ │ (10.0.2.25)    │ │ │
│  │  │ SG: efs-mount-sg │  │          │ │ SG: efs-mount-sg││ │
│  │  └────────┬─────────┘  │          │ └───────┬────────┘ │ │
│  └───────────┼────────────┘          └─────────┼──────────┘ │
│              │                                 │            │
│              └────────────────┬────────────────┘            │
│                               ▼                             │
│                  ┌────────────────────────┐                 │
│                  │   Amazon EFS Storage   │                 │
│                  │   (Elastic NFSv4 Pool) │                 │
│                  │   Multi-AZ Redundancy  │                 │
│                  └────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Concepts & Terminology

1. **Mount Target**:
   An IPv4 endpoint created inside a specific subnet that serves as the connection point for EC2 instances in that Availability Zone. An EFS file system can have one Mount Target per Availability Zone.
2. **EFS Mount Helper (`amazon-efs-utils`)**:
   An open-source utility client provided by AWS that simplifies mounting EFS via TLS encryption in-transit, IAM authentication, and automatic DNS resolution.
3. **Storage Classes**:
   - **EFS Standard**: For frequently accessed active files.
   - **EFS Standard-Infrequent Access (IA)**: Cost-optimized storage for files not accessed in the last 7 to 90 days (configured via Lifecycle Management).
   - **EFS Archive**: Lowest-cost tier for rarely accessed data.
4. **Throughput Modes**:
   - **Elastic (Recommended)**: Dynamically scales read/write throughput based on active workload.
   - **Provisioned**: Guaranteed throughput allocated upfront (useful if storage volume is small but I/O is very high).
   - **Bursting**: Throughput baseline scales proportionally to the file system size.
5. **Access Points**:
   Application-specific entry points into an EFS file system that enforce a specific POSIX user (UID/GID) and restrict access to a specific root subdirectory (preventing applications from escaping into parent folders).

---

## 🛡️ Prerequisites & Security Group Setup

The **#1 cause of failure** when mounting EFS in AWS exams and real-world environments is an incorrectly configured Security Group. NFS traffic communicates over **TCP port 2049**.

### Required Security Groups:

1. **`ec2-app-sg`** (Attached to EC2 Instances):
   - Inbound: SSH (Port 22), HTTP (Port 80) as needed.
   - Outbound: All traffic (`0.0.0.0/0`) or TCP port 2049 destined for `efs-mount-sg`.

2. **`efs-mount-sg`** (Attached to EFS Mount Targets):
   - **Inbound Rule**:
     - **Type**: `NFS`
     - **Protocol**: `TCP`
     - **Port Range**: `2049`
     - **Source**: Select the Security Group ID of `ec2-app-sg` (e.g. `sg-0abc123456789def0`). **Do not use `0.0.0.0/0` in production!**
   - **Outbound Rule**: Default all outbound.

---

## 🛠️ Step-by-Step Hands-On Tutorial

### Step 1: Create an EFS File System

#### Option A: Using AWS Management Console
1. Navigate to **Amazon EFS** -> Click **Create file system**.
2. Click **Customize** to access network and storage settings.
3. **General**:
   - Name: `demo-shared-storage`
   - File system type: **Regional** (replicated across multiple AZs).
4. **Network Settings**:
   - Select your target **VPC**.
   - Under **Mount targets**, assign the appropriate subnet for each Availability Zone.
   - **Crucial**: Remove the `default` security group and attach `efs-mount-sg`.
5. Review and click **Create**. Note down the **File System ID** (e.g. `fs-0123456789abcdef0`).

#### Option B: Using AWS CLI
```bash
# 1. Create Security Group for EFS Mount Targets
EFS_SG_ID=$(aws ec2 create-security-group \
  --group-name "efs-mount-sg" \
  --description "Security group for EFS Mount Targets" \
  --vpc-id "vpc-0123456789abcdef0" \
  --query 'GroupId' --output text)

# 2. Allow NFS port 2049 from your EC2 Security Group
aws ec2 authorize-security-group-ingress \
  --group-id "$EFS_SG_ID" \
  --protocol tcp \
  --port 2049 \
  --source-group "sg-ec2instancegroup123"

# 3. Create EFS File System
EFS_ID=$(aws efs create-file-system \
  --creation-token "demo-efs-token-2026" \
  --performance-mode "generalPurpose" \
  --throughput-mode "elastic" \
  --encrypted \
  --tags Key=Name,Value=demo-shared-storage \
  --query 'FileSystemId' --output text)

echo "Created EFS File System: $EFS_ID"

# 4. Create Mount Targets in Each Subnet (wait until EFS state is 'available')
aws efs create-mount-target \
  --file-system-id "$EFS_ID" \
  --subnet-id "subnet-01111111111111111" \
  --security-groups "$EFS_SG_ID"

aws efs create-mount-target \
  --file-system-id "$EFS_ID" \
  --subnet-id "subnet-02222222222222222" \
  --security-groups "$EFS_SG_ID"
```

---

### Step 2: Prepare EC2 Client Instances

Launch two EC2 instances running **Ubuntu 22.04/24.04 LTS** or **Amazon Linux 2023** in different subnets/AZs of the same VPC.

Log in to both instances via SSH:
```bash
ssh -i <my-key.pem> ubuntu@<EC2_INSTANCE_PUBLIC_IP>
```

#### Install NFS Client / EFS Mount Helper:

**For Ubuntu / Debian:**
```bash
sudo apt-get update -y
sudo apt-get install -y nfs-common binutils

# Optional but recommended: Install amazon-efs-utils
git clone https://github.com/aws/efs-utils
cd efs-utils
./build-deb.sh
sudo apt-get install -y ./build/amazon-efs-utils*deb
```

**For Amazon Linux 2023:**
```bash
sudo dnf install -y amazon-efs-utils
```

---

### Step 3: Mount EFS to EC2 Instances

Create a shared mount point directory on both instances:
```bash
sudo mkdir -p /mnt/shared-data
```

#### Method 1: Mount using EFS Mount Helper (Recommended with TLS encryption)
```bash
# Syntax: sudo mount -t efs -o tls <FILE_SYSTEM_ID>:/ <MOUNT_POINT>
sudo mount -t efs -o tls fs-0123456789abcdef0:/ /mnt/shared-data
```

#### Method 2: Mount using Standard NFSv4 Client (Fallback if efs-utils is unavailable)
```bash
# Syntax: sudo mount -t nfs4 -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2 <EFS_DNS_NAME>:/ <MOUNT_POINT>
sudo mount -t nfs4 -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2 \
  fs-0123456789abcdef0.efs.us-east-1.amazonaws.com:/ /mnt/shared-data
```

#### Verify Mount:
```bash
df -h -T /mnt/shared-data
```
**Expected Output:**
```text
Filesystem                                        Type  Size  Used Avail Use% Mounted on
fs-0123456789abcdef0.efs.us-east-1.amazonaws.com  nfs4  8.0E     0  8.0E   0% /mnt/shared-data
```
*(Notice the huge 8.0 Exabyte virtual capacity, confirming EFS dynamic elastic allocation).*

---

### Step 4: Configure Auto-Mount on Boot (`/etc/fstab`)

If the instance reboots, manual mounts are lost. To make mounts persistent, update `/etc/fstab`.

> [!CAUTION]
> In network file systems, failing to include `_netdev` or `nofail` can cause the operating system to **hang during boot** if the network stack has not initialized before mounting!

#### Add to `/etc/fstab` on both instances:

**Using EFS Mount Helper:**
```text
fs-0123456789abcdef0:/ /mnt/shared-data efs _netdev,tls,nofail 0 0
```

**Using Standard NFS:**
```text
fs-0123456789abcdef0.efs.us-east-1.amazonaws.com:/ /mnt/shared-data nfs4 nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,_netdev,nofail 0 0
```

#### Test `/etc/fstab` without rebooting:
```bash
sudo umount /mnt/shared-data
sudo mount -a
df -h /mnt/shared-data
```
If `mount -a` succeeds with zero errors, your `/etc/fstab` entry is completely safe for system reboots.

---

### Step 5: Multi-Instance Concurrency Lab Test

This hands-on test proves that Node Alpha and Node Beta share the exact same distributed storage pool across Availability Zones.

#### On Node Alpha (AZ-A):
```bash
# 1. Ensure write permissions for the test user
sudo chown -R ubuntu:ubuntu /mnt/shared-data

# 2. Write a status file from Node Alpha
echo "Hello from EC2 Node Alpha ($(hostname)) at $(date)" > /mnt/shared-data/cluster-status.txt

# 3. Create a shared media folder
mkdir -p /mnt/shared-data/uploads
echo "Image payload mock #001" > /mnt/shared-data/uploads/avatar.png
```

#### On Node Beta (AZ-B):
```bash
# 1. Read the file written by Node Alpha in real-time
cat /mnt/shared-data/cluster-status.txt

# Expected Output:
# Hello from EC2 Node Alpha (ip-10-0-1-50) at Tue Oct 20 10:15:00 UTC 2026

# 2. Append data from Node Beta
echo "Acknowledged and appended by Node Beta ($(hostname)) at $(date)" >> /mnt/shared-data/cluster-status.txt

# 3. Verify directory contents
ls -la /mnt/shared-data/uploads
```

Both instances can read, write, and modify files with full POSIX lock synchronization and sub-second consistency!

---

### Step 6: Working with EFS Access Points

In modern microservices, Docker containers, or multi-tenant web servers, granting root access to the entire file system is a security risk. **EFS Access Points** solve this by enforcing:
1. **POSIX Identity Override**: Automatically maps client requests to a specific User ID (UID) and Group ID (GID), ignoring the client's local user credentials.
2. **Root Directory Jailing**: Points the client directly to a subfolder (e.g. `/app/wordpress-uploads`), preventing the client from accessing the root or other tenants.

#### Creating an Access Point via AWS CLI:
```bash
aws efs create-access-point \
  --file-system-id fs-0123456789abcdef0 \
  --posix-user Uid=1001,Gid=1001 \
  --root-directory "Path=/apps/tenant-alpha,CreationInfo={OwnerUid=1001,OwnerGid=1001,Permissions=755}" \
  --tags Key=Name,Value=TenantAlphaAccessPoint
```

#### Mounting via Access Point:
```bash
sudo mount -t efs -o tls,accesspoint=fsap-0123456789abcdef0 fs-0123456789abcdef0:/ /mnt/shared-data
```

---

## ⚡ Automated Bootstrap (EC2 UserData Script)

Use this complete UserData script in the EC2 Launch Template / Launch Instance console to automatically prepare and mount EFS at first boot:

```bash
#!/bin/bash
set -e
exec > >(tee -a /var/log/user-data.log) 2>&1

echo "========================================="
echo " Starting EFS Client Setup & Auto-Mount  "
echo "========================================="

# 1. Configuration Variables
EFS_FS_ID="fs-0123456789abcdef0" # Replace with your EFS File System ID
AWS_REGION="us-east-1"           # Replace with your AWS Region
MOUNT_POINT="/mnt/efs"

# 2. Install Prerequisites
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y nfs-common binutils git curl

# 3. Build & Install amazon-efs-utils
if ! command -v amazon-efs-mount-watchdog > /dev/null 2>&1; then
  echo "Installing amazon-efs-utils..."
  cd /tmp
  git clone https://github.com/aws/efs-utils
  cd efs-utils
  ./build-deb.sh
  apt-get install -y ./build/amazon-efs-utils*deb
  rm -rf /tmp/efs-utils
fi

# 4. Create Mount Point
mkdir -p "$MOUNT_POINT"

# 5. Configure Persistent Mount in /etc/fstab
if ! grep -q "$EFS_FS_ID" /etc/fstab; then
  echo "$EFS_FS_ID:/ $MOUNT_POINT efs _netdev,tls,nofail 0 0" >> /etc/fstab
fi

# 6. Mount Filesystem
mount -a

# 7. Set Permissions
chmod 777 "$MOUNT_POINT"

echo "✅ EFS successfully mounted to $MOUNT_POINT"
df -h "$MOUNT_POINT"
```

---

## 🔍 Troubleshooting & Common Gotchas

### 1. `mount` command hangs indefinitely and times out
- **Root Cause**: Network traffic blocked by Security Groups or Subnet Routing.
- **Fix**:
  1. Verify the EFS Mount Target Security Group has an **Inbound Rule** for `NFS` (port `2049`).
  2. Verify the Source is set to the EC2 instance's Security Group ID.
  3. Ensure the EC2 instance and the EFS Mount Target are in the **same VPC**.
  4. Ensure both subnets have route tables that allow internal communication.

### 2. EC2 instance hangs or fails to boot after adding to `/etc/fstab`
- **Root Cause**: Linux attempted to mount the network file system before network interfaces (DHCP/ENI) were online, causing a systemd boot hang.
- **Fix**: Always include `_netdev` and `nofail` in the `/etc/fstab` options:
  ```text
  fs-0123456789abcdef0:/ /mnt/shared-data efs _netdev,tls,nofail 0 0
  ```

### 3. "Failed to resolve server" or DNS lookup error
- **Root Cause**: The VPC has DNS Hostnames disabled.
- **Fix**:
  1. Open **VPC Console** -> Select your VPC -> **Actions** -> **Edit VPC settings**.
  2. Enable both **DNS resolution** and **DNS hostnames**.

### 4. Permission Denied when writing to mounted EFS
- **Root Cause**: The default root directory of an EFS file system is owned by `root:root` with mode `755`. Regular non-root users (`ubuntu`, `ec2-user`, `www-data`) cannot write to `/mnt/shared-data`.
- **Fix**:
  ```bash
  sudo chown -R ubuntu:ubuntu /mnt/shared-data
  # Or for web server user:
  sudo chown -R www-data:www-data /mnt/shared-data
  ```

---

## 🏆 LKS Competition & Real-World Best Practices

1. **Security First**: Never expose NFS Port 2049 to `0.0.0.0/0`. Always bind Security Group to Security Group.
2. **Always Use `_netdev,nofail` in `/etc/fstab`**: In competition evaluations, servers are frequently rebooted by automated grading scripts to test persistence. If an instance hangs on boot due to a missing `_netdev` flag, you lose points for the entire service.
3. **Multi-AZ High Availability**: Always provision Mount Targets in **at least 2 Availability Zones**.
4. **Choose Elastic Throughput**: For modern workloads and competition tests, use **Elastic Throughput Mode** to prevent throttling without paying for idle provisioned capacity.
5. **Decouple Dynamic Web Assets**: In WordPress or Laravel multi-node architectures, store PHP code locally on EBS/AMI and mount shared user media (`/var/www/html/wp-content/uploads`) on EFS. This guarantees lightning-fast PHP execution while keeping user uploads perfectly synchronized across instances.
