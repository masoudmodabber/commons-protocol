using Commons.Cloud.Infrastructure.Configuration;
using Commons.Cloud.Infrastructure.Data;
using Commons.Cloud.Infrastructure.Foundation;
using Commons.Cloud.Infrastructure.Hosting;
using Commons.Cloud.Infrastructure.Networking;
using Commons.Cloud.Infrastructure.Security;
using Pulumi;
using Pulumi.AzureNative.Authorization;

namespace Commons.Cloud.Infrastructure;

internal sealed class CloudStack : Stack
{
    public CloudStack()
    {
        var settings = CloudSettings.Load();
        var clientConfig = Output.Create(GetClientConfig.InvokeAsync());
        InputMap<string> tags = new()
        {
            { "application", "commons-market" },
            { "environment", settings.Environment },
            { "managed-by", "pulumi" },
        };

        var foundation = new FoundationResources(settings, clientConfig, tags);
        var network = new NetworkResources(settings, foundation, tags);
        var data = new PostgreSqlResources(
            settings,
            foundation.ResourceGroup.Name,
            foundation.ResourceGroup.Location,
            network,
            tags);
        var roleAssignments = new RoleAssignments(
            clientConfig,
            foundation.ResourceGroup.Id,
            foundation.Registry.Id,
            foundation.KeyVault.Id,
            foundation.ApiIdentity,
            foundation.GitHubDeploymentIdentity);
        var secrets = new ApplicationSecrets(settings, foundation, data, tags);
        var hosting = new ApplicationHostingResources(
            settings,
            foundation,
            network,
            secrets,
            roleAssignments,
            tags);

        ResourceGroupName = foundation.ResourceGroup.Name;
        VirtualNetworkName = network.VirtualNetwork.Name;
        ContainerRegistryLoginServer = foundation.Registry.LoginServer;
        ApiUrl = hosting.Api.Configuration.Apply(configuration =>
            configuration?.Ingress?.Fqdn is { Length: > 0 } fqdn ? $"https://{fqdn}" : string.Empty);
        FrontendUrl = hosting.Frontend.DefaultHostname.Apply(hostname => $"https://{hostname}");
        StaticWebAppName = hosting.Frontend.Name;
        PostgreSqlHost = data.Server.FullyQualifiedDomainName;
        KeyVaultUri = foundation.KeyVault.Properties.Apply(properties => properties.VaultUri ?? string.Empty);
        ApplicationInsightsConnectionString = foundation.ApplicationInsights.ConnectionString;
        GitHubDeploymentClientId = foundation.GitHubDeploymentIdentity.ClientId;
        GitHubDeploymentPrincipalId = foundation.GitHubDeploymentIdentity.PrincipalId;
        TenantId = clientConfig.Apply(current => current.TenantId);
        SubscriptionId = clientConfig.Apply(current => current.SubscriptionId);
    }

    [Output("resourceGroupName")]
    public Output<string> ResourceGroupName { get; }

    [Output("virtualNetworkName")]
    public Output<string> VirtualNetworkName { get; }

    [Output("containerRegistryLoginServer")]
    public Output<string> ContainerRegistryLoginServer { get; }

    [Output("apiUrl")]
    public Output<string> ApiUrl { get; }

    [Output("frontendUrl")]
    public Output<string> FrontendUrl { get; }

    [Output("staticWebAppName")]
    public Output<string> StaticWebAppName { get; }

    [Output("postgresSqlHost")]
    public Output<string> PostgreSqlHost { get; }

    [Output("keyVaultUri")]
    public Output<string> KeyVaultUri { get; }

    [Output("applicationInsightsConnectionString")]
    public Output<string> ApplicationInsightsConnectionString { get; }

    [Output("githubDeploymentClientId")]
    public Output<string> GitHubDeploymentClientId { get; }

    [Output("githubDeploymentPrincipalId")]
    public Output<string> GitHubDeploymentPrincipalId { get; }

    [Output("tenantId")]
    public Output<string> TenantId { get; }

    [Output("subscriptionId")]
    public Output<string> SubscriptionId { get; }
}
