using Commons.Cloud.Infrastructure.Configuration;
using Commons.Cloud.Infrastructure.Foundation;
using Pulumi;
using Pulumi.AzureNative.Network;
using Pulumi.AzureNative.PrivateDns;

namespace Commons.Cloud.Infrastructure.Networking;

internal sealed class NetworkResources
{
    private const string PostgreSqlPrivateDnsZoneName = "commons.postgres.database.azure.com";
    private const string KeyVaultPrivateDnsZoneName = "privatelink.vaultcore.azure.net";

    public NetworkResources(
        CloudSettings settings,
        FoundationResources foundation,
        InputMap<string> tags)
    {
        VirtualNetwork = new VirtualNetwork("virtual-network", new VirtualNetworkArgs
        {
            ResourceGroupName = foundation.ResourceGroup.Name,
            Location = foundation.ResourceGroup.Location,
            AddressSpace = new Pulumi.AzureNative.Network.Inputs.AddressSpaceArgs
            {
                AddressPrefixes = [settings.VirtualNetworkAddressSpace],
            },
            Tags = tags,
        });

        ContainerAppsSubnet = new Subnet("container-apps-subnet", new SubnetArgs
        {
            ResourceGroupName = foundation.ResourceGroup.Name,
            VirtualNetworkName = VirtualNetwork.Name,
            AddressPrefix = settings.ContainerAppsSubnetAddressPrefix,
            Delegations =
            [
                new Pulumi.AzureNative.Network.Inputs.DelegationArgs
                {
                    Name = "container-apps",
                    ServiceName = "Microsoft.App/environments",
                },
            ],
        });

        PostgreSqlSubnet = new Subnet("postgresql-subnet", new SubnetArgs
        {
            ResourceGroupName = foundation.ResourceGroup.Name,
            VirtualNetworkName = VirtualNetwork.Name,
            AddressPrefix = settings.PostgreSqlSubnetAddressPrefix,
            Delegations =
            [
                new Pulumi.AzureNative.Network.Inputs.DelegationArgs
                {
                    Name = "postgresql-flexible-server",
                    ServiceName = "Microsoft.DBforPostgreSQL/flexibleServers",
                },
            ],
        });

        PrivateEndpointsSubnet = new Subnet("private-endpoints-subnet", new SubnetArgs
        {
            ResourceGroupName = foundation.ResourceGroup.Name,
            VirtualNetworkName = VirtualNetwork.Name,
            AddressPrefix = settings.PrivateEndpointsSubnetAddressPrefix,
            PrivateEndpointNetworkPolicies = VirtualNetworkPrivateEndpointNetworkPolicies.Disabled,
        });

        PostgreSqlPrivateDnsZone = new PrivateZone("postgresql-private-dns-zone", new PrivateZoneArgs
        {
            ResourceGroupName = foundation.ResourceGroup.Name,
            PrivateZoneName = PostgreSqlPrivateDnsZoneName,
            Location = "global",
            Tags = tags,
        });

        PostgreSqlPrivateDnsLink = CreatePrivateDnsLink(
            "postgresql-private-dns-link",
            PostgreSqlPrivateDnsZone.Name);

        KeyVaultPrivateDnsZone = new PrivateZone("key-vault-private-dns-zone", new PrivateZoneArgs
        {
            ResourceGroupName = foundation.ResourceGroup.Name,
            PrivateZoneName = KeyVaultPrivateDnsZoneName,
            Location = "global",
            Tags = tags,
        });

        KeyVaultPrivateDnsLink = CreatePrivateDnsLink(
            "key-vault-private-dns-link",
            KeyVaultPrivateDnsZone.Name);

        KeyVaultPrivateEndpoint = new PrivateEndpoint("key-vault-private-endpoint", new PrivateEndpointArgs
        {
            ResourceGroupName = foundation.ResourceGroup.Name,
            Location = foundation.ResourceGroup.Location,
            Subnet = new Pulumi.AzureNative.Network.Inputs.SubnetArgs
            {
                Id = PrivateEndpointsSubnet.Id,
            },
            PrivateLinkServiceConnections =
            [
                new Pulumi.AzureNative.Network.Inputs.PrivateLinkServiceConnectionArgs
                {
                    Name = "key-vault",
                    PrivateLinkServiceId = foundation.KeyVault.Id,
                    GroupIds = ["vault"],
                },
            ],
            Tags = tags,
        });

        KeyVaultPrivateDnsZoneGroup = new PrivateDnsZoneGroup(
            "key-vault-private-dns-zone-group",
            new PrivateDnsZoneGroupArgs
            {
                ResourceGroupName = foundation.ResourceGroup.Name,
                PrivateEndpointName = KeyVaultPrivateEndpoint.Name,
                PrivateDnsZoneGroupName = "default",
                PrivateDnsZoneConfigs =
                [
                    new Pulumi.AzureNative.Network.Inputs.PrivateDnsZoneConfigArgs
                    {
                        Name = "key-vault",
                        PrivateDnsZoneId = KeyVaultPrivateDnsZone.Id,
                    },
                ],
            });

        VirtualNetworkLink CreatePrivateDnsLink(string name, Input<string> privateZoneName)
        {
            return new VirtualNetworkLink(name, new VirtualNetworkLinkArgs
            {
                ResourceGroupName = foundation.ResourceGroup.Name,
                PrivateZoneName = privateZoneName,
                Location = "global",
                RegistrationEnabled = false,
                VirtualNetwork = new Pulumi.AzureNative.PrivateDns.Inputs.SubResourceArgs
                {
                    Id = VirtualNetwork.Id,
                },
                Tags = tags,
            });
        }
    }

    public VirtualNetwork VirtualNetwork { get; }

    public Subnet ContainerAppsSubnet { get; }

    public Subnet PostgreSqlSubnet { get; }

    public Subnet PrivateEndpointsSubnet { get; }

    public PrivateZone PostgreSqlPrivateDnsZone { get; }

    public VirtualNetworkLink PostgreSqlPrivateDnsLink { get; }

    public PrivateZone KeyVaultPrivateDnsZone { get; }

    public VirtualNetworkLink KeyVaultPrivateDnsLink { get; }

    public PrivateEndpoint KeyVaultPrivateEndpoint { get; }

    public PrivateDnsZoneGroup KeyVaultPrivateDnsZoneGroup { get; }
}
