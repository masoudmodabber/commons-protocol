namespace Commons.Domain.Participants;

public sealed class Membership
{
    private Membership()
    {
    }

    internal Membership(Guid participantId, Guid homeCommonsId, DateTimeOffset joinedAt)
    {
        if (homeCommonsId == Guid.Empty)
        {
            throw new DomainRuleViolationException("A Participant requires a Home Commons.");
        }

        Id = Guid.NewGuid();
        ParticipantId = participantId;
        HomeCommonsId = homeCommonsId;
        JoinedAt = joinedAt;
    }

    public Guid Id { get; private set; }

    public Guid ParticipantId { get; private set; }

    public Guid HomeCommonsId { get; private set; }

    public DateTimeOffset JoinedAt { get; private set; }

    public bool IsActive => true;

    public Commons HomeCommons { get; private set; } = null!;
}
