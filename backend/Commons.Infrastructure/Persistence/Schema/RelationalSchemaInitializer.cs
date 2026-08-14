using Microsoft.EntityFrameworkCore;

namespace Commons.Infrastructure.Persistence.Schema;

public static class RelationalSchemaInitializer
{
    private const string CapabilitySchemaResourceName =
        "Commons.Infrastructure.Persistence.Schema.schema-v002-capabilities.sql";

    public static async Task InitializeAsync(
        CommonsDbContext dbContext,
        CancellationToken cancellationToken = default)
    {
        await using var stream = typeof(RelationalSchemaInitializer).Assembly
            .GetManifestResourceStream(CapabilitySchemaResourceName)
            ?? throw new InvalidOperationException(
                $"The embedded schema script '{CapabilitySchemaResourceName}' was not found.");
        using var reader = new StreamReader(stream);
        var sql = await reader.ReadToEndAsync(cancellationToken);

        await dbContext.Database.ExecuteSqlRawAsync(sql, cancellationToken);
    }
}
