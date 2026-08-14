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
        IReadOnlyCollection<RequestedContributionTerms> contributionTerms)
    {
        if (commonsAccountingUnits is <= 0)
        {
            throw new DomainRuleViolationException(
                "Commons accounting units must be a positive whole number.");
        }

        if (contributionTerms is null)
        {
            throw new DomainRuleViolationException(
                "Requested contributions are required when Commons accounting units are not included.");
        }

        if (commonsAccountingUnits is null && contributionTerms.Count == 0)
        {
            throw new DomainRuleViolationException(
                "An Offer must request Commons accounting units or at least one contribution.");
        }

        if (contributionTerms
            .GroupBy(contribution => contribution.CapabilityId)
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

        foreach (var terms in contributionTerms)
        {
            requestedContributions.Add(new RequestedContribution(
                Id,
                terms.CapabilityId,
                terms.CapabilityTextSnapshot,
                terms.Description));
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
}

public sealed record RequestedContributionTerms(
    Guid CapabilityId,
    string CapabilityTextSnapshot,
    string Description);
