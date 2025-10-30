provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "rg" {
  name     = "healthcalc-rg"
  location = "East US"
}

resource "azurerm_container_registry" "acr" {
  name                = "healthcalcacr"
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "Basic"
}

resource "azurerm_kubernetes_cluster" "aks" {
  name                = "healthcalc-aks"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  dns_prefix          = "healthcalc"

  default_node_pool {
    name       = "default"
    node_count = 2
    vm_size    = "Standard_DS2_v2"
  }

  identity {
    type = "SystemAssigned"
  }
}
