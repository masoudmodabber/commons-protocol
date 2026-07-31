using Commons.Cloud.Infrastructure.Configuration;
using Commons.Cloud.Infrastructure.Networking;
using Pulumi;
using Pulumi.AzureNative.DBforPostgreSQL;

namespace Commons.Cloud.Infrastructure.Data;

internal sealed class PostgreSqlResources
{
    public PostgreSqlResources(
        CloudSettings settings,
        Input<string> resourceGroupName,
        Input<string> location,
        NetworkResources network,
        InputMap<string> tags)
    {
        Server = new Server("postgresql", new ServerArgs
        {
            ResourceGroupName = resourceGroupName,
            Location = location,
            CreateMode = CreateMode.Create,
            AdministratorLogin = settings.PostgreSqlAdministratorLogin,
            AdministratorLoginPassword = settings.PostgreSqlAdministratorPassword,
            Version = settings.PostgreSqlVersion,
            Sku = new Pulumi.AzureNative.DBforPostgreSQL.Inputs.SkuArgs
            {
                Name = settings.PostgreSqlSkuName,
                Tier = settings.PostgreSqlSkuTier,
            },
            Storage = new Pulumi.AzureNative.DBforPostgreSQL.Inputs.StorageArgs
            {
                AutoGrow = StorageAutoGrow.Enabled,
                StorageSizeGB = settings.PostgreSqlStorageSizeGb,
            },
            Backup = new Pulumi.AzureNative.DBforPostgreSQL.Inputs.BackupArgs
            {
                BackupRetentionDays = 7,
                GeoRedundantBackup = GeographicallyRedundantBackup.Disabled,
            },
            HighAvailability = new Pulumi.AzureNative.DBforPostgreSQL.Inputs.HighAvailabilityArgs
            {
                Mode = PostgreSqlFlexibleServerHighAvailabilityMode.Disabled,
            },
            Network = new Pulumi.AzureNative.DBforPostgreSQL.Inputs.NetworkArgs
            {
                DelegatedSubnetResourceId = network.PostgreSqlSubnet.Id,
                PrivateDnsZoneArmResourceId = network.PostgreSqlPrivateDnsZone.Id,
                PublicNetworkAccess = ServerPublicNetworkAccessState.Disabled,
            },
            Tags = tags,
        }, new CustomResourceOptions
        {
            DependsOn = [network.PostgreSqlPrivateDnsLink],
        });

        Database = new Database("postgresql-database", new DatabaseArgs
        {
            ResourceGroupName = resourceGroupName,
            ServerName = Server.Name,
            DatabaseName = "commons",
            Charset = "utf8",
            Collation = "en_US.utf8",
        });
    }

    public Server Server { get; }

    public Database Database { get; }
}
