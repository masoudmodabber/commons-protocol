using Commons.Domain.Offers;
using Commons.Domain.Participants;

namespace Commons.Domain.Tests.Offers;

public sealed class OfferTests
{
    [Fact]
    public void Participant_can_submit_offer_requesting_positive_whole_units_only()
    {
        var (creator, request) = CreateAvailableRequest();

        var offer = creator.SubmitOffer(request, 30, []);

        offer.RequestId.Should().Be(request.Id);
        offer.CreatorParticipantId.Should().Be(creator.Id);
        offer.CommonsAccountingUnits.Should().Be(30);
        offer.RequestedContributions.Should().BeEmpty();
    }

    [Fact]
    public void Offer_can_combine_multiple_distinct_capabilities_with_units()
    {
        var (creator, request, requester) = CreateAvailableRequestWithRequester();
        var eggs = requester.AddCapability("Eggs");
        var transport = requester.AddCapability("Transport");

        var offer = creator.SubmitOffer(
            request,
            15,
            [
                new RequestedContributionTerms(eggs.Id, eggs.Text, "  20 eggs  "),
                new RequestedContributionTerms(
                    transport.Id,
                    transport.Text,
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
            null,
            [new RequestedContributionTerms(
                capability.Id,
                capability.Text,
                "Two hours clearing weeds")]);

        offer.CommonsAccountingUnits.Should().BeNull();
        offer.RequestedContributions.Should().ContainSingle();
    }

    [Fact]
    public void Offer_rejects_no_requested_return()
    {
        var (creator, request) = CreateAvailableRequest();

        var act = () => creator.SubmitOffer(request, null, []);

        act.Should().Throw<DomainRuleViolationException>()
            .WithMessage("An Offer must request Commons accounting units or at least one contribution.");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Offer_rejects_non_positive_units(long units)
    {
        var (creator, request) = CreateAvailableRequest();

        var act = () => creator.SubmitOffer(request, units, []);

        act.Should().Throw<DomainRuleViolationException>()
            .WithMessage("Commons accounting units must be a positive whole number.");
    }

    [Fact]
    public void Offer_rejects_duplicate_capability()
    {
        var (creator, request, requester) = CreateAvailableRequestWithRequester();
        var capability = requester.AddCapability("Eggs");
        var terms = new RequestedContributionTerms(
            capability.Id,
            capability.Text,
            "20 eggs");

        var act = () => creator.SubmitOffer(request, null, [terms, terms]);

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
            null,
            [new RequestedContributionTerms(capability.Id, capability.Text, description)]);

        act.Should().Throw<DomainRuleViolationException>()
            .WithMessage("A requested contribution requires a description.");
    }

    [Fact]
    public void Participant_cannot_submit_offer_on_own_request()
    {
        var participant = CreateParticipant("user-1", Guid.NewGuid());
        var request = participant.CreateRequest("A need", "A description");

        var act = () => participant.SubmitOffer(request, 10, []);

        act.Should().Throw<DomainRuleViolationException>()
            .WithMessage("A Participant cannot submit an Offer on their own Request.");
    }

    [Fact]
    public void Participant_cannot_submit_offer_in_another_home_commons()
    {
        var creator = CreateParticipant("user-1", Guid.NewGuid());
        var requester = CreateParticipant("user-2", Guid.NewGuid());
        var request = requester.CreateRequest("A need", "A description");

        var act = () => creator.SubmitOffer(request, 10, []);

        act.Should().Throw<DomainRuleViolationException>()
            .WithMessage("An Offer can only be submitted for a Request in the Participant's Home Commons.");
    }

    [Fact]
    public void Participant_cannot_submit_offer_on_cancelled_request()
    {
        var (creator, request) = CreateAvailableRequest();
        request.Cancel();

        var act = () => creator.SubmitOffer(request, 10, []);

        act.Should().Throw<DomainRuleViolationException>()
            .WithMessage("An Offer can only be submitted for an Open Request.");
    }

    private static (Participant Creator, Commons.Domain.Requests.Request Request)
        CreateAvailableRequest()
    {
        var (creator, request, _) = CreateAvailableRequestWithRequester();
        return (creator, request);
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
