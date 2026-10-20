# AWS Service Demonstration Materials

Interactive, zero-dependency web applications and infrastructure automation scripts designed for **LKS Cloud Computing**, hands-on workshops, and AWS service demonstrations.

Each AWS service demonstration is maintained within its own dedicated **Git branch** to keep the codebase clean, modular, and easy to deploy independently.

---

## 🌿 Repository Branch Strategy

Instead of maintaining separate repositories for each AWS service, this repository uses a **Service-as-a-Branch** structure:

```text
demonstrate-aws-service/
├── main          <- Documentation Hub & Demonstration Index (This branch)
├── s3            <- Pustaka: Digital Book Archive & S3 Static Website Hosting
├── ec2           <- TaskFlow: Background Compute Engine & Nginx UserData Bootstrap
└── efs           <- Shared-NFS: Cross-AZ Shared Storage & Multi-Node Cluster
```

---

## 📦 Service Catalog

| Branch | Service | Application / Topic | Key Concepts Demonstrated | Core Tech |
|---|---|---|---|---|
| [`s3`](https://github.com/bimbap/demonstrate-aws-service/tree/s3) | **Amazon S3** | **Pustaka — Digital Book Archive** | Static Website Hosting, Bucket Policies, Object CRUD, Client-Side Loan Tickets, CloudFront OAC. | HTML5, Vanilla CSS, JS (Zero Build) |
| [`ec2`](https://github.com/bimbap/demonstrate-aws-service/tree/ec2) | **Amazon EC2** | **TaskFlow — Compute Engine** | Ubuntu 22.04/24.04 LTS UserData Bootstrap, Nginx Web Server, CPU/RAM Workload Dynamics, Worker Concurrency. | Bash UserData, Nginx, Vanilla JS |
| [`efs`](https://github.com/bimbap/demonstrate-aws-service/tree/efs) | **Amazon EFS** | **Shared Storage & Multi-AZ Cluster** | Multi-AZ Mount Targets, NFSv4 / `amazon-efs-utils`, Persistent `/etc/fstab`, Access Points, Port 2049 SG. | NFSv4, Bash Bootstrap, Linux POSIX |

---

## 🚀 Quick Setup & Branch Navigation

### 1. Clone the Repository
```bash
git clone https://github.com/bimbap/demonstrate-aws-service.git
cd demonstrate-aws-service
```

### 2. Switch to a Specific Service Branch

#### To explore the **Amazon S3** demonstration:
```bash
git checkout s3
```
- Open `index.html` in your browser for local testing.
- Refer to `README.md` on the `s3` branch for AWS S3 bucket setup and CLI deployment commands.

#### To explore the **Amazon EC2** demonstration:
```bash
git checkout ec2
```
- Inspect `user-data.sh` for the Ubuntu server bootstrap script.
- Refer to `README.md` on the `ec2` branch for launch instance parameters, Security Group rules (Port 80), and verification.

---

## 🛠️ Pushing Service Sub-Folders to Their Dedicated Branches

If you are developing locally from the monorepo workspace and pushing each service folder to its own remote branch:

### Pushing S3 Material:
```bash
cd s3
git init
git remote add origin https://github.com/bimbap/demonstrate-aws-service.git
git checkout -B s3
git add .
git commit -m "feat(s3): add Pustaka digital book archive demonstration"
git push -u origin s3 --force
```

### Pushing EC2 Material:
```bash
cd ec2
git init
git remote add origin https://github.com/bimbap/demonstrate-aws-service.git
git checkout -B ec2
git add .
git commit -m "feat(ec2): add TaskFlow compute engine and Nginx user-data bootstrap"
git push -u origin ec2 --force
```

### Updating Main Documentation Branch:
```bash
# From demonstrates-material root:
git checkout -B main
git add README.md
git commit -m "docs: add central AWS demonstration catalog and branch guide"
git push -u origin main
```

---

## 📐 Design & Engineering Principles

1. **Zero AI Slop & Real Content**: Demonstrations use real-world books (*Atomic Habits*, *Sapiens*, *Bumi Manusia*) and realistic compute tasks rather than lorem ipsum or arbitrary stubs.
2. **Zero Dependencies**: Applications are built using clean, accessible Vanilla HTML5, CSS3, and JavaScript, ensuring instant load times and offline compatibility.
3. **Cloud Practitioner Friendly**: Ready to be deployed via AWS Console, AWS CLI, UserData, or IaC (Terraform / CloudFormation).
