using Commons.Domain.Participants;
using Commons.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using CommonsEntity = Commons.Domain.Participants.Commons;

namespace Commons.Infrastructure.Tests.Persistence;

public sealed class ParticipantPersistenceTests
{
    [Fact]
    public void Authenticated_user_id_has_a_unique_database_constraint()
    {
        using var dbContext = CreateDbContext();
        var participant = dbContext.Model.FindEntityType(typeof(Participant));

        participant.Should().NotBeNull();
        participant!.GetIndexes()
            .Should().ContainSingle(index =>
                index.IsUnique
                && index.Properties.Single().Name == nameof(Participant.AuthenticatedUserId));
    }

    [Fact]
    public void Profile_and_membership_are_required_one_to_one_parts_of_participant_persistence()
    {
        using var dbContext = CreateDbContext();
        var profile = dbContext.Model.FindEntityType(typeof(Profile));
        var membership = dbContext.Model.FindEntityType(typeof(Membership));

        profile.Should().NotBeNull();
        profile!.GetForeignKeys().Should().ContainSingle(foreignKey =>
            foreignKey.IsUnique
            && foreignKey.IsRequired
            && foreignKey.PrincipalEntityType.ClrType == typeof(Participant));

        membership.Should().NotBeNull();
        membership!.GetForeignKeys().Should().Contain(foreignKey =>
            foreignKey.IsUnique
            && foreignKey.IsRequired
            && foreignKey.PrincipalEntityType.ClrType == typeof(Participant));
        membership.GetForeignKeys().Should().Contain(foreignKey =>
            foreignKey.IsRequired
            && foreignKey.PrincipalEntityType.ClrType == typeof(CommonsEntity));
    }

    [Fact]
    public void Capability_has_participant_scoped_normalized_uniqueness_and_cascade_ownership()
    {
        using var dbContext = CreateDbContext();
        var capability = dbContext.Model.FindEntityType(typeof(Capability));

        capability.Should().NotBeNull();
        capability!.GetIndexes().Should().ContainSingle(index =>
            index.IsUnique
            && index.Properties.Select(property => property.Name)
                .SequenceEqual(new[] { nameof(Capability.ParticipantId), "NormalizedText" }));
        capability.GetForeignKeys().Should().ContainSingle(foreignKey =>
            foreignKey.IsRequired
            && foreignKey.DeleteBehavior == DeleteBehavior.Cascade
            && foreignKey.PrincipalEntityType.ClrType == typeof(Participant));
    }

    private static CommonsDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<CommonsDbContext>()
            .UseNpgsql("Host=localhost;Database=model-tests;Username=test;Password=test")
            .Options;

        return new CommonsDbContext(options);
    }
}
