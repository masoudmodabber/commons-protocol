using Commons.Domain.Agreements;
using Commons.Domain.Offers;
using Commons.Domain.Participants;
using Commons.Domain.Requests;
using Commons.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;

namespace Commons.Infrastructure.Tests.Persistence;

public sealed class AgreementPersistenceTests
{
    [Fact]
    public void Agreement_has_unique_request_and_accepted_offer_with_required_participants()
    {
        using var dbContext = CreateDbContext();
        var model = dbContext.GetService<IDesignTimeModel>().Model;
        var agreement = model.FindEntityType(typeof(Agreement));

        agreement.Should().NotBeNull();
        agreement!.GetIndexes().Should().Contain(index =>
            index.IsUnique
            && index.Properties.Select(property => property.Name)
                .SequenceEqual(new[] { nameof(Agreement.RequestId) }));
        agreement.GetIndexes().Should().Contain(index =>
            index.IsUnique
            && index.Properties.Select(property => property.Name)
                .SequenceEqual(new[] { nameof(Agreement.AcceptedOfferId) }));
        agreement.GetForeignKeys().Should().Contain(foreignKey =>
            foreignKey.IsRequired
            && foreignKey.DeleteBehavior == DeleteBehavior.Restrict
            && foreignKey.PrincipalEntityType.ClrType == typeof(Request));
        agreement.GetForeignKeys().Should().Contain(foreignKey =>
            foreignKey.IsRequired
            && foreignKey.DeleteBehavior == DeleteBehavior.Restrict
            && foreignKey.PrincipalEntityType.ClrType == typeof(Offer));
        agreement.GetForeignKeys().Count(foreignKey =>
            foreignKey.IsRequired
            && foreignKey.DeleteBehavior == DeleteBehavior.Restrict
            && foreignKey.PrincipalEntityType.ClrType == typeof(Participant))
            .Should().Be(2);
        agreement.GetCheckConstraints().Should().ContainSingle(constraint =>
            constraint.Name == "CK_Agreements_CommonsAccountingUnits_Positive");
    }

    [Fact]
    public void Agreement_contributions_are_owned_snapshots_without_live_capability_foreign_key()
    {
        using var dbContext = CreateDbContext();
        var contribution = dbContext.Model.FindEntityType(typeof(AgreementRequestedContribution));

        contribution.Should().NotBeNull();
        contribution!.GetForeignKeys().Should().ContainSingle(foreignKey =>
            foreignKey.IsRequired
            && foreignKey.DeleteBehavior == DeleteBehavior.Cascade
            && foreignKey.PrincipalEntityType.ClrType == typeof(Agreement));
        contribution.GetForeignKeys().Should().NotContain(foreignKey =>
            foreignKey.PrincipalEntityType.ClrType == typeof(Capability));
        contribution.GetIndexes().Should().ContainSingle(index =>
            index.IsUnique
            && index.Properties.Select(property => property.Name).SequenceEqual(
                new[]
                {
                    nameof(AgreementRequestedContribution.AgreementId),
                    nameof(AgreementRequestedContribution.CapabilityId)
                }));
    }

    [Fact]
    public void Accepted_offer_is_unique_per_request_as_concurrency_defence()
    {
        using var dbContext = CreateDbContext();
        var offer = dbContext.Model.FindEntityType(typeof(Offer));

        offer!.GetIndexes().Should().ContainSingle(index =>
            index.IsUnique
            && index.GetFilter() == "\"Status\" = 'Accepted'"
            && index.Properties.Select(property => property.Name)
                .SequenceEqual(new[] { nameof(Offer.RequestId) }));
    }

    private static CommonsDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<CommonsDbContext>()
            .UseNpgsql("Host=localhost;Database=model-tests;Username=test;Password=test")
            .Options;

        return new CommonsDbContext(options);
    }
}
