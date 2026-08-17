using Commons.Infrastructure.Persistence.Schema;

namespace Commons.Infrastructure.Tests.Persistence;

public sealed class AccountingUnitRangeSchemaTests
{
    [Fact]
    public async Task Incremental_schema_constrains_offer_and_agreement_values()
    {
        const string resourceName =
            "Commons.Infrastructure.Persistence.Schema.schema-v007-accounting-unit-range.sql";
        await using var stream = typeof(RelationalSchemaInitializer).Assembly
            .GetManifestResourceStream(resourceName);

        stream.Should().NotBeNull();
        using var reader = new StreamReader(stream!);
        var sql = await reader.ReadToEndAsync();

        sql.Should().Contain("CK_Offers_CommonsAccountingUnits_Range");
        sql.Should().Contain("CK_Agreements_CommonsAccountingUnits_Range");
        sql.Should().Contain("\"CommonsAccountingUnits\" > 0");
        sql.Should().Contain("\"CommonsAccountingUnits\" <= 9007199254740991");
        sql.Should().Contain("DROP CONSTRAINT IF EXISTS");
        sql.Should().Contain("IF NOT EXISTS");
    }
}
