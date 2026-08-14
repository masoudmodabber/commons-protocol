namespace Commons.Domain.Participants;

using global::Commons.Domain.Requests;
using global::Commons.Domain.Offers;

public sealed class Participant
{
    private readonly List<Capability> capabilities = [];

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

    public IReadOnlyCollection<Capability> Capabilities => capabilities.AsReadOnly();

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

    public Capability AddCapability(string text)
    {
        var capability = new Capability(Id, text);

        if (capabilities.Any(existing => existing.NormalizedText == capability.NormalizedText))
        {
            throw new CapabilityAlreadyExistsException(
                "This Capability is already listed on the Participant's profile.");
        }

        capabilities.Add(capability);
        return capability;
    }

    public bool RemoveCapability(Guid capabilityId)
    {
        var capability = capabilities.SingleOrDefault(existing => existing.Id == capabilityId);

        return capability is not null && capabilities.Remove(capability);
    }

    public Request CreateRequest(string title, string description) =>
        new(Id, Membership.HomeCommonsId, title, description);

    public Offer SubmitOffer(
        Request request,
        Participant requestCreator,
        long? commonsAccountingUnits,
        IReadOnlyCollection<RequestedContributionSelection> requestedContributions)
    {
        if (request.CreatorParticipantId == Id)
        {
            throw new DomainRuleViolationException(
                "A Participant cannot submit an Offer on their own Request.");
        }

        if (request.HomeCommonsId != Membership.HomeCommonsId)
        {
            throw new DomainRuleViolationException(
                "An Offer can only be submitted for a Request in the Participant's Home Commons.");
        }

        if (request.Status != RequestStatus.Open)
        {
            throw new DomainRuleViolationException(
                "An Offer can only be submitted for an Open Request.");
        }

        if (requestCreator.Id != request.CreatorParticipantId)
        {
            throw new DomainRuleViolationException(
                "Requested contributions must come from the Participant who created the Request.");
        }

        if (requestedContributions is null)
        {
            throw new DomainRuleViolationException(
                "Requested contributions are required when Commons accounting units are not included.");
        }

        var resolvedContributions = requestedContributions
            .Select(selection =>
            {
                var capability = requestCreator.capabilities
                    .SingleOrDefault(existing => existing.Id == selection.CapabilityId)
                    ?? throw new DomainRuleViolationException(
                        "A requested Capability must be currently listed by the Request creator.");

                return new ResolvedRequestedContribution(capability, selection.Description);
            })
            .ToList();

        return new Offer(Id, request.Id, commonsAccountingUnits, resolvedContributions);
    }
}
