#!/usr/bin/env bash

set -euo pipefail

# ============================================================
# Configuration
# ============================================================

SUBSCRIPTION_ID="4b17dad0-4459-482e-ba65-3d71ef235774"

AZURE_STORAGE_ACCOUNT="commonspulumistate"
PULUMI_BACKEND_URL="azblob://pulumi-dev"
PULUMI_STACK="dev"

# ============================================================
# Azure authentication
# ============================================================

az account show >/dev/null 2>&1 || az login

az account set \
  --subscription "$SUBSCRIPTION_ID"

# ============================================================
# Pulumi backend authentication
# ============================================================

export AZURE_STORAGE_ACCOUNT="$AZURE_STORAGE_ACCOUNT"

pulumi login "$PULUMI_BACKEND_URL"

# ============================================================
# Stack
# ============================================================

if pulumi stack ls --json |
  jq -e --arg stack "$PULUMI_STACK" \
  '.[] | select(.name == $stack)' \
  >/dev/null
then
  pulumi stack select "$PULUMI_STACK"
else
  pulumi stack init "$PULUMI_STACK"
fi

# ============================================================
# Pulumi Azure configuration
# ============================================================

pulumi config set azure-native:subscriptionId "$SUBSCRIPTION_ID"

echo
echo "Pulumi configured."
echo
echo "Backend: $PULUMI_BACKEND_URL"
echo "Stack:   $(pulumi stack --show-name)"