# Commons Cloud Infrastructure

This solution defines the Azure infrastructure for Commons Market with Pulumi
and the Azure Native provider.

It does not reference the application projects. Run Pulumi commands from this
directory.

The project is separated by responsibility:

* `Configuration` reads stack configuration.
* `Foundation` defines the resource group, registry, identities, Key Vault, and
  observability.
* `Networking` defines the VNet, delegated subnets, private DNS, and private
  endpoint resources.
* `Data` defines PostgreSQL and its application database.
* `Security` defines secrets and scoped role assignments.
* `Hosting` defines the Container App environment, API, and Static Web App.

The API uses its user-assigned managed identity to pull images from the
registry and read its versionless PostgreSQL connection-string reference from
Key Vault. The GitHub deployment identity uses workload identity federation;
no long-lived Azure credential is created.

The development API applies the idempotent `seed-dev.sql` embedded in the
backend after creating its database schema. This supplies the sample Commons
needed to exercise the participant join flow. The production environment does
not run development seed data.

## Network topology

The default address plan is:

* VNet: `10.20.0.0/16`
* Container Apps subnet: `10.20.0.0/27`, delegated exclusively to
  `Microsoft.App/environments`
* PostgreSQL subnet: `10.20.1.0/24`, delegated exclusively to
  `Microsoft.DBforPostgreSQL/flexibleServers`
* Private endpoints subnet: `10.20.2.0/27`

PostgreSQL has public network access disabled and resolves through its private
DNS zone. Key Vault has public network access disabled, uses a private endpoint,
and resolves through `privatelink.vaultcore.azure.net`. The API remains
externally reachable over HTTPS.

ACR remains publicly addressable so GitHub-hosted runners can publish images.
Its admin account and anonymous pulls are disabled; GitHub receives only the
`AcrPush` data-plane role and the API receives only `AcrPull`. Moving ACR
behind Private Link would require the Premium SKU and a self-hosted runner with
network access to the VNet.

## Azure Blob state backend

Pulumi state is stored in Azure Blob Storage rather than Pulumi Cloud. Create
this bootstrap infrastructure manually and keep it outside the dev and
production stacks:

* One dedicated resource group
* One StorageV2 storage account
* Private blob containers named `pulumi-dev` and `pulumi-prod`

Require HTTPS and TLS 1.2, disable anonymous blob access and shared-key
authorization, and enable blob versioning plus blob and container soft delete.
The storage endpoint must remain network-accessible to GitHub-hosted runners,
but blob data access is authorized only through Microsoft Entra RBAC.

Grant the human bootstrap principal `Storage Blob Data Contributor` on both
containers. Do not allow either application stack to manage or delete its own
state storage.

## Stack initialization and configuration

Use a separate backend container and passphrase for each stack. Keep both
passphrases in a password manager.

Initialize the development stack:

```bash
export PULUMI_CONFIG_PASSPHRASE="<strong-dev-passphrase>"
pulumi login "azblob://pulumi-dev?storage_account=<storage-account-name>"
pulumi stack init dev --secrets-provider passphrase
pulumi config set environment development
pulumi config set location australiaeast
pulumi config set staticWebAppLocation "East Asia"
pulumi config set apiImage "<temporary-bootstrap-image>"
pulumi config set githubOidcSubject \
  "repo:OWNER/REPOSITORY:environment:development"
pulumi config set postgresAdministratorPassword --secret
```

Initialize production after logging into its backend:

```bash
export PULUMI_CONFIG_PASSPHRASE="<strong-prod-passphrase>"
pulumi login "azblob://pulumi-prod?storage_account=<storage-account-name>"
pulumi stack init prod --secrets-provider passphrase
pulumi config set environment production
pulumi config set location australiaeast
pulumi config set staticWebAppLocation "East Asia"
pulumi config set apiImage "<temporary-bootstrap-image>"
pulumi config set githubOidcSubject \
  "repo:OWNER/REPOSITORY:environment:prod"
pulumi config set postgresAdministratorPassword --secret
```

Optional configuration:

```bash
pulumi config set postgresAdministratorLogin commonsadmin
pulumi config set postgresVersion 18
pulumi config set postgresSkuName Standard_B1ms
pulumi config set postgresSkuTier Burstable
pulumi config set postgresStorageSizeGb 32
pulumi config set virtualNetworkAddressSpace 10.20.0.0/16
pulumi config set containerAppsSubnetAddressPrefix 10.20.0.0/27
pulumi config set postgresSubnetAddressPrefix 10.20.1.0/24
pulumi config set privateEndpointsSubnetAddressPrefix 10.20.2.0/27
```

Only override the network ranges before the first deployment. The subnet ranges
must be non-overlapping members of the VNet address space, and the Container
Apps subnet must remain at least `/27`.

Commit the generated `Pulumi.dev.yaml` and `Pulumi.prod.yaml` stack settings
files. They contain required configuration and encrypted ciphertext, not the
passphrases. Never commit either passphrase.

## Initial deployment and state RBAC

The first deployment must be run by an existing Azure principal that can create
resource groups, managed identities, and role assignments. `apiImage` must
identify an existing image during this bootstrap deployment.

After bootstrapping each stack, retrieve:

```bash
pulumi stack output githubDeploymentClientId
pulumi stack output githubDeploymentPrincipalId
pulumi stack output tenantId
pulumi stack output subscriptionId
```

Grant each `githubDeploymentPrincipalId` the `Storage Blob Data Contributor`
role on only its corresponding state container. This assignment is deliberately
managed outside the application stacks because an environment must not control
access to or deletion of its own state.

Subsequent deployments authenticate to Azure with the federated GitHub
identity. Azure CLI authentication is also used by Pulumi to access the Blob
backend; no storage account key, SAS token, or Azure client secret is required.

Because PostgreSQL and Key Vault data-plane access are private, administrative
database connections and direct secret reads must originate from the VNet or a
connected network. Pulumi manages the Key Vault secret through Azure Resource
Manager, so the GitHub deployment does not need direct data-plane access to the
vault.

Creating this project does not deploy anything. Review a `pulumi preview`
before the first deliberate `pulumi up`.

## GitHub Actions

The `Deploy Development` workflow runs for each push to `main`. It validates
the backend and frontend, builds both canonical Dockerfiles, publishes an
immutable API image, updates the development Pulumi stack, deploys the Static
Web App, and verifies the API health endpoint.

Pulumi runs once before publishing the application image so a new stack can
create its registry and hosting resources from the configured bootstrap image.
After the API image is published, Pulumi runs again with the immutable image
URI and updates the Container App. Both operations are idempotent.

Create a GitHub environment named `development` and add these environment
variables:

* `AZURE_CLIENT_ID`
* `AZURE_TENANT_ID`
* `AZURE_SUBSCRIPTION_ID`
* `AZURE_STORAGE_ACCOUNT`
* `PULUMI_BACKEND_URL`
* `PULUMI_STACK`

Use these environment-specific values:

| Setting | `development` |
| --- | --- |
| `PULUMI_BACKEND_URL` | `azblob://pulumi-dev?storage_account=NAME` |
| `PULUMI_STACK` | `dev` |

Add `PULUMI_CONFIG_PASSPHRASE` as a secret in the environment, using the
development stack passphrase.

The Azure federated credential subject must use the GitHub environment name:

```text
repo:OWNER/REPOSITORY:environment:development
```

The first deployment remains a manual bootstrap because the workflow identity
and registry are created by the stack. After bootstrapping, assign
state-container RBAC and put the stack outputs into the GitHub environment
variables. Production deployment is intentionally not configured yet.
