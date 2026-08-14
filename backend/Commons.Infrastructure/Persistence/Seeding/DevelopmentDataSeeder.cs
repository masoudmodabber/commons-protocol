using System.Reflection;
using Microsoft.EntityFrameworkCore;

namespace Commons.Infrastructure.Persistence.Seeding;

public static class DevelopmentDataSeeder
{
    private const string SeedResourceName =
        "Commons.Infrastructure.Persistence.Seeding.seed-dev.sql";

    public static async Task SeedAsync(
        CommonsDbContext dbContext,
        CancellationToken cancellationToken = default)
    {
        await using var stream = typeof(DevelopmentDataSeeder).Assembly
            .GetManifestResourceStream(SeedResourceName)
            ?? throw new InvalidOperationException(
                $"The embedded development seed '{SeedResourceName}' was not found.");
        using var reader = new StreamReader(stream);
        var sql = await reader.ReadToEndAsync(cancellationToken);

        await dbContext.Database.ExecuteSqlRawAsync(sql, cancellationToken);
    }
}
