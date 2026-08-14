using Commons.Domain.Participants;

namespace Commons.Domain.Requests;

public sealed class Request
{
    private Request()
    {
    }

    internal Request(Guid creatorParticipantId, Guid homeCommonsId, string title, string description)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new DomainRuleViolationException("A Request requires a title.");
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            throw new DomainRuleViolationException("A Request requires a description.");
        }

        Id = Guid.NewGuid();
        CreatorParticipantId = creatorParticipantId;
        HomeCommonsId = homeCommonsId;
        Title = title.Trim();
        Description = description.Trim();
        Status = RequestStatus.Open;
    }

    public Guid Id { get; private set; }

    public Guid CreatorParticipantId { get; private set; }

    public Guid HomeCommonsId { get; private set; }

    public string Title { get; private set; } = string.Empty;

    public string Description { get; private set; } = string.Empty;

    public RequestStatus Status { get; private set; }

    public void Edit(string title, string description)
    {
        if (Status != RequestStatus.Open)
        {
            throw new RequestNotOpenException("Only an Open Request can be edited.");
        }

        if (string.IsNullOrWhiteSpace(title))
        {
            throw new DomainRuleViolationException("A Request requires a title.");
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            throw new DomainRuleViolationException("A Request requires a description.");
        }

        Title = title.Trim();
        Description = description.Trim();
    }
}
