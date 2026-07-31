using Commons.Cloud.Infrastructure.Configuration;
using Commons.Cloud.Infrastructure.Foundation;
using Commons.Cloud.Infrastructure.Networking;
using Commons.Cloud.Infrastructure.Security;
using Pulumi;
using Pulumi.AzureNative.App;
using Pulumi.AzureNative.Web;

namespace Commons.Cloud.Infrastructure.Hosting;

internal sealed class ApplicationHostingResources
{
    public ApplicationHostingResources(
        CloudSettings settings,
        FoundationResources foundation,
        NetworkResources network,
        ApplicationSecrets secrets,
        RoleAssignments roleAssignments,
        InputMap<string> tags)
    {
        ContainerAppEnvironment = new ManagedEnvironment("container-app-environment", new ManagedEnvironmentArgs
        {
            ResourceGroupName = foundation.ResourceGroup.Name,
            Location = foundation.ResourceGroup.Location,
            DaprAIConnectionString = foundation.ApplicationInsights.ConnectionString,
            VnetConfiguration = new Pulumi.AzureNative.App.Inputs.VnetConfigurationArgs
            {
                InfrastructureSubnetId = network.ContainerAppsSubnet.Id,
                Internal = false,
            },
            WorkloadProfiles =
            [
                new Pulumi.AzureNative.App.Inputs.WorkloadProfileArgs
                {
                    Name = "Consumption",
                    WorkloadProfileType = "Consumption",
                },
            ],
            Tags = tags,
        });

        Api = new ContainerApp("api", new ContainerAppArgs
        {
            ResourceGroupName = foundation.ResourceGroup.Name,
            Location = foundation.ResourceGroup.Location,
            EnvironmentId = ContainerAppEnvironment.Id,
            WorkloadProfileName = "Consumption",
            Identity = new Pulumi.AzureNative.App.Inputs.ManagedServiceIdentityArgs
            {
                Type = Pulumi.AzureNative.App.ManagedServiceIdentityType.UserAssigned,
                UserAssignedIdentities = [foundation.ApiIdentity.Id],
            },
            Configuration = new Pulumi.AzureNative.App.Inputs.ConfigurationArgs
            {
                ActiveRevisionsMode = ActiveRevisionsMode.Single,
                Ingress = new Pulumi.AzureNative.App.Inputs.IngressArgs
                {
                    External = true,
                    AllowInsecure = false,
                    TargetPort = 8080,
                    Transport = IngressTransportMethod.Auto,
                    Traffic =
                    [
                        new Pulumi.AzureNative.App.Inputs.TrafficWeightArgs
                        {
                            LatestRevision = true,
                            Weight = 100,
                        },
                    ],
                },
                Registries =
                [
                    new Pulumi.AzureNative.App.Inputs.RegistryCredentialsArgs
                    {
                        Server = foundation.Registry.LoginServer,
                        Identity = foundation.ApiIdentity.Id,
                    },
                ],
                Secrets =
                [
                    new Pulumi.AzureNative.App.Inputs.SecretArgs
                    {
                        Name = "postgres-connection-string",
                        Identity = foundation.ApiIdentity.Id,
                        KeyVaultUrl = secrets.PostgreSqlConnectionString.Properties.Apply(
                            properties => properties.SecretUri),
                    },
                ],
            },
            Template = new Pulumi.AzureNative.App.Inputs.TemplateArgs
            {
                Containers =
                [
                    new Pulumi.AzureNative.App.Inputs.ContainerArgs
                    {
                        Name = "api",
                        Image = settings.ApiImage,
                        Env =
                        [
                            new Pulumi.AzureNative.App.Inputs.EnvironmentVarArgs
                            {
                                Name = "ASPNETCORE_ENVIRONMENT",
                                Value = settings.Environment == "production" ? "Production" : "Development",
                            },
                            new Pulumi.AzureNative.App.Inputs.EnvironmentVarArgs
                            {
                                Name = "ConnectionStrings__Commons",
                                SecretRef = "postgres-connection-string",
                            },
                            new Pulumi.AzureNative.App.Inputs.EnvironmentVarArgs
                            {
                                Name = "APPLICATIONINSIGHTS_CONNECTION_STRING",
                                Value = foundation.ApplicationInsights.ConnectionString,
                            },
                        ],
                        Resources = new Pulumi.AzureNative.App.Inputs.ContainerResourcesArgs
                        {
                            Cpu = 0.25,
                            Memory = "0.5Gi",
                        },
                    },
                ],
                Scale = new Pulumi.AzureNative.App.Inputs.ScaleArgs
                {
                    MinReplicas = 0,
                    MaxReplicas = 1,
                },
            },
            Tags = tags,
        }, new CustomResourceOptions
        {
            DependsOn =
            [
                roleAssignments.ApiRegistryPull,
                roleAssignments.ApiKeyVaultSecretsUser,
                secrets.PostgreSqlConnectionString,
                network.KeyVaultPrivateDnsZoneGroup,
            ],
        });

        Frontend = new StaticSite("frontend", new StaticSiteArgs
        {
            ResourceGroupName = foundation.ResourceGroup.Name,
            Location = settings.StaticWebAppLocation,
            Sku = new Pulumi.AzureNative.Web.Inputs.SkuDescriptionArgs
            {
                Name = "Free",
                Tier = "Free",
            },
            StagingEnvironmentPolicy = StagingEnvironmentPolicy.Disabled,
            PublicNetworkAccess = "Enabled",
            Tags = tags,
        });
    }

    public ManagedEnvironment ContainerAppEnvironment { get; }

    public ContainerApp Api { get; }

    public StaticSite Frontend { get; }
}
