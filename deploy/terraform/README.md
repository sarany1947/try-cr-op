# Azure VM (Terraform) — **CI only**

**Do not run `terraform` on your laptop.** Use **git** locally (`commit` / `push`), then **GitHub Actions** (`.github/workflows/terraform-azure.yml`).

## What runs where

| Where | What you do |
|--------|-------------|
| **Your machine** | Edit `.tf` files, `git push` |
| **GitHub Actions** | `terraform init`, `validate`, `plan`, and (when you choose) `apply` |

## One-time Azure setup (Portal or your org’s process)

1. **Remote state** — Storage account + blob container for Terraform state. The identity Terraform uses needs **Storage Blob Data Contributor** on that container (and rights to create resources in `carrer-ops` / target subscription).
2. **GitHub → Azure (OIDC)** — In Microsoft Entra, create an app registration, add a **federated credential** for `repo:YOUR_ORG/YOUR_REPO:ref:refs/heads/main` (and optionally `environment:production` if you use environments). Grant the app **Contributor** (or tighter custom roles) on the subscription/RG. See [Azure login with OIDC](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure).
3. **No local Terraform** — Do not run `terraform init` on your laptop; the workflow runs it. Your local steps are **edit** → **git push** → open **Actions** → **Terraform (Azure)** → **Run workflow** (plan or apply).

## GitHub configuration

### Repository **Variables** (Settings → Secrets and variables → Actions → Variables)

| Variable | Example |
|----------|---------|
| `TF_STATE_RG` | Resource group that holds the storage account |
| `TF_STATE_SA` | Storage account name (lowercase, no spaces) |
| `TF_STATE_CONTAINER` | Blob container name, e.g. `tfstate` |
| `TF_STATE_KEY` | Blob name, e.g. `career-ops/vm.tfstate` |

### Repository **Secrets**

| Secret | Purpose |
|--------|---------|
| `AZURE_CLIENT_ID` | Entra app (federated) or SP client id |
| `AZURE_TENANT_ID` | Tenant id |
| `AZURE_SUBSCRIPTION_ID` | Subscription id |
| `TF_VAR_admin_username` | Windows admin user |
| `TF_VAR_admin_password` | Strong Windows password |
| `TF_VAR_admin_source_ip_cidr` | Your public IP as `x.x.x.x/32` for RDP |

Optional: `AZURE_CLIENT_SECRET` only if you use password-based SP instead of OIDC (set `ARM_CLIENT_SECRET` in workflow — we document OIDC first).

## Triggers

- **Pull requests** that touch `deploy/terraform/**` → `fmt -check`, `validate`, `plan` (no apply).
- **Actions → Terraform (Azure)** → **Run workflow** → choose **plan** or **apply**.

`apply` updates real Azure resources — use only when the plan looks correct.

## After the VM exists

Follow **`../azure-carrer-ops-quickstart.md`**: RDP in, install Git/Node/Playwright, clone repo, `npm run pasta`.
