using Commons.Domain.Participants;
using Commons.Domain.Requests;

namespace Commons.Domain.Tests.Requests;

public sealed class RequestTests
{
    [Fact]
    public void Participant_creates_open_request_in_their_home_commons()
    {
        var homeCommonsId = Guid.NewGuid();
        var participant = Participant.Join(
            "user-1",
            homeCommonsId,
            "Alice",
            null,
            DateTimeOffset.UtcNow);

        var request = participant.CreateRequest(
            "  Help repairing a fence  ",
            "  One garden fence panel needs replacing.  ");

        request.CreatorParticipantId.Should().Be(participant.Id);
        request.HomeCommonsId.Should().Be(homeCommonsId);
        request.Title.Should().Be("Help repairing a fence");
        request.Description.Should().Be("One garden fence panel needs replacing.");
        request.Status.Should().Be(RequestStatus.Open);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\t")]
    public void Request_rejects_empty_or_whitespace_only_title(string title)
    {
        var participant = CreateParticipant();

        var act = () => participant.CreateRequest(title, "A description");

        act.Should().Throw<DomainRuleViolationException>()
            .WithMessage("A Request requires a title.");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\t")]
    public void Request_rejects_empty_or_whitespace_only_description(string description)
    {
        var participant = CreateParticipant();

        var act = () => participant.CreateRequest("A title", description);

        act.Should().Throw<DomainRuleViolationException>()
            .WithMessage("A Request requires a description.");
    }

    private static Participant CreateParticipant() =>
        Participant.Join(
            "user-1",
            Guid.NewGuid(),
            "Alice",
            null,
            DateTimeOffset.UtcNow);
}
