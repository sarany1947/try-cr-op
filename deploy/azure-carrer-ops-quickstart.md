# Azure quickstart — resource group `carrer-ops`

Your portal screenshot shows **Resource group:** `carrer-ops` · **Region:** East US · **Empty** (good).

## 1) Create a Windows VM (portal)

1. Open resource group **`carrer-ops`** → **Create** → search **Windows Server 2022 Datacenter** (or Windows 11 multi-session if your policy allows).
2. **Basics**
   - Subscription: yours  
   - RG: **`carrer-ops`**  
   - VM name: e.g. **`vm-career-ops`**  
   - Region: **East US** (match the RG)  
   - Image: Windows Server 2022 Datacenter – Gen2  
   - Size: **D16s_v5** or **D32s_v5** (general purpose; no GPU needed)  
   - Administrator account: strong username + password (store in a password manager).
3. **Disks:** Premium SSD or Standard SSD for OS (≥ 128 GB is comfortable).
4. **Networking:**  
   - Create new virtual network + subnet (defaults OK).  
   - **NIC NSG:** allow **RDP (3389)** from **My IP only** — not from the entire internet.
5. Review + **Create**.

## 2) Connect

- **RDP** from your Mac: Microsoft Remote Desktop app → PC name = VM **public IP** (or private IP if using Bastion).

## 3) On the VM (first boot)

PowerShell as Administrator:

```powershell
winget install Git.Git OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
```

Restart shell, then:

```powershell
cd $env:USERPROFILE
git clone https://github.com/sarany1947/try-cr-op.git career-ops
cd career-ops
npm install
npx playwright install chromium
```

Copy your **`cv.md`**, **`config/profile.yml`**, **`resume/`** (including files ignored by git — see repo `.gitignore`), and **`.env`** (`GEMINI_API_KEY`, `PASTE_API_TOKEN`, etc.).

## 4) Run the paste-URL → PDF service

```powershell
$env:GEMINI_API_KEY="your-key"
$env:PASTE_API_TOKEN="long-random-secret"
$env:BIND_HOST="127.0.0.1"
$env:PORT="8790"
npm run pasta
```

Bind **`127.0.0.1`** until you add **IIS/nginx + HTTPS + TLS cert** (or **Azure Application Gateway / Front Door**) in front. Do not expose **8790** publicly without TLS and auth.

See **`paste-pipeline/README.md`** and **`docs/AZURE_WINDOWS_VM.md`**.

## 5) Optional: Azure CLI one-liner region

If you prefer CLI later, target the same RG and region:

```bash
az group show -n carrer-ops -o table
```

(Resource group name matches what you created: **`carrer-ops`**.)
