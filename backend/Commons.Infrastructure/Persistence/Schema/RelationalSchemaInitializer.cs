using Microsoft.EntityFrameworkCore;

namespace Commons.Infrastructure.Persistence.Schema;

public static class RelationalSchemaInitializer
{
    private static readonly string[] SchemaResourceNames =
    [
        "Commons.Infrastructure.Persistence.Schema.schema-v002-capabilities.sql",
        "Commons.Infrastructure.Persistence.Schema.schema-v003-requests.sql"
    ];

    public static async Task InitializeAsync(
        CommonsDbContext dbContext,
        CancellationToken cancellationToken = default)
    {
        foreach (var resourceName in SchemaResourceNames)
        {
            await using var stream = typeof(RelationalSchemaInitializer).Assembly
                .GetManifestResourceStream(resourceName)
                ?? throw new InvalidOperationException(
                    $"The embedded schema script '{resourceName}' was not found.");
            using var reader = new StreamReader(stream);
            var sql = await reader.ReadToEndAsync(cancellationToken);

            await dbContext.Database.ExecuteSqlRawAsync(sql, cancellationToken);
        }
    }
}
