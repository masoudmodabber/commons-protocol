using System.Net;
using System.Net.Http.Json;
using Commons.Api.Agreements;
using Commons.Api.Offers;
using Commons.Api.Participants;
using Commons.Api.Requests;
using Commons.Api.Tests.Participants;
using Commons.Domain.Offers;
using Commons.Domain.Requests;
using Commons.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Commons.Api.Tests.Agreements;

public sealed class ViewAgreementsTests
{
    [Fact]
    public async Task Participants_list_only_their_agreements_and_share_authoritative_terms()
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
        var aliceRequest = await CreateRequestAsync(aliceClient, "Repair a garden gate");
        var bobsOffer = await SubmitOfferAsync(
            bobClient,
            aliceRequest.Id,
            new SubmitOfferRequest(
                12,
                [new RequestedContributionRequest(eggs.Id, "Two dozen eggs")]));
        var firstAgreement = await AcceptOfferAsync(aliceClient, bobsOffer.Id);

        var bobRequest = await CreateRequestAsync(bobClient, "Move a table");
        var carolsOffer = await SubmitOfferAsync(
            carolClient,
            bobRequest.Id,
            new SubmitOfferRequest(8, []));
        var secondAgreement = await AcceptOfferAsync(bobClient, carolsOffer.Id);

        (await aliceClient.DeleteAsync($"/api/participants/me/capabilities/{eggs.Id}"))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);

        var aliceResponse = await aliceClient.GetAsync("/api/agreements");
        var bobResponse = await bobClient.GetAsync("/api/agreements");
        var carolResponse = await carolClient.GetAsync("/api/agreements");
        var aliceAgreements = await aliceResponse.Content
            .ReadFromJsonAsync<List<AgreementDetails>>();
        var bobAgreements = await bobResponse.Content
            .ReadFromJsonAsync<List<AgreementDetails>>();
        var carolAgreements = await carolResponse.Content
            .ReadFromJsonAsync<List<AgreementDetails>>();

        aliceResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        bobResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        carolResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        aliceAgreements.Should().ContainSingle()
            .Which.Id.Should().Be(firstAgreement.Id);
        bobAgreements.Should().HaveCount(2);
        bobAgreements!.Select(agreement => agreement.Id).Should().BeEquivalentTo(
            new[] { firstAgreement.Id, secondAgreement.Id });
        carolAgreements.Should().ContainSingle()
            .Which.Id.Should().Be(secondAgreement.Id);

        var aliceTerms = aliceAgreements!.Single();
        var bobTerms = bobAgreements.Single(agreement => agreement.Id == firstAgreement.Id);
        aliceTerms.Should().BeEquivalentTo(bobTerms);
        aliceTerms.Request.Title.Should().Be("Repair a garden gate");
        aliceTerms.Request.Creator.DisplayName.Should().Be("Alice");
        aliceTerms.AcceptedOffer.Creator.DisplayName.Should().Be("Bob");
        aliceTerms.CommonsAccountingUnits.Should().Be(12);
        aliceTerms.RequestedContributions.Should().ContainSingle().Which.Should().BeEquivalentTo(
            new RequestedContributionDetails(eggs.Id, "Fresh Eggs", "Two dozen eggs"));

        var aliceDetail = await aliceClient.GetFromJsonAsync<AgreementDetails>(
            $"/api/agreements/{firstAgreement.Id}");
        var bobDetail = await bobClient.GetFromJsonAsync<AgreementDetails>(
            $"/api/agreements/{firstAgreement.Id}");
        aliceDetail.Should().BeEquivalentTo(bobDetail);
        aliceDetail.Should().BeEquivalentTo(aliceTerms);

        await using var scope = application.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CommonsDbContext>();
        (await dbContext.Agreements.CountAsync()).Should().Be(2);
        (await dbContext.AgreementRequestedContributions.CountAsync()).Should().Be(1);
        (await dbContext.Requests.SingleAsync(request => request.Id == aliceRequest.Id))
            .Status.Should().Be(RequestStatus.Matched);
        (await dbContext.Requests.SingleAsync(request => request.Id == bobRequest.Id))
            .Status.Should().Be(RequestStatus.Matched);
        (await dbContext.Offers.SingleAsync(offer => offer.Id == bobsOffer.Id))
            .Status.Should().Be(OfferStatus.Accepted);
        (await dbContext.Offers.SingleAsync(offer => offer.Id == carolsOffer.Id))
            .Status.Should().Be(OfferStatus.Accepted);
        (await dbContext.Capabilities.AnyAsync(capability => capability.Id == eggs.Id))
            .Should().BeFalse();
    }

    [Fact]
    public async Task Collection_and_detail_enforce_authentication_and_agreement_participation()
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
        var agreement = await AcceptOfferAsync(aliceClient, offer.Id);
        var anonymousClient = application.CreateClient();
        var participantlessClient = CreateAuthenticatedClient(application, "user-4");

        var carolList = await carolClient.GetFromJsonAsync<List<AgreementDetails>>(
            "/api/agreements");
        var unrelatedDetail = await carolClient.GetAsync(
            $"/api/agreements/{agreement.Id}");
        var anonymousList = await anonymousClient.GetAsync("/api/agreements");
        var anonymousDetail = await anonymousClient.GetAsync(
            $"/api/agreements/{agreement.Id}");
        var participantlessList = await participantlessClient.GetAsync("/api/agreements");
        var participantlessDetail = await participantlessClient.GetAsync(
            $"/api/agreements/{agreement.Id}");

        carolList.Should().BeEmpty();
        unrelatedDetail.StatusCode.Should().Be(HttpStatusCode.NotFound);
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

    private static async Task<AgreementDetails> AcceptOfferAsync(
        HttpClient client,
        Guid offerId)
    {
        var response = await client.PostAsync($"/api/offers/{offerId}/accept", null);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<AgreementDetails>())!;
    }
}
