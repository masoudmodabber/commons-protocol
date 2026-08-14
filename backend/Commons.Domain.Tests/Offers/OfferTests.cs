using Commons.Domain.Offers;
using Commons.Domain.Participants;

namespace Commons.Domain.Tests.Offers;

public sealed class OfferTests
{
    [Fact]
    public void Participant_can_submit_offer_requesting_positive_whole_units_only()
    {
        var (creator, request, requestCreator) = CreateAvailableRequest();

        var offer = creator.SubmitOffer(request, requestCreator, 30, []);

        offer.RequestId.Should().Be(request.Id);
        offer.CreatorParticipantId.Should().Be(creator.Id);
        offer.CommonsAccountingUnits.Should().Be(30);
        offer.Status.Should().Be(OfferStatus.Active);
        offer.RequestedContributions.Should().BeEmpty();
    }

    [Fact]
    public void Creator_can_withdraw_active_offer_without_changing_stored_terms()
    {
        var (creator, request, requester) = CreateAvailableRequestWithRequester();
        var capability = requester.AddCapability("Fresh Eggs");
        var offer = creator.SubmitOffer(
            request,
            requester,
            12,
            [new RequestedContributionSelection(
                capability.Id,
                "Two dozen eggs")]);

        offer.Withdraw();

        offer.Status.Should().Be(OfferStatus.Withdrawn);
        offer.RequestId.Should().Be(request.Id);
        offer.CreatorParticipantId.Should().Be(creator.Id);
        offer.CommonsAccountingUnits.Should().Be(12);
        offer.RequestedContributions.Should().ContainSingle().Which.Should().BeEquivalentTo(
            new
            {
                CapabilityId = capability.Id,
                CapabilityTextSnapshot = "Fresh Eggs",
                Description = "Two dozen eggs"
            },
            options => options.ExcludingMissingMembers());
    }

    [Fact]
    public void Withdrawn_offer_cannot_be_withdrawn_again_or_return_to_active()
    {
        var (creator, request, requestCreator) = CreateAvailableRequest();
        var offer = creator.SubmitOffer(request, requestCreator, 10, []);
        offer.Withdraw();

        var act = offer.Withdraw;

        act.Should().Throw<OfferNotActiveException>()
            .WithMessage("Only an Active Offer can be withdrawn.");
        offer.Status.Should().Be(OfferStatus.Withdrawn);
    }

    [Fact]
    public void Offer_can_combine_multiple_distinct_capabilities_with_units()
    {
        var (creator, request, requester) = CreateAvailableRequestWithRequester();
        var eggs = requester.AddCapability("Eggs");
        var transport = requester.AddCapability("Transport");

        var offer = creator.SubmitOffer(
            request,
            requester,
            15,
            [
                new RequestedContributionSelection(eggs.Id, "  20 eggs  "),
                new RequestedContributionSelection(
                    transport.Id,
                    "  Airport transport on Saturday  ")
            ]);

        offer.CommonsAccountingUnits.Should().Be(15);
        offer.RequestedContributions.Should().BeEquivalentTo(
            [
                new
                {
                    CapabilityId = eggs.Id,
                    CapabilityTextSnapshot = "Eggs",
                    Description = "20 eggs"
                },
                new
                {
                    CapabilityId = transport.Id,
                    CapabilityTextSnapshot = "Transport",
                    Description = "Airport transport on Saturday"
                }
            ],
            options => options.ExcludingMissingMembers());
    }

    [Fact]
    public void Offer_can_request_one_capability_without_units()
    {
        var (creator, request, requester) = CreateAvailableRequestWithRequester();
        var capability = requester.AddCapability("Gardening");

        var offer = creator.SubmitOffer(
            request,
            requester,
            null,
            [new RequestedContributionSelection(
                capability.Id,
                "Two hours clearing weeds")]);

        offer.CommonsAccountingUnits.Should().BeNull();
        offer.RequestedContributions.Should().ContainSingle();
    }

    [Fact]
    public void Offer_snapshots_the_trusted_request_creator_capability_text()
    {
        var (creator, request, requester) = CreateAvailableRequestWithRequester();
        var capability = requester.AddCapability("  Fresh Eggs  ");

        var offer = creator.SubmitOffer(
            request,
            requester,
            null,
            [new RequestedContributionSelection(capability.Id, "Two dozen eggs")]);

        offer.CreatorParticipantId.Should().Be(creator.Id);
        offer.CreatorParticipantId.Should().NotBe(requester.Id);
        offer.RequestedContributions.Should().ContainSingle().Which.Should().BeEquivalentTo(
            new
            {
                CapabilityId = capability.Id,
                CapabilityTextSnapshot = "Fresh Eggs",
                Description = "Two dozen eggs"
            },
            options => options.ExcludingMissingMembers());
    }

    [Fact]
    public void Offer_rejects_capability_belonging_to_another_participant()
    {
        var (creator, request, requester) = CreateAvailableRequestWithRequester();
        var otherParticipant = CreateParticipant("user-3", requester.Membership.HomeCommonsId);
        var otherCapability = otherParticipant.AddCapability("Transport");

        var act = () => creator.SubmitOffer(
            request,
            requester,
            null,
            [new RequestedContributionSelection(otherCapability.Id, "Airport trip")]);

        act.Should().Throw<DomainRuleViolationException>()
            .WithMessage("A requested Capability must be currently listed by the Request creator.");
    }

    [Fact]
    public void Offer_rejects_capability_that_is_no_longer_current()
    {
        var (creator, request, requester) = CreateAvailableRequestWithRequester();
        var removedCapability = requester.AddCapability("Fresh Eggs");
        requester.RemoveCapability(removedCapability.Id).Should().BeTrue();

        var act = () => creator.SubmitOffer(
            request,
            requester,
            null,
            [new RequestedContributionSelection(removedCapability.Id, "Two dozen eggs")]);

        act.Should().Throw<DomainRuleViolationException>()
            .WithMessage("A requested Capability must be currently listed by the Request creator.");
    }

    [Fact]
    public void Offer_rejects_missing_capability()
    {
        var (creator, request, requester) = CreateAvailableRequestWithRequester();

        var act = () => creator.SubmitOffer(
            request,
            requester,
            null,
            [new RequestedContributionSelection(Guid.NewGuid(), "Requested terms")]);

        act.Should().Throw<DomainRuleViolationException>()
            .WithMessage("A requested Capability must be currently listed by the Request creator.");
    }

    [Fact]
    public void Offer_rejects_participant_who_did_not_create_the_request_as_request_creator()
    {
        var (creator, request, requester) = CreateAvailableRequestWithRequester();
        var otherParticipant = CreateParticipant("user-3", requester.Membership.HomeCommonsId);

        var act = () => creator.SubmitOffer(request, otherParticipant, 10, []);

        act.Should().Throw<DomainRuleViolationException>()
            .WithMessage(
                "Requested contributions must come from the Participant who created the Request.");
    }

    [Fact]
    public void Contribution_selection_cannot_supply_a_capability_snapshot()
    {
        typeof(RequestedContributionSelection)
            .GetProperties()
            .Select(property => property.Name)
            .Should().Equal(
                nameof(RequestedContributionSelection.CapabilityId),
                nameof(RequestedContributionSelection.Description));
        typeof(Offer).Assembly.GetExportedTypes()
            .Should().NotContain(type => type.Name == "RequestedContributionTerms");
    }

    [Fact]
    public void Offer_rejects_no_requested_return()
    {
        var (creator, request, requestCreator) = CreateAvailableRequest();

        var act = () => creator.SubmitOffer(request, requestCreator, null, []);

        act.Should().Throw<DomainRuleViolationException>()
            .WithMessage("An Offer must request Commons accounting units or at least one contribution.");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Offer_rejects_non_positive_units(long units)
    {
        var (creator, request, requestCreator) = CreateAvailableRequest();

        var act = () => creator.SubmitOffer(request, requestCreator, units, []);

        act.Should().Throw<DomainRuleViolationException>()
            .WithMessage("Commons accounting units must be a positive whole number.");
    }

    [Fact]
    public void Offer_rejects_duplicate_capability()
    {
        var (creator, request, requester) = CreateAvailableRequestWithRequester();
        var capability = requester.AddCapability("Eggs");
        var selection = new RequestedContributionSelection(capability.Id, "20 eggs");

        var act = () => creator.SubmitOffer(
            request,
            requester,
            null,
            [selection, selection]);

        act.Should().Throw<DomainRuleViolationException>()
            .WithMessage("The same Capability cannot appear more than once in an Offer.");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Offer_rejects_empty_contribution_description(string description)
    {
        var (creator, request, requester) = CreateAvailableRequestWithRequester();
        var capability = requester.AddCapability("Eggs");

        var act = () => creator.SubmitOffer(
            request,
            requester,
            null,
            [new RequestedContributionSelection(capability.Id, description)]);

        act.Should().Throw<DomainRuleViolationException>()
            .WithMessage("A requested contribution requires a description.");
    }

    [Fact]
    public void Participant_cannot_submit_offer_on_own_request()
    {
        var participant = CreateParticipant("user-1", Guid.NewGuid());
        var request = participant.CreateRequest("A need", "A description");

        var act = () => participant.SubmitOffer(request, participant, 10, []);

        act.Should().Throw<DomainRuleViolationException>()
            .WithMessage("A Participant cannot submit an Offer on their own Request.");
    }

    [Fact]
    public void Participant_cannot_submit_offer_in_another_home_commons()
    {
        var creator = CreateParticipant("user-1", Guid.NewGuid());
        var requester = CreateParticipant("user-2", Guid.NewGuid());
        var request = requester.CreateRequest("A need", "A description");

        var act = () => creator.SubmitOffer(request, requester, 10, []);

        act.Should().Throw<DomainRuleViolationException>()
            .WithMessage("An Offer can only be submitted for a Request in the Participant's Home Commons.");
    }

    [Fact]
    public void Participant_cannot_submit_offer_on_cancelled_request()
    {
        var (creator, request, requestCreator) = CreateAvailableRequest();
        request.Cancel();

        var act = () => creator.SubmitOffer(request, requestCreator, 10, []);

        act.Should().Throw<DomainRuleViolationException>()
            .WithMessage("An Offer can only be submitted for an Open Request.");
    }

    private static (
        Participant Creator,
        Commons.Domain.Requests.Request Request,
        Participant RequestCreator)
        CreateAvailableRequest()
    {
        return CreateAvailableRequestWithRequester();
    }

    private static (
        Participant Creator,
        Commons.Domain.Requests.Request Request,
        Participant Requester) CreateAvailableRequestWithRequester()
    {
        var homeCommonsId = Guid.NewGuid();
        var creator = CreateParticipant("user-1", homeCommonsId);
        var requester = CreateParticipant("user-2", homeCommonsId);
        var request = requester.CreateRequest("A need", "A description");
        return (creator, request, requester);
    }

    private static Participant CreateParticipant(string userId, Guid homeCommonsId) =>
        Participant.Join(userId, homeCommonsId, userId, null, DateTimeOffset.UtcNow);
}
