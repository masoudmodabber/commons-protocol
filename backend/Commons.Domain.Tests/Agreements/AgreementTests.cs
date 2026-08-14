using Commons.Domain.Offers;
using Commons.Domain.Participants;
using Commons.Domain.Requests;

namespace Commons.Domain.Tests.Agreements;

public sealed class AgreementTests
{
    [Fact]
    public void Request_creator_can_accept_active_offer_and_match_request()
    {
        var scenario = CreateScenario();

        var agreement = scenario.Request.AcceptOffer(
            scenario.SelectedOffer,
            [scenario.SelectedOffer]);

        scenario.Request.Status.Should().Be(RequestStatus.Matched);
        scenario.SelectedOffer.Status.Should().Be(OfferStatus.Accepted);
        agreement.RequestId.Should().Be(scenario.Request.Id);
        agreement.AcceptedOfferId.Should().Be(scenario.SelectedOffer.Id);
        agreement.RequestCreatorParticipantId.Should().Be(scenario.RequestCreator.Id);
        agreement.OfferCreatorParticipantId.Should().Be(scenario.OfferCreator.Id);
        agreement.CommonsAccountingUnits.Should().Be(10);
        agreement.RequestedContributions.Should().BeEmpty();
    }

    [Fact]
    public void Acceptance_closes_other_active_offers_and_leaves_withdrawn_offers_unchanged()
    {
        var scenario = CreateScenario();
        var otherCreator = CreateParticipant("other", scenario.HomeCommonsId);
        var otherActive = otherCreator.SubmitOffer(
            scenario.Request,
            scenario.RequestCreator,
            20,
            []);
        var withdrawn = otherCreator.SubmitOffer(
            scenario.Request,
            scenario.RequestCreator,
            30,
            []);
        withdrawn.Withdraw();

        scenario.Request.AcceptOffer(
            scenario.SelectedOffer,
            [scenario.SelectedOffer, otherActive, withdrawn]);

        otherActive.Status.Should().Be(OfferStatus.Closed);
        withdrawn.Status.Should().Be(OfferStatus.Withdrawn);
    }

    [Fact]
    public void Agreement_copies_units_and_stored_capability_terms_from_offer()
    {
        var homeCommonsId = Guid.NewGuid();
        var requestCreator = CreateParticipant("requester", homeCommonsId);
        var offerCreator = CreateParticipant("offerer", homeCommonsId);
        var capability = requestCreator.AddCapability("  Fresh Eggs  ");
        var request = requestCreator.CreateRequest("Repair", "Repair the gate");
        var offer = offerCreator.SubmitOffer(
            request,
            requestCreator,
            12,
            [new RequestedContributionSelection(capability.Id, "  Two dozen eggs  ")]);
        requestCreator.RemoveCapability(capability.Id).Should().BeTrue();

        var agreement = request.AcceptOffer(offer, [offer]);

        agreement.CommonsAccountingUnits.Should().Be(12);
        agreement.RequestedContributions.Should().ContainSingle().Which.Should().BeEquivalentTo(
            new
            {
                CapabilityId = capability.Id,
                CapabilityTextSnapshot = "Fresh Eggs",
                Description = "Two dozen eggs"
            },
            options => options.ExcludingMissingMembers());
    }

    [Fact]
    public void Agreement_supports_capability_terms_without_units()
    {
        var homeCommonsId = Guid.NewGuid();
        var requestCreator = CreateParticipant("requester", homeCommonsId);
        var offerCreator = CreateParticipant("offerer", homeCommonsId);
        var capability = requestCreator.AddCapability("Transport");
        var request = requestCreator.CreateRequest("Repair", "Repair the gate");
        var offer = offerCreator.SubmitOffer(
            request,
            requestCreator,
            null,
            [new RequestedContributionSelection(capability.Id, "Airport trip")]);

        var agreement = request.AcceptOffer(offer, [offer]);

        agreement.CommonsAccountingUnits.Should().BeNull();
        agreement.RequestedContributions.Should().ContainSingle().Which.Should().BeEquivalentTo(
            new
            {
                CapabilityId = capability.Id,
                CapabilityTextSnapshot = "Transport",
                Description = "Airport trip"
            },
            options => options.ExcludingMissingMembers());
    }

    [Fact]
    public void Acceptance_rejects_selected_offer_that_is_not_active()
    {
        var scenario = CreateScenario();
        scenario.SelectedOffer.Withdraw();

        var act = () => scenario.Request.AcceptOffer(
            scenario.SelectedOffer,
            [scenario.SelectedOffer]);

        act.Should().Throw<OfferNotActiveException>()
            .WithMessage("Only an Active Offer can be accepted.");
        scenario.Request.Status.Should().Be(RequestStatus.Open);
    }

    [Fact]
    public void Matched_request_cannot_accept_another_offer()
    {
        var scenario = CreateScenario();
        var otherCreator = CreateParticipant("other", scenario.HomeCommonsId);
        var otherOffer = otherCreator.SubmitOffer(
            scenario.Request,
            scenario.RequestCreator,
            20,
            []);
        scenario.Request.AcceptOffer(
            scenario.SelectedOffer,
            [scenario.SelectedOffer, otherOffer]);

        var act = () => scenario.Request.AcceptOffer(otherOffer, [otherOffer]);

        act.Should().Throw<RequestNotOpenException>();
        otherOffer.Status.Should().Be(OfferStatus.Closed);
    }

    [Fact]
    public void Acceptance_rejects_offer_or_collection_from_another_request()
    {
        var scenario = CreateScenario();
        var anotherRequest = scenario.RequestCreator.CreateRequest("Other", "Other need");
        var anotherOffer = scenario.OfferCreator.SubmitOffer(
            anotherRequest,
            scenario.RequestCreator,
            10,
            []);

        var selectedAct = () => scenario.Request.AcceptOffer(
            anotherOffer,
            [anotherOffer]);
        var collectionAct = () => scenario.Request.AcceptOffer(
            scenario.SelectedOffer,
            [scenario.SelectedOffer, anotherOffer]);

        selectedAct.Should().Throw<DomainRuleViolationException>()
            .WithMessage("Every supplied Offer must belong to the Request.");
        collectionAct.Should().Throw<DomainRuleViolationException>()
            .WithMessage("Every supplied Offer must belong to the Request.");
    }

    [Fact]
    public void Acceptance_requires_selected_offer_in_supplied_request_collection()
    {
        var scenario = CreateScenario();

        var act = () => scenario.Request.AcceptOffer(scenario.SelectedOffer, []);

        act.Should().Throw<DomainRuleViolationException>()
            .WithMessage("The selected Offer must be included with the Request Offers.");
    }

    [Fact]
    public void Accepted_and_closed_offers_cannot_be_withdrawn()
    {
        var scenario = CreateScenario();
        var otherCreator = CreateParticipant("other", scenario.HomeCommonsId);
        var otherOffer = otherCreator.SubmitOffer(
            scenario.Request,
            scenario.RequestCreator,
            20,
            []);
        scenario.Request.AcceptOffer(
            scenario.SelectedOffer,
            [scenario.SelectedOffer, otherOffer]);

        Action withdrawAccepted = scenario.SelectedOffer.Withdraw;
        Action withdrawClosed = otherOffer.Withdraw;

        withdrawAccepted.Should().Throw<OfferNotActiveException>();
        withdrawClosed.Should().Throw<OfferNotActiveException>();
    }

    private static Scenario CreateScenario()
    {
        var homeCommonsId = Guid.NewGuid();
        var requestCreator = CreateParticipant("requester", homeCommonsId);
        var offerCreator = CreateParticipant("offerer", homeCommonsId);
        var request = requestCreator.CreateRequest("Repair", "Repair the gate");
        var selectedOffer = offerCreator.SubmitOffer(request, requestCreator, 10, []);
        return new Scenario(homeCommonsId, requestCreator, offerCreator, request, selectedOffer);
    }

    private static Participant CreateParticipant(string userId, Guid homeCommonsId) =>
        Participant.Join(userId, homeCommonsId, userId, null, DateTimeOffset.UtcNow);

    private sealed record Scenario(
        Guid HomeCommonsId,
        Participant RequestCreator,
        Participant OfferCreator,
        Request Request,
        Offer SelectedOffer);
}
