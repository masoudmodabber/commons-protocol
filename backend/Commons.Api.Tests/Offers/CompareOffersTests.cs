using System.Net;
using System.Net.Http.Json;
using Commons.Api.Offers;
using Commons.Api.Participants;
using Commons.Api.Requests;
using Commons.Api.Tests.Participants;
using Commons.Domain.Offers;
using Commons.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Commons.Api.Tests.Offers;

public sealed class CompareOffersTests
{
    [Fact]
    public async Task Request_creator_compares_only_active_offers_with_stored_terms()
    {
        await using var application = new CommonsApiApplication();
        var aliceClient = await application.CreateSeededClientAsync("user-1");
        var bobClient = CreateAuthenticatedClient(application, "user-2");
        await AddUserAsync(application, "user-3");
        var carolClient = CreateAuthenticatedClient(application, "user-3");
        await JoinParticipantAsync(aliceClient, "Alice");
        await JoinParticipantAsync(bobClient, "Bob");
        await JoinParticipantAsync(carolClient, "Carol");
        var eggs = await AddCapabilityAsync(aliceClient, "Fresh Eggs");
        var transport = await AddCapabilityAsync(aliceClient, "Transport");
        var targetRequest = await CreateRequestAsync(aliceClient, "Repair a garden gate");
        var otherRequest = await CreateRequestAsync(aliceClient, "Paint a garden shed");

        var unitsOnly = await SubmitOfferAsync(
            bobClient,
            targetRequest.Id,
            new SubmitOfferRequest(30, []));
        var capabilityOnly = await SubmitOfferAsync(
            bobClient,
            targetRequest.Id,
            new SubmitOfferRequest(
                null,
                [new RequestedContributionRequest(eggs.Id, "Two dozen eggs")]));
        var mixed = await SubmitOfferAsync(
            carolClient,
            targetRequest.Id,
            new SubmitOfferRequest(
                12,
                [new RequestedContributionRequest(transport.Id, "Saturday airport trip")]));
        var withdrawn = await SubmitOfferAsync(
            bobClient,
            targetRequest.Id,
            new SubmitOfferRequest(5, []));
        var otherRequestOffer = await SubmitOfferAsync(
            bobClient,
            otherRequest.Id,
            new SubmitOfferRequest(8, []));

        (await bobClient.PostAsync($"/api/offers/{withdrawn.Id}/withdraw", null))
            .EnsureSuccessStatusCode();
        (await aliceClient.DeleteAsync($"/api/participants/me/capabilities/{eggs.Id}"))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await aliceClient.PostAsync($"/api/requests/{targetRequest.Id}/cancel", null))
            .EnsureSuccessStatusCode();

        await using var beforeScope = application.Services.CreateAsyncScope();
        var beforeDbContext = beforeScope.ServiceProvider.GetRequiredService<CommonsDbContext>();
        var beforeCounts = new
        {
            Requests = await beforeDbContext.Requests.CountAsync(),
            Offers = await beforeDbContext.Offers.CountAsync(),
            Contributions = await beforeDbContext.RequestedContributions.CountAsync()
        };

        var response = await aliceClient.GetAsync(
            $"/api/requests/{targetRequest.Id}/offers");
        var comparison = await response.Content.ReadFromJsonAsync<RequestOfferComparison>();

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        comparison.Should().NotBeNull();
        comparison!.Request.Id.Should().Be(targetRequest.Id);
        comparison.Request.Title.Should().Be("Repair a garden gate");
        comparison.Offers.Select(offer => offer.Id).Should().BeEquivalentTo(
            [unitsOnly.Id, capabilityOnly.Id, mixed.Id]);
        comparison.Offers.Should().OnlyContain(offer => offer.Status == "Active");
        comparison.Offers.Should().NotContain(offer => offer.Id == withdrawn.Id);
        comparison.Offers.Should().NotContain(offer => offer.Id == otherRequestOffer.Id);

        comparison.Offers.Single(offer => offer.Id == unitsOnly.Id)
            .Should().Match<OfferDetails>(offer =>
                offer.Creator.DisplayName == "Bob"
                && offer.CommonsAccountingUnits == 30
                && offer.RequestedContributions.Count == 0);
        comparison.Offers.Single(offer => offer.Id == capabilityOnly.Id)
            .RequestedContributions.Should().ContainSingle().Which.Should().BeEquivalentTo(
                new RequestedContributionDetails(eggs.Id, "Fresh Eggs", "Two dozen eggs"));
        comparison.Offers.Single(offer => offer.Id == mixed.Id)
            .Should().Match<OfferDetails>(offer =>
                offer.Creator.DisplayName == "Carol"
                && offer.CommonsAccountingUnits == 12
                && offer.RequestedContributions.Single().CapabilityTextSnapshot == "Transport"
                && offer.RequestedContributions.Single().Description == "Saturday airport trip");

        await using var afterScope = application.Services.CreateAsyncScope();
        var afterDbContext = afterScope.ServiceProvider.GetRequiredService<CommonsDbContext>();
        (await afterDbContext.Requests.CountAsync()).Should().Be(beforeCounts.Requests);
        (await afterDbContext.Offers.CountAsync()).Should().Be(beforeCounts.Offers);
        (await afterDbContext.RequestedContributions.CountAsync())
            .Should().Be(beforeCounts.Contributions);
        (await afterDbContext.Offers.SingleAsync(offer => offer.Id == withdrawn.Id))
            .Status.Should().Be(OfferStatus.Withdrawn);
    }

    [Fact]
    public async Task Comparison_requires_request_ownership_authentication_and_participation()
    {
        await using var application = new CommonsApiApplication();
        var aliceClient = await application.CreateSeededClientAsync("user-1");
        var bobClient = CreateAuthenticatedClient(application, "user-2");
        await JoinParticipantAsync(aliceClient, "Alice");
        await JoinParticipantAsync(bobClient, "Bob");
        var aliceRequest = await CreateRequestAsync(aliceClient, "Repair a garden gate");
        var bobRequest = await CreateRequestAsync(bobClient, "Move a garden table");
        var bobsOffer = await SubmitOfferAsync(
            bobClient,
            aliceRequest.Id,
            new SubmitOfferRequest(30, []));
        var anonymousClient = application.CreateClient();
        var participantlessClient = CreateAuthenticatedClient(application, "user-3");

        var ownerResponse = await aliceClient.GetAsync(
            $"/api/requests/{aliceRequest.Id}/offers");
        var nonOwnerResponse = await bobClient.GetAsync(
            $"/api/requests/{aliceRequest.Id}/offers");
        var otherOwnedRequestResponse = await aliceClient.GetAsync(
            $"/api/requests/{bobRequest.Id}/offers");
        var forgedResponse = await aliceClient.GetAsync(
            $"/api/requests/{Guid.NewGuid()}/offers");
        var anonymousResponse = await anonymousClient.GetAsync(
            $"/api/requests/{aliceRequest.Id}/offers");
        var participantlessResponse = await participantlessClient.GetAsync(
            $"/api/requests/{aliceRequest.Id}/offers");
        var creatorScopedOfferDetail = await aliceClient.GetAsync(
            $"/api/offers/{bobsOffer.Id}");

        ownerResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        nonOwnerResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
        otherOwnedRequestResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
        forgedResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
        anonymousResponse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        participantlessResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
        creatorScopedOfferDetail.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private static HttpClient CreateAuthenticatedClient(
        CommonsApiApplication application,
        string userId)
    {
        var client = application.CreateClient();
        client.DefaultRequestHeaders.Add(TestAuthenticationHandler.UserHeader, userId);
        return client;
    }

    private static async Task AddUserAsync(
        CommonsApiApplication application,
        string userId)
    {
        await using var scope = application.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CommonsDbContext>();
        dbContext.Users.Add(new IdentityUser { Id = userId, UserName = userId });
        await dbContext.SaveChangesAsync();
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
