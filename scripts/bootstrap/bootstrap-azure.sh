#!/usr/bin/env bash

set -euo pipefail

# ============================================================
# Configuration
# ============================================================

SUBSCRIPTION_ID="4b17dad0-4459-482e-ba65-3d71ef235774"

LOCATION="australiaeast"

STATE_RESOURCE_GROUP="commons-pulumi-state-rg"
STATE_STORAGE_ACCOUNT="commonspulumistate"
STATE_CONTAINER="pulumi-dev"

GITHUB_OWNER="YOUR_GITHUB_USERNAME"
GITHUB_REPO="commons-protocol"
GITHUB_ENVIRONMENT="development"

APP_NAME="commons-protocol-github-development"

# ============================================================
# Azure login
# ============================================================

az login

az account set \
  --subscription "$SUBSCRIPTION_ID"

TENANT_ID="$(az account show --query tenantId -o tsv)"

echo
echo "Subscription: $SUBSCRIPTION_ID"
echo "Tenant:       $TENANT_ID"
echo

# ============================================================
# Pulumi state resource group
# ============================================================

az group create \
  --name "$STATE_RESOURCE_GROUP" \
  --location "$LOCATION"

# ============================================================
# Pulumi state storage account
# ============================================================

if ! az storage account show \
  --name "$STATE_STORAGE_ACCOUNT" \
  --resource-group "$STATE_RESOURCE_GROUP" \
  >/dev/null 2>&1
then
  az storage account create \
    --name "$STATE_STORAGE_ACCOUNT" \
    --resource-group "$STATE_RESOURCE_GROUP" \
    --location "$LOCATION" \
    --sku Standard_LRS \
    --kind StorageV2
fi

# ============================================================
# Pulumi state container
# ============================================================

az storage container create \
  --name "$STATE_CONTAINER" \
  --account-name "$STATE_STORAGE_ACCOUNT" \
  --auth-mode login

# ============================================================
# Microsoft Entra application
# ============================================================

CLIENT_ID="$(
  az ad app list \
    --display-name "$APP_NAME" \
    --query '[0].appId' \
    -o tsv
)"

if [[ -z "$CLIENT_ID" ]]; then
  CLIENT_ID="$(
    az ad app create \
      --display-name "$APP_NAME" \
      --query appId \
      -o tsv
  )"
fi

echo
echo "Azure Client ID: $CLIENT_ID"

# ============================================================
# Service principal
# ============================================================

if ! az ad sp show --id "$CLIENT_ID" >/dev/null 2>&1
then
  az ad sp create --id "$CLIENT_ID"
fi

SERVICE_PRINCIPAL_OBJECT_ID="$(
  az ad sp show \
    --id "$CLIENT_ID" \
    --query id \
    -o tsv
)"

# ============================================================
# GitHub Actions OIDC federation
# ============================================================

APP_OBJECT_ID="$(
  az ad app show \
    --id "$CLIENT_ID" \
    --query id \
    -o tsv
)"

FEDERATED_NAME="github-${GITHUB_ENVIRONMENT}"

EXISTING_FEDERATION="$(
  az ad app federated-credential list \
    --id "$APP_OBJECT_ID" \
    --query "[?name=='$FEDERATED_NAME'].name | [0]" \
    -o tsv
)"

if [[ -z "$EXISTING_FEDERATION" ]]; then
  FEDERATED_FILE="$(mktemp)"

  cat > "$FEDERATED_FILE" <<EOF
{
  "name": "$FEDERATED_NAME",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:${GITHUB_OWNER}/${GITHUB_REPO}:environment:${GITHUB_ENVIRONMENT}",
  "description": "GitHub Actions ${GITHUB_ENVIRONMENT} deployment",
  "audiences": [
    "api://AzureADTokenExchange"
  ]
}
EOF

  az ad app federated-credential create \
    --id "$APP_OBJECT_ID" \
    --parameters "$FEDERATED_FILE"

  rm "$FEDERATED_FILE"
fi

# ============================================================
# Azure deployment permission
# ============================================================

DEPLOYMENT_SCOPE="/subscriptions/$SUBSCRIPTION_ID"

az role assignment create \
  --assignee-object-id "$SERVICE_PRINCIPAL_OBJECT_ID" \
  --assignee-principal-type ServicePrincipal \
  --role Contributor \
  --scope "$DEPLOYMENT_SCOPE" \
  >/dev/null 2>&1 || true

# ============================================================
# Pulumi Blob state permission
# ============================================================

STORAGE_ACCOUNT_ID="$(
  az storage account show \
    --name "$STATE_STORAGE_ACCOUNT" \
    --resource-group "$STATE_RESOURCE_GROUP" \
    --query id \
    -o tsv
)"

az role assignment create \
  --assignee-object-id "$SERVICE_PRINCIPAL_OBJECT_ID" \
  --assignee-principal-type ServicePrincipal \
  --role "Storage Blob Data Contributor" \
  --scope "$STORAGE_ACCOUNT_ID" \
  >/dev/null 2>&1 || true

# ============================================================
# Output for GitHub bootstrap
# ============================================================

echo
echo "Azure bootstrap complete."
echo
echo "Use these values for GitHub:"
echo
echo "AZURE_CLIENT_ID=$CLIENT_ID"
echo "AZURE_SUBSCRIPTION_ID=$SUBSCRIPTION_ID"
echo "AZURE_TENANT_ID=$TENANT_ID"
echo "AZURE_STORAGE_ACCOUNT=$STATE_STORAGE_ACCOUNT"
echo "PULUMI_BACKEND_URL=azblob://$STATE_CONTAINER"
echo "PULUMI_STACK=dev"