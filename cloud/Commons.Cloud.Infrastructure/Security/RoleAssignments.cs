using Pulumi;
using Pulumi.AzureNative.Authorization;
using Pulumi.AzureNative.ManagedIdentity;

namespace Commons.Cloud.Infrastructure.Security;

internal sealed class RoleAssignments
{
    public RoleAssignments(
        Output<GetClientConfigResult> clientConfig,
        Input<string> resourceGroupScope,
        Input<string> registryScope,
        Input<string> keyVaultScope,
        UserAssignedIdentity apiIdentity,
        UserAssignedIdentity githubDeploymentIdentity)
    {
        ApiRegistryPull = Create(
            "api-registry-pull",
            registryScope,
            apiIdentity.PrincipalId,
            AzureRoleDefinitions.AcrPull);

        ApiKeyVaultSecretsUser = Create(
            "api-key-vault-secrets-user",
            keyVaultScope,
            apiIdentity.PrincipalId,
            AzureRoleDefinitions.KeyVaultSecretsUser);

        GitHubResourceGroupContributor = Create(
            "github-resource-group-contributor",
            resourceGroupScope,
            githubDeploymentIdentity.PrincipalId,
            AzureRoleDefinitions.Contributor);

        GitHubRbacAdministrator = Create(
            "github-rbac-administrator",
            resourceGroupScope,
            githubDeploymentIdentity.PrincipalId,
            AzureRoleDefinitions.RoleBasedAccessControlAdministrator);

        GitHubRegistryPush = Create(
            "github-registry-push",
            registryScope,
            githubDeploymentIdentity.PrincipalId,
            AzureRoleDefinitions.AcrPush);

        RoleAssignment Create(
            string name,
            Input<string> scope,
            Input<string> principalId,
            string roleDefinitionId)
        {
            return new RoleAssignment(name, new RoleAssignmentArgs
            {
                PrincipalId = principalId,
                PrincipalType = PrincipalType.ServicePrincipal,
                RoleDefinitionId = clientConfig.Apply(
                    current => $"/subscriptions/{current.SubscriptionId}/providers/Microsoft.Authorization/roleDefinitions/{roleDefinitionId}"),
                Scope = scope,
            });
        }
    }

    public RoleAssignment ApiRegistryPull { get; }

    public RoleAssignment ApiKeyVaultSecretsUser { get; }

    public RoleAssignment GitHubResourceGroupContributor { get; }

    public RoleAssignment GitHubRbacAdministrator { get; }

    public RoleAssignment GitHubRegistryPush { get; }
}
