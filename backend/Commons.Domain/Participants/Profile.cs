namespace Commons.Domain.Participants;

public sealed class Profile
{
    private Profile()
    {
    }

    internal Profile(Guid participantId, string displayName, string? bio)
    {
        if (string.IsNullOrWhiteSpace(displayName))
        {
            throw new DomainRuleViolationException("A Participant requires a display name.");
        }

        Id = Guid.NewGuid();
        ParticipantId = participantId;
        DisplayName = displayName.Trim();
        Bio = string.IsNullOrWhiteSpace(bio) ? null : bio.Trim();
    }

    public Guid Id { get; private set; }

    public Guid ParticipantId { get; private set; }

    public string DisplayName { get; private set; } = string.Empty;

    public string? Bio { get; private set; }
}
