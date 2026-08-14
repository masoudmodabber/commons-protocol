using System.Net;
using System.Net.Http.Json;
using Commons.Api.Offers;
using Commons.Api.Participants;
using Commons.Api.Requests;
using Commons.Api.Tests.Participants;
using Commons.Domain.Offers;
using Commons.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Commons.Api.Tests.Offers;

public sealed class WithdrawOfferTests
{
    [Fact]
    public async Task Creator_withdraws_active_offer_without_deleting_or_changing_terms()
    {
        await using var application = new CommonsApiApplication();
        var scenario = await CreateScenarioAsync(application);
        var capability = await AddCapabilityAsync(scenario.RequestCreatorClient, "Fresh Eggs");
        var submitted = await SubmitOfferAsync(
            scenario.OfferCreatorClient,
            scenario.Request.Id,
            new SubmitOfferRequest(
                12,
                [new RequestedContributionRequest(capability.Id, "Two dozen eggs")]));

        var response = await scenario.OfferCreatorClient.PostAsync(
            $"/api/offers/{submitted.Id}/withdraw",
            null);
        var withdrawn = await response.Content.ReadFromJsonAsync<OfferDetails>();
        var viewed = await scenario.OfferCreatorClient.GetFromJsonAsync<OfferDetails>(
            $"/api/offers/{submitted.Id}");
        var listed = await scenario.OfferCreatorClient.GetFromJsonAsync<List<OfferDetails>>(
            "/api/offers");
        var repeated = await scenario.OfferCreatorClient.PostAsync(
            $"/api/offers/{submitted.Id}/withdraw",
            null);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        submitted.Status.Should().Be("Active");
        withdrawn!.Status.Should().Be("Withdrawn");
        withdrawn.Id.Should().Be(submitted.Id);
        withdrawn.Request.Should().BeEquivalentTo(submitted.Request);
        withdrawn.Creator.Should().BeEquivalentTo(submitted.Creator);
        withdrawn.CommonsAccountingUnits.Should().Be(submitted.CommonsAccountingUnits);
        withdrawn.RequestedContributions.Should().BeEquivalentTo(
            submitted.RequestedContributions);
        viewed.Should().BeEquivalentTo(withdrawn);
        listed.Should().ContainSingle().Which.Should().BeEquivalentTo(withdrawn);
        repeated.StatusCode.Should().Be(HttpStatusCode.Conflict);

        await using var scope = application.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CommonsDbContext>();
        var persisted = await dbContext.Offers.SingleAsync();
        persisted.Status.Should().Be(OfferStatus.Withdrawn);
        persisted.RequestId.Should().Be(submitted.Request.Id);
        persisted.CreatorParticipantId.Should().Be(submitted.Creator.ParticipantId);
        persisted.CommonsAccountingUnits.Should().Be(12);
        (await dbContext.RequestedContributions.CountAsync()).Should().Be(1);
        (await dbContext.Requests.CountAsync()).Should().Be(1);
        (await dbContext.Participants.CountAsync()).Should().Be(2);
    }

    [Fact]
    public async Task Withdrawal_requires_creator_authentication_and_resists_forged_ids()
    {
        await using var application = new CommonsApiApplication();
        var scenario = await CreateScenarioAsync(application);
        var submitted = await SubmitOfferAsync(
            scenario.OfferCreatorClient,
            scenario.Request.Id,
            new SubmitOfferRequest(10, []));
        var anonymousClient = application.CreateClient();
        var participantlessClient = CreateAuthenticatedClient(application, "user-3");

        var requesterAttempt = await scenario.RequestCreatorClient.PostAsync(
            $"/api/offers/{submitted.Id}/withdraw",
            null);
        var forgedAttempt = await scenario.OfferCreatorClient.PostAsync(
            $"/api/offers/{Guid.NewGuid()}/withdraw",
            null);
        var anonymousAttempt = await anonymousClient.PostAsync(
            $"/api/offers/{submitted.Id}/withdraw",
            null);
        var participantlessAttempt = await participantlessClient.PostAsync(
            $"/api/offers/{submitted.Id}/withdraw",
            null);
        var viewed = await scenario.OfferCreatorClient.GetFromJsonAsync<OfferDetails>(
            $"/api/offers/{submitted.Id}");

        requesterAttempt.StatusCode.Should().Be(HttpStatusCode.NotFound);
        forgedAttempt.StatusCode.Should().Be(HttpStatusCode.NotFound);
        anonymousAttempt.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        participantlessAttempt.StatusCode.Should().Be(HttpStatusCode.NotFound);
        viewed!.Status.Should().Be("Active");

        await using var scope = application.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CommonsDbContext>();
        (await dbContext.Offers.CountAsync()).Should().Be(1);
        (await dbContext.Offers.SingleAsync()).Status.Should().Be(OfferStatus.Active);
    }

    private static async Task<OfferScenario> CreateScenarioAsync(
        CommonsApiApplication application)
    {
        var requestCreatorClient = await application.CreateSeededClientAsync("user-1");
        var offerCreatorClient = CreateAuthenticatedClient(application, "user-2");
        await JoinParticipantAsync(requestCreatorClient, "Alice");
        await JoinParticipantAsync(offerCreatorClient, "Bob");
        var request = await CreateRequestAsync(requestCreatorClient, "Repair a garden gate");
        return new OfferScenario(requestCreatorClient, offerCreatorClient, request);
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

    private sealed record OfferScenario(
        HttpClient RequestCreatorClient,
        HttpClient OfferCreatorClient,
        RequestDetails Request);
}
