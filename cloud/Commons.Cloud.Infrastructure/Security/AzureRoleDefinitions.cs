namespace Commons.Cloud.Infrastructure.Security;

internal static class AzureRoleDefinitions
{
    public const string Contributor = "b24988ac-6180-42a0-ab88-20f7382dd24c";
    public const string RoleBasedAccessControlAdministrator = "f58310d9-a9f6-439a-9e8d-f62e7b41a168";
    public const string AcrPull = "7f951dda-4ed3-4680-a7ca-43fe172d538d";
    public const string AcrPush = "8311e382-0749-4cb8-b61a-304f252e45ec";
    public const string KeyVaultSecretsUser = "4633458b-17de-408a-b874-0445c86b69e6";
}
