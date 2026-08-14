namespace Commons.Domain.Participants;

public sealed class Participant
{
    private Participant()
    {
    }

    private Participant(
        Guid id,
        string authenticatedUserId,
        string displayName,
        string? bio,
        Guid homeCommonsId,
        DateTimeOffset joinedAt)
    {
        Id = id;
        AuthenticatedUserId = authenticatedUserId;
        Profile = new Profile(id, displayName, bio);
        Membership = new Membership(id, homeCommonsId, joinedAt);
    }

    public Guid Id { get; private set; }

    public string AuthenticatedUserId { get; private set; } = string.Empty;

    public Profile Profile { get; private set; } = null!;

    public Membership Membership { get; private set; } = null!;

    public static Participant Join(
        string authenticatedUserId,
        Guid homeCommonsId,
        string displayName,
        string? bio,
        DateTimeOffset joinedAt)
    {
        if (string.IsNullOrWhiteSpace(authenticatedUserId))
        {
            throw new DomainRuleViolationException("A Participant requires an authenticated user.");
        }

        return new Participant(
            Guid.NewGuid(),
            authenticatedUserId,
            displayName,
            bio,
            homeCommonsId,
            joinedAt);
    }
}
