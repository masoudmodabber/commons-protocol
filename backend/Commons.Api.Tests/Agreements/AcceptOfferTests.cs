using System.Net;
using System.Net.Http.Json;
using Commons.Api.Agreements;
using Commons.Api.Offers;
using Commons.Api.Participants;
using Commons.Api.Requests;
using Commons.Api.Tests.Participants;
using Commons.Domain.Agreements;
using Commons.Domain.Offers;
using Commons.Domain.Requests;
using Commons.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Commons.Api.Tests.Agreements;

public sealed class AcceptOfferTests
{
    [Fact]
    public async Task Request_creator_accepts_offer_and_creates_snapshot_agreement_atomically()
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
        var request = await CreateRequestAsync(aliceClient, "Repair a garden gate");
        var selected = await SubmitOfferAsync(
            bobClient,
            request.Id,
            new SubmitOfferRequest(
                12,
                [new RequestedContributionRequest(eggs.Id, "Two dozen eggs")]));
        var otherActive = await SubmitOfferAsync(
            carolClient,
            request.Id,
            new SubmitOfferRequest(20, []));
        var withdrawn = await SubmitOfferAsync(
            carolClient,
            request.Id,
            new SubmitOfferRequest(30, []));
        (await carolClient.PostAsync($"/api/offers/{withdrawn.Id}/withdraw", null))
            .EnsureSuccessStatusCode();
        (await aliceClient.DeleteAsync($"/api/participants/me/capabilities/{eggs.Id}"))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);

        var response = await aliceClient.PostAsync(
            $"/api/offers/{selected.Id}/accept",
            null);
        var agreement = await response.Content.ReadFromJsonAsync<AgreementDetails>();

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        agreement.Should().NotBeNull();
        agreement!.Request.Should().Match<AgreementRequestDetails>(details =>
            details.Id == request.Id
            && details.Status == "Matched"
            && details.Creator.DisplayName == "Alice");
        agreement.AcceptedOffer.Should().Match<AgreementOfferDetails>(details =>
            details.Id == selected.Id
            && details.Status == "Accepted"
            && details.Creator.DisplayName == "Bob");
        agreement.CommonsAccountingUnits.Should().Be(12);
        agreement.RequestedContributions.Should().ContainSingle().Which.Should().BeEquivalentTo(
            new RequestedContributionDetails(eggs.Id, "Fresh Eggs", "Two dozen eggs"));

        var comparison = await aliceClient.GetFromJsonAsync<RequestOfferComparison>(
            $"/api/requests/{request.Id}/offers");
        comparison!.Offers.Should().BeEmpty();

        await using var scope = application.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CommonsDbContext>();
        (await dbContext.Requests.SingleAsync(entity => entity.Id == request.Id))
            .Status.Should().Be(RequestStatus.Matched);
        (await dbContext.Offers.SingleAsync(offer => offer.Id == selected.Id))
            .Status.Should().Be(OfferStatus.Accepted);
        (await dbContext.Offers.SingleAsync(offer => offer.Id == otherActive.Id))
            .Status.Should().Be(OfferStatus.Closed);
        (await dbContext.Offers.SingleAsync(offer => offer.Id == withdrawn.Id))
            .Status.Should().Be(OfferStatus.Withdrawn);
        (await dbContext.Agreements.CountAsync()).Should().Be(1);
        (await dbContext.Set<AgreementRequestedContribution>().CountAsync()).Should().Be(1);
        (await dbContext.RequestedContributions.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task Agreement_is_discoverable_from_matched_request_and_accepted_offer()
    {
        await using var application = new CommonsApiApplication();
        var aliceClient = await application.CreateSeededClientAsync("user-1");
        var bobClient = CreateAuthenticatedClient(application, "user-2");
        await JoinParticipantAsync(aliceClient, "Alice");
        await JoinParticipantAsync(bobClient, "Bob");
        var request = await CreateRequestAsync(aliceClient, "Repair a garden gate");
        var offer = await SubmitOfferAsync(
            bobClient,
            request.Id,
            new SubmitOfferRequest(12, []));
        var accepted = await aliceClient.PostAsync($"/api/offers/{offer.Id}/accept", null);
        var agreement = (await accepted.Content.ReadFromJsonAsync<AgreementDetails>())!;

        var matchedRequest = await aliceClient.GetFromJsonAsync<RequestDetails>(
            $"/api/requests/{request.Id}");
        var acceptedOffer = await bobClient.GetFromJsonAsync<OfferDetails>(
            $"/api/offers/{offer.Id}");
        var requesterView = await aliceClient.GetAsync($"/api/agreements/{agreement.Id}");
        var offererView = await bobClient.GetAsync($"/api/agreements/{agreement.Id}");

        matchedRequest!.Status.Should().Be("Matched");
        matchedRequest.AgreementId.Should().Be(agreement.Id);
        acceptedOffer!.Status.Should().Be("Accepted");
        acceptedOffer.AgreementId.Should().Be(agreement.Id);
        requesterView.StatusCode.Should().Be(HttpStatusCode.OK);
        offererView.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Acceptance_enforces_request_ownership_authentication_and_participation()
    {
        await using var application = new CommonsApiApplication();
        var aliceClient = await application.CreateSeededClientAsync("user-1");
        var bobClient = CreateAuthenticatedClient(application, "user-2");
        await JoinParticipantAsync(aliceClient, "Alice");
        await JoinParticipantAsync(bobClient, "Bob");
        var request = await CreateRequestAsync(aliceClient, "Repair a garden gate");
        var offer = await SubmitOfferAsync(
            bobClient,
            request.Id,
            new SubmitOfferRequest(12, []));
        var anonymousClient = application.CreateClient();
        var participantlessClient = CreateAuthenticatedClient(application, "user-3");

        var nonOwner = await bobClient.PostAsync($"/api/offers/{offer.Id}/accept", null);
        var forged = await aliceClient.PostAsync($"/api/offers/{Guid.NewGuid()}/accept", null);
        var anonymous = await anonymousClient.PostAsync($"/api/offers/{offer.Id}/accept", null);
        var participantless = await participantlessClient.PostAsync(
            $"/api/offers/{offer.Id}/accept",
            null);

        nonOwner.StatusCode.Should().Be(HttpStatusCode.NotFound);
        forged.StatusCode.Should().Be(HttpStatusCode.NotFound);
        anonymous.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        participantless.StatusCode.Should().Be(HttpStatusCode.NotFound);

        await using var scope = application.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CommonsDbContext>();
        (await dbContext.Agreements.CountAsync()).Should().Be(0);
        (await dbContext.Requests.SingleAsync(entity => entity.Id == request.Id))
            .Status.Should().Be(RequestStatus.Open);
        (await dbContext.Offers.SingleAsync(entity => entity.Id == offer.Id))
            .Status.Should().Be(OfferStatus.Active);
    }

    [Fact]
    public async Task Non_active_offer_and_second_acceptance_are_rejected_without_extra_agreement()
    {
        await using var application = new CommonsApiApplication();
        var aliceClient = await application.CreateSeededClientAsync("user-1");
        var bobClient = CreateAuthenticatedClient(application, "user-2");
        await JoinParticipantAsync(aliceClient, "Alice");
        await JoinParticipantAsync(bobClient, "Bob");
        var request = await CreateRequestAsync(aliceClient, "Repair a garden gate");
        var selected = await SubmitOfferAsync(
            bobClient,
            request.Id,
            new SubmitOfferRequest(12, []));
        var withdrawn = await SubmitOfferAsync(
            bobClient,
            request.Id,
            new SubmitOfferRequest(20, []));
        (await bobClient.PostAsync($"/api/offers/{withdrawn.Id}/withdraw", null))
            .EnsureSuccessStatusCode();

        var withdrawnAcceptance = await aliceClient.PostAsync(
            $"/api/offers/{withdrawn.Id}/accept",
            null);
        var accepted = await aliceClient.PostAsync($"/api/offers/{selected.Id}/accept", null);
        var repeated = await aliceClient.PostAsync($"/api/offers/{selected.Id}/accept", null);

        withdrawnAcceptance.StatusCode.Should().Be(HttpStatusCode.Conflict);
        accepted.StatusCode.Should().Be(HttpStatusCode.Created);
        repeated.StatusCode.Should().Be(HttpStatusCode.Conflict);

        await using var scope = application.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CommonsDbContext>();
        (await dbContext.Agreements.CountAsync()).Should().Be(1);
        (await dbContext.Offers.SingleAsync(offer => offer.Id == withdrawn.Id))
            .Status.Should().Be(OfferStatus.Withdrawn);
    }

    [Fact]
    public async Task Agreement_detail_rejects_unrelated_participant_valid_id_and_unauthenticated_access()
    {
        await using var application = new CommonsApiApplication();
        var aliceClient = await application.CreateSeededClientAsync("user-1");
        var bobClient = CreateAuthenticatedClient(application, "user-2");
        await AddUserAsync(application, "user-3");
        var carolClient = CreateAuthenticatedClient(application, "user-3");
        await JoinParticipantAsync(aliceClient, "Alice");
        await JoinParticipantAsync(bobClient, "Bob");
        await JoinParticipantAsync(carolClient, "Carol");
        var request = await CreateRequestAsync(aliceClient, "Repair a garden gate");
        var offer = await SubmitOfferAsync(
            bobClient,
            request.Id,
            new SubmitOfferRequest(12, []));
        var accepted = await aliceClient.PostAsync($"/api/offers/{offer.Id}/accept", null);
        var agreement = (await accepted.Content.ReadFromJsonAsync<AgreementDetails>())!;
        var anonymousClient = application.CreateClient();
        var participantlessClient = CreateAuthenticatedClient(application, "user-4");

        var unrelated = await carolClient.GetAsync($"/api/agreements/{agreement.Id}");
        var forged = await aliceClient.GetAsync($"/api/agreements/{Guid.NewGuid()}");
        var anonymous = await anonymousClient.GetAsync($"/api/agreements/{agreement.Id}");
        var participantless = await participantlessClient.GetAsync(
            $"/api/agreements/{agreement.Id}");

        unrelated.StatusCode.Should().Be(HttpStatusCode.NotFound);
        forged.StatusCode.Should().Be(HttpStatusCode.NotFound);
        anonymous.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        participantless.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private static HttpClient CreateAuthenticatedClient(
        CommonsApiApplication application,
        string userId)
    {
        var client = application.CreateClient();
        client.DefaultRequestHeaders.Add(TestAuthenticationHandler.UserHeader, userId);
        return client;
    }

    private static async Task AddUserAsync(CommonsApiApplication application, string userId)
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
