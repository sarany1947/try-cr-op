output "public_ip" {
  description = "RDP to this IP (port 3389)."
  value       = azurerm_public_ip.main.ip_address
}

output "resource_group_name" {
  value = local.resource_group_name
}

output "vm_name" {
  value = azurerm_windows_virtual_machine.main.name
}
