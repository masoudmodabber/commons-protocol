using Commons.Domain.Offers;
using Commons.Domain.Participants;
using Commons.Domain.Requests;

namespace Commons.Domain.Agreements;

public sealed class Agreement
{
    private readonly List<AgreementRequestedContribution> requestedContributions = [];

    private Agreement()
    {
    }

    private Agreement(Request request, Offer acceptedOffer)
    {
        Id = Guid.NewGuid();
        RequestId = request.Id;
        AcceptedOfferId = acceptedOffer.Id;
        RequestCreatorParticipantId = request.CreatorParticipantId;
        OfferCreatorParticipantId = acceptedOffer.CreatorParticipantId;
        CommonsAccountingUnits = acceptedOffer.CommonsAccountingUnits;

        foreach (var contribution in acceptedOffer.RequestedContributions)
        {
            requestedContributions.Add(new AgreementRequestedContribution(Id, contribution));
        }
    }

    public Guid Id { get; private set; }

    public Guid RequestId { get; private set; }

    public Guid AcceptedOfferId { get; private set; }

    public Guid RequestCreatorParticipantId { get; private set; }

    public Guid OfferCreatorParticipantId { get; private set; }

    public long? CommonsAccountingUnits { get; private set; }

    public IReadOnlyCollection<AgreementRequestedContribution> RequestedContributions =>
        requestedContributions.AsReadOnly();

    internal static Agreement FromAcceptedOffer(Request request, Offer acceptedOffer)
    {
        if (request.Status != RequestStatus.Matched || acceptedOffer.Status != OfferStatus.Accepted)
        {
            throw new DomainRuleViolationException(
                "An Agreement can be created only from a Matched Request and its Accepted Offer.");
        }

        if (acceptedOffer.RequestId != request.Id)
        {
            throw new DomainRuleViolationException("The Accepted Offer must belong to the Request.");
        }

        return new Agreement(request, acceptedOffer);
    }
}
