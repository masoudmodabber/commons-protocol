#!/usr/bin/env bash

set -euo pipefail

# ============================================================
# Configuration
# ============================================================

GITHUB_OWNER="YOUR_GITHUB_USERNAME"
GITHUB_REPO="commons-protocol"
GITHUB_ENVIRONMENT="development"

AZURE_CLIENT_ID="4573b01d-22e5-41e3-8a42-fb47086fd9f4"
AZURE_STORAGE_ACCOUNT="commonspulumistate"
AZURE_SUBSCRIPTION_ID="4b17dad0-4459-482e-ba65-3d71ef235774"
AZURE_TENANT_ID="05311dad-6eed-499d-9098-b028bd313358"

PULUMI_BACKEND_URL="azblob://pulumi-dev"
PULUMI_STACK="dev"

REPOSITORY="${GITHUB_OWNER}/${GITHUB_REPO}"

# ============================================================
# GitHub authentication
# ============================================================

gh auth status || gh auth login

# ============================================================
# Ensure environment exists
# ============================================================

gh api \
  --method PUT \
  "repos/${REPOSITORY}/environments/${GITHUB_ENVIRONMENT}" \
  >/dev/null

# ============================================================
# Environment variables
# ============================================================

gh variable set AZURE_CLIENT_ID \
  --env "$GITHUB_ENVIRONMENT" \
  --repo "$REPOSITORY" \
  --body "$AZURE_CLIENT_ID"

gh variable set AZURE_STORAGE_ACCOUNT \
  --env "$GITHUB_ENVIRONMENT" \
  --repo "$REPOSITORY" \
  --body "$AZURE_STORAGE_ACCOUNT"

gh variable set AZURE_SUBSCRIPTION_ID \
  --env "$GITHUB_ENVIRONMENT" \
  --repo "$REPOSITORY" \
  --body "$AZURE_SUBSCRIPTION_ID"

gh variable set AZURE_TENANT_ID \
  --env "$GITHUB_ENVIRONMENT" \
  --repo "$REPOSITORY" \
  --body "$AZURE_TENANT_ID"

gh variable set PULUMI_BACKEND_URL \
  --env "$GITHUB_ENVIRONMENT" \
  --repo "$REPOSITORY" \
  --body "$PULUMI_BACKEND_URL"

gh variable set PULUMI_STACK \
  --env "$GITHUB_ENVIRONMENT" \
  --repo "$REPOSITORY" \
  --body "$PULUMI_STACK"

# ============================================================
# Pulumi passphrase
# ============================================================

echo
read -rsp "Pulumi config passphrase: " PULUMI_CONFIG_PASSPHRASE
echo

printf '%s' "$PULUMI_CONFIG_PASSPHRASE" |
  gh secret set PULUMI_CONFIG_PASSPHRASE \
    --env "$GITHUB_ENVIRONMENT" \
    --repo "$REPOSITORY"

unset PULUMI_CONFIG_PASSPHRASE

echo
echo "GitHub environment configured."
echo
echo "Environment: $GITHUB_ENVIRONMENT"
echo "Repository:  $REPOSITORY"