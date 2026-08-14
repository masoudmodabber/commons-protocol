using Commons.Domain.Offers;
using Commons.Domain.Participants;
using Commons.Domain.Requests;
using Commons.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;

namespace Commons.Infrastructure.Tests.Persistence;

public sealed class OfferPersistenceTests
{
    [Fact]
    public void Offer_requires_request_and_creator_and_stores_optional_whole_units()
    {
        using var dbContext = CreateDbContext();
        var model = dbContext.GetService<IDesignTimeModel>().Model;
        var offer = model.FindEntityType(typeof(Offer));

        offer.Should().NotBeNull();
        offer!.GetForeignKeys().Should().Contain(foreignKey =>
            foreignKey.IsRequired
            && foreignKey.DeleteBehavior == DeleteBehavior.Restrict
            && foreignKey.PrincipalEntityType.ClrType == typeof(Request));
        offer.GetForeignKeys().Should().Contain(foreignKey =>
            foreignKey.IsRequired
            && foreignKey.DeleteBehavior == DeleteBehavior.Restrict
            && foreignKey.PrincipalEntityType.ClrType == typeof(Participant));
        offer.FindProperty(nameof(Offer.CommonsAccountingUnits))!.ClrType
            .Should().Be(typeof(long?));
        offer.FindProperty(nameof(Offer.CommonsAccountingUnits))!.IsNullable.Should().BeTrue();
        offer.GetCheckConstraints().Should().ContainSingle(constraint =>
            constraint.Name == "CK_Offers_CommonsAccountingUnits_Positive");
    }

    [Fact]
    public void Requested_contribution_is_offer_owned_unique_by_capability_and_snapshot_independent()
    {
        using var dbContext = CreateDbContext();
        var contribution = dbContext.Model.FindEntityType(typeof(RequestedContribution));

        contribution.Should().NotBeNull();
        contribution!.GetForeignKeys().Should().ContainSingle(foreignKey =>
            foreignKey.IsRequired
            && foreignKey.DeleteBehavior == DeleteBehavior.Cascade
            && foreignKey.PrincipalEntityType.ClrType == typeof(Offer));
        contribution.GetForeignKeys().Should().NotContain(foreignKey =>
            foreignKey.PrincipalEntityType.ClrType == typeof(Capability));
        contribution.GetIndexes().Should().ContainSingle(index =>
            index.IsUnique
            && index.Properties.Select(property => property.Name).SequenceEqual(
                new[]
                {
                    nameof(RequestedContribution.OfferId),
                    nameof(RequestedContribution.CapabilityId)
                }));
        contribution.FindProperty(nameof(RequestedContribution.CapabilityTextSnapshot))!
            .IsNullable.Should().BeFalse();
        contribution.FindProperty(nameof(RequestedContribution.Description))!
            .IsNullable.Should().BeFalse();
    }

    private static CommonsDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<CommonsDbContext>()
            .UseNpgsql("Host=localhost;Database=model-tests;Username=test;Password=test")
            .Options;

        return new CommonsDbContext(options);
    }
}
