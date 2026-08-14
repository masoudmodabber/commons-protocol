namespace Commons.Domain.Participants;

public sealed class Commons
{
    private Commons()
    {
    }

    public Commons(Guid id, string name)
    {
        if (id == Guid.Empty)
        {
            throw new DomainRuleViolationException("A Commons requires an identifier.");
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainRuleViolationException("A Commons requires a name.");
        }

        Id = id;
        Name = name.Trim();
    }

    public Guid Id { get; private set; }

    public string Name { get; private set; } = string.Empty;
}
