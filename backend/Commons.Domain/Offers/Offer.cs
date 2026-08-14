using Commons.Domain.Participants;

namespace Commons.Domain.Offers;

public sealed class Offer
{
    private readonly List<RequestedContribution> requestedContributions = [];

    private Offer()
    {
    }

    internal Offer(
        Guid creatorParticipantId,
        Guid requestId,
        long? commonsAccountingUnits,
        IReadOnlyCollection<ResolvedRequestedContribution> resolvedContributions)
    {
        if (commonsAccountingUnits is <= 0)
        {
            throw new DomainRuleViolationException(
                "Commons accounting units must be a positive whole number.");
        }

        if (resolvedContributions is null)
        {
            throw new DomainRuleViolationException(
                "Requested contributions are required when Commons accounting units are not included.");
        }

        if (commonsAccountingUnits is null && resolvedContributions.Count == 0)
        {
            throw new DomainRuleViolationException(
                "An Offer must request Commons accounting units or at least one contribution.");
        }

        if (resolvedContributions
            .GroupBy(contribution => contribution.Capability.Id)
            .Any(group => group.Count() > 1))
        {
            throw new DomainRuleViolationException(
                "The same Capability cannot appear more than once in an Offer.");
        }

        Id = Guid.NewGuid();
        CreatorParticipantId = creatorParticipantId;
        RequestId = requestId;
        CommonsAccountingUnits = commonsAccountingUnits;
        Status = OfferStatus.Active;

        foreach (var contribution in resolvedContributions)
        {
            requestedContributions.Add(new RequestedContribution(
                Id,
                contribution.Capability,
                contribution.Description));
        }
    }

    public Guid Id { get; private set; }

    public Guid RequestId { get; private set; }

    public Guid CreatorParticipantId { get; private set; }

    public long? CommonsAccountingUnits { get; private set; }

    public OfferStatus Status { get; private set; }

    public IReadOnlyCollection<RequestedContribution> RequestedContributions =>
        requestedContributions.AsReadOnly();

    public void Withdraw()
    {
        if (Status != OfferStatus.Active)
        {
            throw new OfferNotActiveException("Only an Active Offer can be withdrawn.");
        }

        Status = OfferStatus.Withdrawn;
    }

    internal void Accept()
    {
        if (Status != OfferStatus.Active)
        {
            throw new OfferNotActiveException("Only an Active Offer can be accepted.");
        }

        Status = OfferStatus.Accepted;
    }

    internal void CloseBecauseAnotherOfferWasAccepted()
    {
        if (Status == OfferStatus.Active)
        {
            Status = OfferStatus.Closed;
        }
    }
}

public sealed record RequestedContributionSelection(
    Guid CapabilityId,
    string Description);

internal sealed record ResolvedRequestedContribution(
    Capability Capability,
    string Description);
