using Commons.Cloud.Infrastructure.Configuration;
using Pulumi;
using Pulumi.AzureNative.ApplicationInsights;
using Pulumi.AzureNative.Authorization;
using Pulumi.AzureNative.ContainerRegistry;
using Pulumi.AzureNative.KeyVault;
using Pulumi.AzureNative.ManagedIdentity;
using Pulumi.AzureNative.Resources;

namespace Commons.Cloud.Infrastructure.Foundation;

internal sealed class FoundationResources
{
    public FoundationResources(
        CloudSettings settings,
        Output<GetClientConfigResult> clientConfig,
        InputMap<string> tags)
    {
        ResourceGroup = new ResourceGroup("resource-group", new ResourceGroupArgs
        {
            Location = settings.Location,
            Tags = tags,
        });

        Registry = new Registry("container-registry", new RegistryArgs
        {
            ResourceGroupName = ResourceGroup.Name,
            Location = ResourceGroup.Location,
            AdminUserEnabled = false,
            AnonymousPullEnabled = false,
            PublicNetworkAccess = "Enabled",
            Sku = new Pulumi.AzureNative.ContainerRegistry.Inputs.SkuArgs
            {
                Name = Pulumi.AzureNative.ContainerRegistry.SkuName.Basic,
            },
            Tags = tags,
        });

        ApiIdentity = new UserAssignedIdentity("api-identity", new UserAssignedIdentityArgs
        {
            ResourceGroupName = ResourceGroup.Name,
            Location = ResourceGroup.Location,
            Tags = tags,
        });

        GitHubDeploymentIdentity = new UserAssignedIdentity(
            "github-deployment-identity",
            new UserAssignedIdentityArgs
            {
                ResourceGroupName = ResourceGroup.Name,
                Location = ResourceGroup.Location,
                Tags = tags,
            });

        GitHubFederatedCredential = new FederatedIdentityCredential(
            "github-federated-credential",
            new FederatedIdentityCredentialArgs
            {
                ResourceGroupName = ResourceGroup.Name,
                ResourceName = GitHubDeploymentIdentity.Name,
                FederatedIdentityCredentialResourceName = "github",
                Issuer = "https://token.actions.githubusercontent.com",
                Audiences = ["api://AzureADTokenExchange"],
                Subject = settings.GitHubOidcSubject,
            });

        KeyVault = new Vault("key-vault", new VaultArgs
        {
            ResourceGroupName = ResourceGroup.Name,
            Location = ResourceGroup.Location,
            Properties = new Pulumi.AzureNative.KeyVault.Inputs.VaultPropertiesArgs
            {
                TenantId = clientConfig.Apply(current => current.TenantId),
                EnableRbacAuthorization = true,
                EnableSoftDelete = true,
                EnablePurgeProtection = true,
                SoftDeleteRetentionInDays = 90,
                PublicNetworkAccess = "Disabled",
                NetworkAcls = new Pulumi.AzureNative.KeyVault.Inputs.NetworkRuleSetArgs
                {
                    Bypass = Pulumi.AzureNative.KeyVault.NetworkRuleBypassOptions.None,
                    DefaultAction = NetworkRuleAction.Deny,
                },
                Sku = new Pulumi.AzureNative.KeyVault.Inputs.SkuArgs
                {
                    Family = SkuFamily.A,
                    Name = Pulumi.AzureNative.KeyVault.SkuName.Standard,
                },
            },
            Tags = tags,
        });

        ApplicationInsights = new Component("application-insights", new ComponentArgs
        {
            ResourceGroupName = ResourceGroup.Name,
            Location = ResourceGroup.Location,
            Kind = "web",
            ApplicationType = ApplicationType.Web,
            RequestSource = RequestSource.Rest,
            Tags = tags,
        });
    }

    public ResourceGroup ResourceGroup { get; }

    public Registry Registry { get; }

    public UserAssignedIdentity ApiIdentity { get; }

    public UserAssignedIdentity GitHubDeploymentIdentity { get; }

    public FederatedIdentityCredential GitHubFederatedCredential { get; }

    public Vault KeyVault { get; }

    public Component ApplicationInsights { get; }
}
