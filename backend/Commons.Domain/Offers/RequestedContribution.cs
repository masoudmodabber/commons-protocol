using Commons.Domain.Participants;

namespace Commons.Domain.Offers;

public sealed class RequestedContribution
{
    private RequestedContribution()
    {
    }

    internal RequestedContribution(
        Guid offerId,
        Guid capabilityId,
        string capabilityTextSnapshot,
        string description)
    {
        if (string.IsNullOrWhiteSpace(capabilityTextSnapshot))
        {
            throw new DomainRuleViolationException(
                "A requested contribution requires a Capability text snapshot.");
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            throw new DomainRuleViolationException(
                "A requested contribution requires a description.");
        }

        Id = Guid.NewGuid();
        OfferId = offerId;
        CapabilityId = capabilityId;
        CapabilityTextSnapshot = capabilityTextSnapshot;
        Description = description.Trim();
    }

    public Guid Id { get; private set; }

    public Guid OfferId { get; private set; }

    public Guid CapabilityId { get; private set; }

    public string CapabilityTextSnapshot { get; private set; } = string.Empty;

    public string Description { get; private set; } = string.Empty;
}
