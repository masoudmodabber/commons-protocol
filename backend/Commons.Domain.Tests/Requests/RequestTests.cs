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

    [Fact]
    public void Open_request_can_be_edited_without_changing_identity_commons_or_status()
    {
        var participant = CreateParticipant();
        var request = participant.CreateRequest("Original title", "Original description");
        var requestId = request.Id;
        var creatorParticipantId = request.CreatorParticipantId;
        var homeCommonsId = request.HomeCommonsId;

        request.Edit("  Corrected title  ", "  Clarified description  ");

        request.Id.Should().Be(requestId);
        request.CreatorParticipantId.Should().Be(creatorParticipantId);
        request.HomeCommonsId.Should().Be(homeCommonsId);
        request.Status.Should().Be(RequestStatus.Open);
        request.Title.Should().Be("Corrected title");
        request.Description.Should().Be("Clarified description");
    }

    [Theory]
    [InlineData(" ", "A description", "A Request requires a title.")]
    [InlineData("A title", "\t", "A Request requires a description.")]
    public void Edit_rejects_empty_or_whitespace_only_fields(
        string title,
        string description,
        string expectedMessage)
    {
        var request = CreateParticipant().CreateRequest("Original title", "Original description");

        var act = () => request.Edit(title, description);

        act.Should().Throw<DomainRuleViolationException>().WithMessage(expectedMessage);
        request.Title.Should().Be("Original title");
        request.Description.Should().Be("Original description");
    }

    [Fact]
    public void Request_that_is_not_open_cannot_be_edited()
    {
        var request = CreateParticipant().CreateRequest("Original title", "Original description");
        typeof(Request).GetProperty(nameof(Request.Status))!
            .SetValue(request, RequestStatus.Cancelled);

        var act = () => request.Edit("Changed title", "Changed description");

        act.Should().Throw<RequestNotOpenException>()
            .WithMessage("Only an Open Request can be edited.");
        request.Title.Should().Be("Original title");
        request.Description.Should().Be("Original description");
        request.Status.Should().Be(RequestStatus.Cancelled);
    }

    private static Participant CreateParticipant() =>
        Participant.Join(
            "user-1",
            Guid.NewGuid(),
            "Alice",
            null,
            DateTimeOffset.UtcNow);
}
