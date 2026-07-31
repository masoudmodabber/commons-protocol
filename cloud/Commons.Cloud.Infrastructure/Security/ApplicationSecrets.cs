using Commons.Cloud.Infrastructure.Configuration;
using Commons.Cloud.Infrastructure.Data;
using Commons.Cloud.Infrastructure.Foundation;
using Pulumi;
using Pulumi.AzureNative.KeyVault;

namespace Commons.Cloud.Infrastructure.Security;

internal sealed class ApplicationSecrets
{
    public ApplicationSecrets(
        CloudSettings settings,
        FoundationResources foundation,
        PostgreSqlResources data,
        InputMap<string> tags)
    {
        var connectionString = Output.Tuple(
            data.Server.FullyQualifiedDomainName,
            data.Database.Name,
            settings.PostgreSqlAdministratorPassword).Apply(values =>
                $"Host={values.Item1};Port=5432;Database={values.Item2};Username={settings.PostgreSqlAdministratorLogin};Password={values.Item3};SSL Mode=Require;Trust Server Certificate=false");

        PostgreSqlConnectionString = new Secret("postgresql-connection-string", new SecretArgs
        {
            ResourceGroupName = foundation.ResourceGroup.Name,
            VaultName = foundation.KeyVault.Name,
            SecretName = "postgresql-connection-string",
            Properties = new Pulumi.AzureNative.KeyVault.Inputs.SecretPropertiesArgs
            {
                ContentType = "application/x-postgresql-connection-string",
                Value = connectionString,
            },
            Tags = tags,
        });
    }

    public Secret PostgreSqlConnectionString { get; }
}
