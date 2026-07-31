using Pulumi;

namespace Commons.Cloud.Infrastructure.Configuration;

internal sealed record CloudSettings(
    string Environment,
    string Location,
    string StaticWebAppLocation,
    string ApiImage,
    string GitHubOidcSubject,
    string VirtualNetworkAddressSpace,
    string ContainerAppsSubnetAddressPrefix,
    string PostgreSqlSubnetAddressPrefix,
    string PrivateEndpointsSubnetAddressPrefix,
    string PostgreSqlAdministratorLogin,
    Output<string> PostgreSqlAdministratorPassword,
    string PostgreSqlVersion,
    string PostgreSqlSkuName,
    string PostgreSqlSkuTier,
    int PostgreSqlStorageSizeGb)
{
    public static CloudSettings Load()
    {
        var config = new Config();

        return new CloudSettings(
            config.Get("environment") ?? Deployment.Instance.StackName,
            config.Require("location"),
            config.Require("staticWebAppLocation"),
            config.Require("apiImage"),
            config.Require("githubOidcSubject"),
            config.Get("virtualNetworkAddressSpace") ?? "10.20.0.0/16",
            config.Get("containerAppsSubnetAddressPrefix") ?? "10.20.0.0/27",
            config.Get("postgresSubnetAddressPrefix") ?? "10.20.1.0/24",
            config.Get("privateEndpointsSubnetAddressPrefix") ?? "10.20.2.0/27",
            config.Get("postgresAdministratorLogin") ?? "commonsadmin",
            config.RequireSecret("postgresAdministratorPassword"),
            config.Get("postgresVersion") ?? "18",
            config.Get("postgresSkuName") ?? "Standard_B1ms",
            config.Get("postgresSkuTier") ?? "Burstable",
            config.GetInt32("postgresStorageSizeGb") ?? 32);
    }
}
