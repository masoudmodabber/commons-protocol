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

## Required configuration

Create a stack and configure it before running a preview:

```bash
pulumi stack init dev
pulumi config set location australiaeast
pulumi config set staticWebAppLocation "East Asia"
pulumi config set apiImage example.azurecr.io/commons-api:latest
pulumi config set githubOidcSubject repo:OWNER/REPOSITORY:ref:refs/heads/main
pulumi config set postgresAdministratorPassword --secret
```

Optional configuration:

```bash
pulumi config set environment dev
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

Only override the network ranges before the first deployment. The three subnet
ranges must be non-overlapping members of the VNet address space, and the
Container Apps subnet must remain at least `/27`.

The GitHub OIDC subject is deliberately explicit. It may target a branch, tag,
pull request, or protected GitHub environment. For example:

```text
repo:OWNER/REPOSITORY:environment:production
```

After the initial deployment, expose these stack outputs as GitHub Actions
variables:

* `AZURE_CLIENT_ID` from `githubDeploymentClientId`
* `AZURE_TENANT_ID` from `tenantId`
* `AZURE_SUBSCRIPTION_ID` from `subscriptionId`

The GitHub workflow must request `id-token: write` and authenticate with these
values. No Azure client secret is required.

The first deployment must be run by an existing Azure principal that can create
resource groups, managed identities, and role assignments. Subsequent
deployments can use the federated GitHub identity.

Because PostgreSQL and Key Vault data-plane access are private, administrative
database connections and direct secret reads must originate from the VNet or a
connected network. Pulumi manages the Key Vault secret through Azure Resource
Manager, so the GitHub deployment does not need direct data-plane access to the
vault.

`apiImage` must identify an image that exists when the Container App is
created. A first-time deployment may create the registry first, push the API
image, and then deploy the remaining resources.

No stack configuration is committed, and creating this project does not deploy
anything. Review a `pulumi preview` before the first deliberate `pulumi up`.
