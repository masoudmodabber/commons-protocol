using Commons.Infrastructure.Persistence.Schema;
using Commons.Infrastructure.Persistence.Seeding;

namespace Commons.Infrastructure.Tests.Persistence;

public sealed class DevelopmentDataSeederTests
{
    [Fact]
    public async Task Development_commons_seed_is_embedded_and_idempotent()
    {
        const string resourceName =
            "Commons.Infrastructure.Persistence.Seeding.seed-dev.sql";
        await using var stream = typeof(DevelopmentDataSeeder).Assembly
            .GetManifestResourceStream(resourceName);

        stream.Should().NotBeNull();
        using var reader = new StreamReader(stream!);
        var sql = await reader.ReadToEndAsync();

        sql.Should().Contain("Brisbane Commons");
        sql.Should().Contain("Gold Coast Commons");
        sql.Should().Contain("Sunshine Coast Commons");
        sql.Should().Contain("ON CONFLICT (\"Id\") DO NOTHING;");
    }

    [Fact]
    public async Task Capability_schema_update_is_embedded_and_idempotent()
    {
        const string resourceName =
            "Commons.Infrastructure.Persistence.Schema.schema-v002-capabilities.sql";
        await using var stream = typeof(RelationalSchemaInitializer).Assembly
            .GetManifestResourceStream(resourceName);

        stream.Should().NotBeNull();
        using var reader = new StreamReader(stream!);
        var sql = await reader.ReadToEndAsync();

        sql.Should().Contain("CREATE TABLE IF NOT EXISTS \"Capabilities\"");
        sql.Should().Contain("CREATE UNIQUE INDEX IF NOT EXISTS");
        sql.Should().Contain("\"ParticipantId\", \"NormalizedText\"");
    }

    [Fact]
    public async Task Request_schema_update_is_embedded_and_idempotent()
    {
        const string resourceName =
            "Commons.Infrastructure.Persistence.Schema.schema-v003-requests.sql";
        await using var stream = typeof(RelationalSchemaInitializer).Assembly
            .GetManifestResourceStream(resourceName);

        stream.Should().NotBeNull();
        using var reader = new StreamReader(stream!);
        var sql = await reader.ReadToEndAsync();

        sql.Should().Contain("CREATE TABLE IF NOT EXISTS \"Requests\"");
        sql.Should().Contain("\"CreatorParticipantId\" uuid NOT NULL");
        sql.Should().Contain("\"HomeCommonsId\" uuid NOT NULL");
        sql.Should().Contain("\"Status\" text NOT NULL");
    }
}
