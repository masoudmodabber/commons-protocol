using Commons.Domain.Agreements;
using Commons.Domain.Offers;
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

    public void Cancel()
    {
        if (Status != RequestStatus.Open)
        {
            throw new RequestNotOpenException("Only an Open Request can be cancelled.");
        }

        Status = RequestStatus.Cancelled;
    }

    public Agreement AcceptOffer(
        Offer selectedOffer,
        IReadOnlyCollection<Offer> offersOnRequest)
    {
        if (Status != RequestStatus.Open)
        {
            throw new RequestNotOpenException("Only an Open Request can have an Offer accepted.");
        }

        if (selectedOffer is null)
        {
            throw new DomainRuleViolationException("An Offer must be selected for acceptance.");
        }

        if (offersOnRequest is null)
        {
            throw new DomainRuleViolationException("The Offers on the Request are required.");
        }

        if (selectedOffer.RequestId != Id || offersOnRequest.Any(offer => offer.RequestId != Id))
        {
            throw new DomainRuleViolationException("Every supplied Offer must belong to the Request.");
        }

        if (!offersOnRequest.Any(offer => offer.Id == selectedOffer.Id))
        {
            throw new DomainRuleViolationException("The selected Offer must be included with the Request Offers.");
        }

        selectedOffer.Accept();

        foreach (var offer in offersOnRequest.Where(offer => offer.Id != selectedOffer.Id))
        {
            offer.CloseBecauseAnotherOfferWasAccepted();
        }

        Status = RequestStatus.Matched;

        return Agreement.FromAcceptedOffer(this, selectedOffer);
    }
}
