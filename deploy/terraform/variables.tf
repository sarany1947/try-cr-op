variable "use_existing_resource_group" {
  description = "If true, use an RG that already exists (e.g. carrer-ops)."
  type        = bool
  default     = true
}

variable "resource_group_name" {
  type    = string
  default = "carrer-ops"
}

variable "location" {
  description = "Used only when creating a new resource group."
  type        = string
  default     = "East US"
}

variable "vm_name" {
  type    = string
  default = "vm-career-ops"
}

variable "vm_size" {
  type    = string
  default = "Standard_D16s_v5"
}

variable "admin_username" {
  type = string
}

variable "admin_password" {
  type      = string
  sensitive = true
}

variable "admin_source_ip_cidr" {
  description = "Your public IPv4 for RDP, e.g. 203.0.113.10/32 (set via TF_VAR_ in GitHub Secrets)."
  type        = string
}

variable "os_disk_size_gb" {
  type    = number
  default = 128
}

variable "vnet_address_space" {
  type    = list(string)
  default = ["10.42.0.0/16"]
}

variable "subnet_prefix" {
  type    = string
  default = "10.42.1.0/24"
}

variable "tags" {
  type    = map(string)
  default = {}
}
