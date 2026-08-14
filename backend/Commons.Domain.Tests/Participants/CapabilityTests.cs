using Commons.Domain.Participants;

namespace Commons.Domain.Tests.Participants;

public sealed class CapabilityTests
{
    [Fact]
    public void Participant_can_add_multiple_capabilities()
    {
        var participant = CreateParticipant();

        var carpentry = participant.AddCapability("Carpentry");
        var gardening = participant.AddCapability("Gardening");

        participant.Capabilities.Should().Equal(carpentry, gardening);
    }

    [Fact]
    public void AddCapability_trims_surrounding_whitespace_and_preserves_entered_text()
    {
        var participant = CreateParticipant();

        var capability = participant.AddCapability("  Computer Hardware Repair  ");

        capability.Text.Should().Be("Computer Hardware Repair");
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("\t\r\n")]
    public void AddCapability_rejects_empty_or_whitespace_only_text(string text)
    {
        var participant = CreateParticipant();

        var act = () => participant.AddCapability(text);

        act.Should().Throw<DomainRuleViolationException>()
            .WithMessage("*requires a description*");
        participant.Capabilities.Should().BeEmpty();
    }

    [Fact]
    public void AddCapability_rejects_duplicates_that_differ_only_by_case_and_surrounding_whitespace()
    {
        var participant = CreateParticipant();
        participant.AddCapability("Carpentry");

        var act = () => participant.AddCapability("  cArPeNtRy  ");

        act.Should().Throw<CapabilityAlreadyExistsException>();
        participant.Capabilities.Should().ContainSingle()
            .Which.Text.Should().Be("Carpentry");
    }

    [Fact]
    public void RemoveCapability_removes_only_the_selected_capability()
    {
        var participant = CreateParticipant();
        var carpentry = participant.AddCapability("Carpentry");
        var gardening = participant.AddCapability("Gardening");

        var removed = participant.RemoveCapability(carpentry.Id);

        removed.Should().BeTrue();
        participant.Capabilities.Should().ContainSingle()
            .Which.Should().BeSameAs(gardening);
    }

    [Fact]
    public void RemoveCapability_returns_false_when_capability_does_not_belong_to_participant()
    {
        var participant = CreateParticipant();

        participant.RemoveCapability(Guid.NewGuid()).Should().BeFalse();
    }

    private static Participant CreateParticipant() =>
        Participant.Join("user-1", Guid.NewGuid(), "Alice", null, DateTimeOffset.UtcNow);
}
