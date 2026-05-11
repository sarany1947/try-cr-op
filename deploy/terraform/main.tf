data "azurerm_resource_group" "existing" {
  count = var.use_existing_resource_group ? 1 : 0
  name  = var.resource_group_name
}

resource "azurerm_resource_group" "new" {
  count    = var.use_existing_resource_group ? 0 : 1
  name     = var.resource_group_name
  location = var.location
}

locals {
  resource_group_name = var.use_existing_resource_group ? data.azurerm_resource_group.existing[0].name : azurerm_resource_group.new[0].name
  location            = var.use_existing_resource_group ? data.azurerm_resource_group.existing[0].location : azurerm_resource_group.new[0].location
}

resource "azurerm_virtual_network" "main" {
  name                = "vnet-${var.vm_name}"
  address_space       = var.vnet_address_space
  location            = local.location
  resource_group_name = local.resource_group_name
  tags                = var.tags
}

resource "azurerm_subnet" "main" {
  name                 = "snet-${var.vm_name}"
  resource_group_name  = local.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.subnet_prefix]
}

resource "azurerm_network_security_group" "main" {
  name                = "nsg-${var.vm_name}"
  location            = local.location
  resource_group_name = local.resource_group_name
  tags                = var.tags

  security_rule {
    name                       = "RDP-from-admin-ip"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "3389"
    source_address_prefixes    = [var.admin_source_ip_cidr]
    destination_address_prefix = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "main" {
  subnet_id                 = azurerm_subnet.main.id
  network_security_group_id = azurerm_network_security_group.main.id
}

resource "azurerm_public_ip" "main" {
  name                = "pip-${var.vm_name}"
  location            = local.location
  resource_group_name = local.resource_group_name
  allocation_method   = "Static"
  sku                 = "Standard"
  tags                = var.tags
}

resource "azurerm_network_interface" "main" {
  name                = "nic-${var.vm_name}"
  location            = local.location
  resource_group_name = local.resource_group_name
  tags                = var.tags

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.main.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.main.id
  }
}

resource "azurerm_windows_virtual_machine" "main" {
  name                = var.vm_name
  location            = local.location
  resource_group_name = local.resource_group_name
  size                = var.vm_size
  admin_username      = var.admin_username
  admin_password      = var.admin_password
  tags                = var.tags

  network_interface_ids = [azurerm_network_interface.main.id]

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
    disk_size_gb         = var.os_disk_size_gb
  }

  source_image_reference {
    publisher = "MicrosoftWindowsServer"
    offer     = "WindowsServer"
    sku       = "2022-datacenter-azure-edition"
    version   = "latest"
  }
}
