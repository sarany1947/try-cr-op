# Deploy career-ops

| Layer | How |
|--------|-----|
| **Azure VM** | **`deploy/terraform/`** — Terraform runs **only in GitHub Actions** (`.github/workflows/terraform-azure.yml`). Locally: **git** only (`commit` / `push`). |
| **App (URL → PDF)** | **`paste-pipeline/README.md`** — `npm run pasta` **on the VM** after RDP/setup. |

| Doc | Use when |
|-----|----------|
| [terraform/README.md](./terraform/README.md) | CI-only Terraform: secrets, remote state, `workflow_dispatch` apply |
| [azure-carrer-ops-quickstart.md](./azure-carrer-ops-quickstart.md) | After VM exists: RDP, Node, Playwright, **`npm run pasta`** |
| [github-try-cr-op.md](./github-try-cr-op.md) | Push to **`sarany1947/try-cr-op`** |
