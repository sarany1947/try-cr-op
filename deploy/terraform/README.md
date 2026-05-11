# Azure VM (Terraform)

---

### STOP — do not run Terraform on your laptop

**Forbidden on your Mac / PC:** `terraform init`, `terraform plan`, `terraform apply`, `terraform validate`, installing the Terraform CLI for this repo.

**Allowed locally:** edit `.tf` / `.json` files → **`git commit` → `git push`**.

**Where Terraform actually runs:** only **`Terraform (Azure)`** in **GitHub Actions** (`.github/workflows/terraform-azure.yml`). Open **Actions** in GitHub → run or merge PR — never run Terraform yourself.

---

## One GitHub secret

**Repo → Settings → Secrets and variables → Actions → New repository secret**

| Name | Value |
|------|--------|
| **`CAREER_OPS_AZURE`** | One JSON blob — copy **`azure-secret.example.json`**, fill real values, paste as the secret value |

Fields inside JSON:

- Azure **service principal** (`clientId`, `clientSecret`, `subscriptionId`, `tenantId`)
- **Remote state** (`state.resourceGroup`, `storageAccount`, `container`, `key`)
- **Windows VM** (`windowsVm.adminUsername`, `adminPassword`, `rdpSourceCidr` as `YOUR.IP.HERE/32`)

### Azure prep (Portal, one time)

1. Storage account + blob container for Terraform state — note names for JSON `state.*`.
2. App registration → client secret.
3. Grant that app **Contributor** (or tighter) on subscription / `carrer-ops`, plus **Storage Blob Data Contributor** on the state container.

### When Terraform runs (pipeline only)

| Trigger | What happens |
|---------|----------------|
| **PR** changing `deploy/terraform/**` | `fmt -check`, `init`, `validate`, **`plan`** |
| **Actions → Terraform (Azure) → Run workflow** | **`plan`** or **`apply`** (`apply` only on **`main`**) |

## After apply succeeds

Workflow log shows **`public_ip`**. RDP in, then **`../azure-carrer-ops-quickstart.md`** (Node, Playwright, **`npm run pasta`**).
