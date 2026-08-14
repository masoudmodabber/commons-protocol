using System.Net;
using System.Net.Http.Json;
using Commons.Api.Offers;
using Commons.Api.Participants;
using Commons.Api.Requests;
using Commons.Api.Tests.Participants;
using Commons.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Commons.Api.Tests.Offers;

public sealed class ViewOffersTests
{
    [Fact]
    public async Task Participant_lists_only_own_units_capability_and_mixed_offers()
    {
        await using var application = new CommonsApiApplication();
        var aliceClient = await application.CreateSeededClientAsync("user-1");
        var bobClient = CreateAuthenticatedClient(application, "user-2");
        await JoinParticipantAsync(aliceClient, "Alice");
        await JoinParticipantAsync(bobClient, "Bob");
        var eggs = await AddCapabilityAsync(aliceClient, "Fresh Eggs");
        var transport = await AddCapabilityAsync(aliceClient, "Transport");
        var aliceRequest = await CreateRequestAsync(aliceClient, "Repair a garden gate");

        var unitsOnly = await SubmitOfferAsync(
            bobClient,
            aliceRequest.Id,
            new SubmitOfferRequest(30, []));
        var capabilityOnly = await SubmitOfferAsync(
            bobClient,
            aliceRequest.Id,
            new SubmitOfferRequest(
                null,
                [new RequestedContributionRequest(eggs.Id, "  Two dozen eggs  ")]));
        var mixed = await SubmitOfferAsync(
            bobClient,
            aliceRequest.Id,
            new SubmitOfferRequest(
                12,
                [new RequestedContributionRequest(transport.Id, "Airport trip on Saturday")]));

        var bobRequest = await CreateRequestAsync(bobClient, "Help moving a table");
        var alicesOffer = await SubmitOfferAsync(
            aliceClient,
            bobRequest.Id,
            new SubmitOfferRequest(5, []));
        var removeResponse = await aliceClient.DeleteAsync(
            $"/api/participants/me/capabilities/{eggs.Id}");

        var response = await bobClient.GetAsync("/api/offers");
        var offers = await response.Content.ReadFromJsonAsync<List<OfferDetails>>();
        var viewed = await bobClient.GetFromJsonAsync<OfferDetails>(
            $"/api/offers/{capabilityOnly.Id}");

        removeResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        offers.Should().NotBeNull();
        offers!.Select(offer => offer.Id).Should().BeEquivalentTo(
            new[] { unitsOnly.Id, capabilityOnly.Id, mixed.Id });
        offers.Should().OnlyContain(offer => offer.Creator.DisplayName == "Bob");
        offers.Should().NotContain(offer => offer.Id == alicesOffer.Id);

        offers.Single(offer => offer.Id == unitsOnly.Id).Should().Match<OfferDetails>(offer =>
            offer.Request.Id == aliceRequest.Id
            && offer.Request.Title == "Repair a garden gate"
            && offer.Request.Creator.DisplayName == "Alice"
            && offer.CommonsAccountingUnits == 30
            && offer.RequestedContributions.Count == 0);

        offers.Single(offer => offer.Id == capabilityOnly.Id)
            .RequestedContributions.Should().ContainSingle().Which.Should().BeEquivalentTo(
                new RequestedContributionDetails(eggs.Id, "Fresh Eggs", "Two dozen eggs"));

        offers.Single(offer => offer.Id == mixed.Id).Should().Match<OfferDetails>(offer =>
            offer.CommonsAccountingUnits == 12
            && offer.RequestedContributions.Single().CapabilityId == transport.Id
            && offer.RequestedContributions.Single().CapabilityTextSnapshot == "Transport"
            && offer.RequestedContributions.Single().Description == "Airport trip on Saturday");
        viewed.Should().BeEquivalentTo(offers.Single(offer => offer.Id == capabilityOnly.Id));

        await using var scope = application.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CommonsDbContext>();
        (await dbContext.Offers.CountAsync()).Should().Be(4);
        (await dbContext.RequestedContributions.CountAsync()).Should().Be(2);
    }

    [Fact]
    public async Task Collection_and_detail_enforce_creator_authentication_and_participation()
    {
        await using var application = new CommonsApiApplication();
        var aliceClient = await application.CreateSeededClientAsync("user-1");
        var bobClient = CreateAuthenticatedClient(application, "user-2");
        await JoinParticipantAsync(aliceClient, "Alice");
        await JoinParticipantAsync(bobClient, "Bob");
        var request = await CreateRequestAsync(aliceClient, "Repair a garden gate");
        var bobsOffer = await SubmitOfferAsync(
            bobClient,
            request.Id,
            new SubmitOfferRequest(30, []));
        var anonymousClient = application.CreateClient();
        var participantlessClient = CreateAuthenticatedClient(application, "user-3");

        var aliceListResponse = await aliceClient.GetAsync("/api/offers");
        var aliceOffers = await aliceListResponse.Content.ReadFromJsonAsync<List<OfferDetails>>();
        var aliceForgedDetail = await aliceClient.GetAsync($"/api/offers/{bobsOffer.Id}");
        var anonymousList = await anonymousClient.GetAsync("/api/offers");
        var anonymousDetail = await anonymousClient.GetAsync($"/api/offers/{bobsOffer.Id}");
        var participantlessList = await participantlessClient.GetAsync("/api/offers");
        var participantlessDetail = await participantlessClient.GetAsync(
            $"/api/offers/{bobsOffer.Id}");

        aliceListResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        aliceOffers.Should().BeEmpty();
        aliceForgedDetail.StatusCode.Should().Be(HttpStatusCode.NotFound);
        anonymousList.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        anonymousDetail.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        participantlessList.StatusCode.Should().Be(HttpStatusCode.NotFound);
        participantlessDetail.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private static HttpClient CreateAuthenticatedClient(
        CommonsApiApplication application,
        string userId)
    {
        var client = application.CreateClient();
        client.DefaultRequestHeaders.Add(TestAuthenticationHandler.UserHeader, userId);
        return client;
    }

    private static async Task JoinParticipantAsync(HttpClient client, string displayName)
    {
        var response = await client.PostAsJsonAsync(
            "/api/participants/me",
            new JoinParticipantRequest(
                CommonsApiApplication.HomeCommonsId,
                displayName,
                null));
        response.EnsureSuccessStatusCode();
    }

    private static async Task<CapabilitySummary> AddCapabilityAsync(
        HttpClient client,
        string text)
    {
        var response = await client.PostAsJsonAsync(
            "/api/participants/me/capabilities",
            new AddCapabilityRequest(text));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<CapabilitySummary>())!;
    }

    private static async Task<RequestDetails> CreateRequestAsync(
        HttpClient client,
        string title)
    {
        var response = await client.PostAsJsonAsync(
            "/api/requests",
            new CreateRequestRequest(title, $"Description for {title}"));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<RequestDetails>())!;
    }

    private static async Task<OfferDetails> SubmitOfferAsync(
        HttpClient client,
        Guid requestId,
        SubmitOfferRequest request)
    {
        var response = await client.PostAsJsonAsync(
            $"/api/requests/{requestId}/offers",
            request);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<OfferDetails>())!;
    }
}
