using Commons.Domain.Participants;

namespace Commons.Domain.Tests.Participants;

public sealed class ParticipantTests
{
    [Fact]
    public void Join_creates_profile_and_one_active_home_commons_membership_together()
    {
        var commonsId = Guid.NewGuid();
        var joinedAt = DateTimeOffset.UtcNow;

        var participant = Participant.Join("user-1", commonsId, " Alice ", " Gardener ", joinedAt);

        participant.Id.Should().NotBeEmpty();
        participant.Profile.ParticipantId.Should().Be(participant.Id);
        participant.Profile.DisplayName.Should().Be("Alice");
        participant.Profile.Bio.Should().Be("Gardener");
        participant.Membership.ParticipantId.Should().Be(participant.Id);
        participant.Membership.HomeCommonsId.Should().Be(commonsId);
        participant.Membership.JoinedAt.Should().Be(joinedAt);
        participant.Membership.IsActive.Should().BeTrue();
    }

    [Fact]
    public void Join_rejects_a_missing_authenticated_user()
    {
        var act = () => Participant.Join(" ", Guid.NewGuid(), "Alice", null, DateTimeOffset.UtcNow);

        act.Should().Throw<DomainRuleViolationException>()
            .WithMessage("*authenticated user*");
    }

    [Fact]
    public void Join_rejects_a_missing_home_commons()
    {
        var act = () => Participant.Join("user-1", Guid.Empty, "Alice", null, DateTimeOffset.UtcNow);

        act.Should().Throw<DomainRuleViolationException>()
            .WithMessage("*Home Commons*");
    }

    [Fact]
    public void Join_rejects_a_blank_display_name()
    {
        var act = () => Participant.Join("user-1", Guid.NewGuid(), " ", null, DateTimeOffset.UtcNow);

        act.Should().Throw<DomainRuleViolationException>()
            .WithMessage("*display name*");
    }

    [Fact]
    public void Join_treats_a_blank_bio_as_absent()
    {
        var participant = Participant.Join("user-1", Guid.NewGuid(), "Alice", " ", DateTimeOffset.UtcNow);

        participant.Profile.Bio.Should().BeNull();
    }
}
