namespace Commons.Domain.Participants;

public sealed class Capability
{
    private Capability()
    {
    }

    internal Capability(Guid participantId, string text)
    {
        var trimmedText = text?.Trim();

        if (string.IsNullOrWhiteSpace(trimmedText))
        {
            throw new DomainRuleViolationException("A Capability requires a description.");
        }

        Id = Guid.NewGuid();
        ParticipantId = participantId;
        Text = trimmedText;
        NormalizedText = Normalize(trimmedText);
    }

    public Guid Id { get; private set; }

    public Guid ParticipantId { get; private set; }

    public string Text { get; private set; } = string.Empty;

    internal string NormalizedText { get; private set; } = string.Empty;

    internal static string Normalize(string text) => text.ToUpperInvariant();
}
