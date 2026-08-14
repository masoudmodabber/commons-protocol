using System.Net;
using System.Net.Http.Json;
using System.Text;
using Commons.Api.Offers;
using Commons.Api.Participants;
using Commons.Api.Requests;
using Commons.Api.Tests.Participants;
using Commons.Domain.Offers;
using Commons.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using CommonsEntity = Commons.Domain.Participants.Commons;

namespace Commons.Api.Tests.Offers;

public sealed class SubmitOfferTests
{
    private static readonly Guid OtherCommonsId =
        Guid.Parse("ca291801-63b7-493f-a325-c75af863e977");

    [Fact]
    public async Task Participant_can_submit_and_view_units_only_offer()
    {
        await using var application = new CommonsApiApplication();
        var scenario = await CreateScenarioAsync(application);

        var response = await scenario.OfferCreatorClient.PostAsJsonAsync(
            $"/api/requests/{scenario.Request.Id}/offers",
            new SubmitOfferRequest(30, []));
        var created = await response.Content.ReadFromJsonAsync<OfferDetails>();
        var viewed = await scenario.OfferCreatorClient.GetFromJsonAsync<OfferDetails>(
            $"/api/offers/{created!.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        response.Headers.Location.Should().Be($"http://localhost/api/offers/{created.Id}");
        created.Request.Id.Should().Be(scenario.Request.Id);
        created.Creator.DisplayName.Should().Be("Bob");
        created.CommonsAccountingUnits.Should().Be(30);
        created.RequestedContributions.Should().BeEmpty();
        viewed.Should().BeEquivalentTo(created);

        await using var scope = application.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CommonsDbContext>();
        (await dbContext.Offers.CountAsync()).Should().Be(1);
        (await dbContext.RequestedContributions.CountAsync()).Should().Be(0);
        (await dbContext.Requests.CountAsync()).Should().Be(1);
        (await dbContext.Participants.CountAsync()).Should().Be(2);
    }

    [Fact]
    public async Task Participant_can_submit_capability_only_offer_with_trusted_snapshot()
    {
        await using var application = new CommonsApiApplication();
        var scenario = await CreateScenarioAsync(application, "Eggs");
        var capability = scenario.Capabilities.Single();

        var response = await scenario.OfferCreatorClient.PostAsJsonAsync(
            $"/api/requests/{scenario.Request.Id}/offers",
            new SubmitOfferRequest(
                null,
                [new RequestedContributionRequest(capability.Id, "  20 eggs  ")]));
        var offer = await response.Content.ReadFromJsonAsync<OfferDetails>();

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        offer!.CommonsAccountingUnits.Should().BeNull();
        offer.RequestedContributions.Should().ContainSingle().Which.Should().BeEquivalentTo(
            new RequestedContributionDetails(capability.Id, "Eggs", "20 eggs"));
    }

    [Fact]
    public async Task Participant_can_combine_units_and_multiple_distinct_capabilities()
    {
        await using var application = new CommonsApiApplication();
        var scenario = await CreateScenarioAsync(application, "Eggs", "Transport");
        var eggs = scenario.Capabilities.Single(capability => capability.Text == "Eggs");
        var transport = scenario.Capabilities.Single(capability => capability.Text == "Transport");

        var response = await scenario.OfferCreatorClient.PostAsJsonAsync(
            $"/api/requests/{scenario.Request.Id}/offers",
            new SubmitOfferRequest(
                12,
                [
                    new RequestedContributionRequest(eggs.Id, "A dozen eggs"),
                    new RequestedContributionRequest(transport.Id, "Airport trip")
                ]));
        var offer = await response.Content.ReadFromJsonAsync<OfferDetails>();

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        offer!.CommonsAccountingUnits.Should().Be(12);
        offer.RequestedContributions.Should().BeEquivalentTo(
            [
                new RequestedContributionDetails(eggs.Id, "Eggs", "A dozen eggs"),
                new RequestedContributionDetails(transport.Id, "Transport", "Airport trip")
            ]);
    }

    [Fact]
    public async Task Offer_rejects_no_return_zero_negative_and_fractional_units()
    {
        await using var application = new CommonsApiApplication();
        var scenario = await CreateScenarioAsync(application);
        var path = $"/api/requests/{scenario.Request.Id}/offers";

        var noReturn = await scenario.OfferCreatorClient.PostAsJsonAsync(
            path,
            new SubmitOfferRequest(null, []));
        var zero = await scenario.OfferCreatorClient.PostAsJsonAsync(
            path,
            new SubmitOfferRequest(0, []));
        var negative = await scenario.OfferCreatorClient.PostAsJsonAsync(
            path,
            new SubmitOfferRequest(-5, []));
        var fractional = await scenario.OfferCreatorClient.PostAsync(
            path,
            new StringContent(
                """
                {"commonsAccountingUnits":1.5,"requestedContributions":[]}
                """,
                Encoding.UTF8,
                "application/json"));

        noReturn.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        zero.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        negative.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        fractional.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        await using var scope = application.Services.CreateAsyncScope();
        (await scope.ServiceProvider.GetRequiredService<CommonsDbContext>()
            .Offers.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Offer_rejects_empty_descriptions_and_duplicate_capability()
    {
        await using var application = new CommonsApiApplication();
        var scenario = await CreateScenarioAsync(application, "Eggs");
        var capability = scenario.Capabilities.Single();
        var path = $"/api/requests/{scenario.Request.Id}/offers";

        var empty = await scenario.OfferCreatorClient.PostAsJsonAsync(
            path,
            new SubmitOfferRequest(
                null,
                [new RequestedContributionRequest(capability.Id, "   ")]));
        var duplicate = await scenario.OfferCreatorClient.PostAsJsonAsync(
            path,
            new SubmitOfferRequest(
                null,
                [
                    new RequestedContributionRequest(capability.Id, "Six eggs"),
                    new RequestedContributionRequest(capability.Id, "Another six eggs")
                ]));

        empty.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        duplicate.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Capability_snapshot_survives_removal_of_original_capability()
    {
        await using var application = new CommonsApiApplication();
        var scenario = await CreateScenarioAsync(application, "Fresh Eggs");
        var capability = scenario.Capabilities.Single();
        var createResponse = await scenario.OfferCreatorClient.PostAsJsonAsync(
            $"/api/requests/{scenario.Request.Id}/offers",
            new SubmitOfferRequest(
                null,
                [new RequestedContributionRequest(capability.Id, "20 eggs")]));
        var created = await createResponse.Content.ReadFromJsonAsync<OfferDetails>();

        var removeResponse = await scenario.RequestCreatorClient.DeleteAsync(
            $"/api/participants/me/capabilities/{capability.Id}");
        var viewed = await scenario.OfferCreatorClient.GetFromJsonAsync<OfferDetails>(
            $"/api/offers/{created!.Id}");

        removeResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);
        viewed!.RequestedContributions.Should().ContainSingle().Which.Should().BeEquivalentTo(
            new RequestedContributionDetails(capability.Id, "Fresh Eggs", "20 eggs"));

        await using var scope = application.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CommonsDbContext>();
        (await dbContext.Capabilities.AnyAsync(existing => existing.Id == capability.Id))
            .Should().BeFalse();
        (await dbContext.RequestedContributions.AnyAsync(
            contribution => contribution.CapabilityId == capability.Id)).Should().BeTrue();
    }

    [Fact]
    public async Task Offer_rejects_wrong_owner_removed_and_forged_capability_ids()
    {
        await using var application = new CommonsApiApplication();
        var scenario = await CreateScenarioAsync(application, "Eggs");
        var requesterCapability = scenario.Capabilities.Single();
        var offerCreatorCapability = await AddCapabilityAsync(
            scenario.OfferCreatorClient,
            "Carpentry");
        await scenario.RequestCreatorClient.DeleteAsync(
            $"/api/participants/me/capabilities/{requesterCapability.Id}");
        var path = $"/api/requests/{scenario.Request.Id}/offers";

        foreach (var capabilityId in new[]
                 {
                     offerCreatorCapability.Id,
                     requesterCapability.Id,
                     Guid.NewGuid()
                 })
        {
            var response = await scenario.OfferCreatorClient.PostAsJsonAsync(
                path,
                new SubmitOfferRequest(
                    null,
                    [new RequestedContributionRequest(capabilityId, "Requested terms")]));

            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        await using var scope = application.Services.CreateAsyncScope();
        (await scope.ServiceProvider.GetRequiredService<CommonsDbContext>()
            .Offers.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Offer_rejects_own_cross_commons_and_non_open_requests_by_valid_id()
    {
        await using var application = new CommonsApiApplication();
        var scenario = await CreateScenarioAsync(application);
        var ownRequest = await CreateRequestAsync(
            scenario.OfferCreatorClient,
            "Bob's need");
        await scenario.RequestCreatorClient.PostAsync(
            $"/api/requests/{scenario.Request.Id}/cancel",
            null);

        await AddCommonsAndUserAsync(application, OtherCommonsId, "Other Commons", "user-3");
        var otherCommonsClient = CreateAuthenticatedClient(application, "user-3");
        await JoinParticipantAsync(otherCommonsClient, OtherCommonsId, "Carol");
        var otherCommonsRequest = await CreateRequestAsync(otherCommonsClient, "Carol's need");

        foreach (var requestId in new[]
                 {
                     ownRequest.Id,
                     scenario.Request.Id,
                     otherCommonsRequest.Id,
                     Guid.NewGuid()
                 })
        {
            var response = await scenario.OfferCreatorClient.PostAsJsonAsync(
                $"/api/requests/{requestId}/offers",
                new SubmitOfferRequest(10, []));

            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }
    }

    [Fact]
    public async Task Offer_options_and_detail_reads_enforce_available_request_and_creator_scope()
    {
        await using var application = new CommonsApiApplication();
        var scenario = await CreateScenarioAsync(application, "Eggs", "Transport");
        var options = await scenario.OfferCreatorClient.GetFromJsonAsync<OfferSubmissionOptions>(
            $"/api/requests/browse/{scenario.Request.Id}/offer-options");
        var createResponse = await scenario.OfferCreatorClient.PostAsJsonAsync(
            $"/api/requests/{scenario.Request.Id}/offers",
            new SubmitOfferRequest(10, []));
        var offer = await createResponse.Content.ReadFromJsonAsync<OfferDetails>();

        var requesterRead = await scenario.RequestCreatorClient.GetAsync(
            $"/api/offers/{offer!.Id}");
        var forgedRead = await scenario.OfferCreatorClient.GetAsync(
            $"/api/offers/{Guid.NewGuid()}");
        var ownOptions = await scenario.RequestCreatorClient.GetAsync(
            $"/api/requests/browse/{scenario.Request.Id}/offer-options");

        options!.Request.Id.Should().Be(scenario.Request.Id);
        options.Capabilities.Select(capability => capability.Text)
            .Should().BeEquivalentTo("Eggs", "Transport");
        requesterRead.StatusCode.Should().Be(HttpStatusCode.NotFound);
        forgedRead.StatusCode.Should().Be(HttpStatusCode.NotFound);
        ownOptions.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Offer_submission_options_and_reads_require_authentication_and_participation()
    {
        await using var application = new CommonsApiApplication();
        var anonymousClient = await application.CreateSeededClientAsync();
        var participantlessClient = CreateAuthenticatedClient(application, "user-1");
        var participantClient = CreateAuthenticatedClient(application, "user-2");
        await JoinParticipantAsync(
            participantClient,
            CommonsApiApplication.HomeCommonsId,
            "Bob");
        var request = await CreateRequestAsync(participantClient, "Bob's need");
        var offerId = Guid.NewGuid();

        var anonymousOptions = await anonymousClient.GetAsync(
            $"/api/requests/browse/{request.Id}/offer-options");
        var anonymousSubmit = await anonymousClient.PostAsJsonAsync(
            $"/api/requests/{request.Id}/offers",
            new SubmitOfferRequest(10, []));
        var anonymousRead = await anonymousClient.GetAsync($"/api/offers/{offerId}");
        var participantlessOptions = await participantlessClient.GetAsync(
            $"/api/requests/browse/{request.Id}/offer-options");
        var participantlessSubmit = await participantlessClient.PostAsJsonAsync(
            $"/api/requests/{request.Id}/offers",
            new SubmitOfferRequest(10, []));

        anonymousOptions.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        anonymousSubmit.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        anonymousRead.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        participantlessOptions.StatusCode.Should().Be(HttpStatusCode.NotFound);
        participantlessSubmit.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private static async Task<OfferScenario> CreateScenarioAsync(
        CommonsApiApplication application,
        params string[] capabilities)
    {
        var requestCreatorClient = await application.CreateSeededClientAsync("user-1");
        await JoinParticipantAsync(
            requestCreatorClient,
            CommonsApiApplication.HomeCommonsId,
            "Alice");
        var capabilitySummaries = new List<CapabilitySummary>();

        foreach (var capability in capabilities)
        {
            capabilitySummaries.Add(await AddCapabilityAsync(requestCreatorClient, capability));
        }

        var request = await CreateRequestAsync(requestCreatorClient, "Alice's need");
        var offerCreatorClient = CreateAuthenticatedClient(application, "user-2");
        await JoinParticipantAsync(
            offerCreatorClient,
            CommonsApiApplication.HomeCommonsId,
            "Bob");

        return new OfferScenario(
            requestCreatorClient,
            offerCreatorClient,
            request,
            capabilitySummaries);
    }

    private static HttpClient CreateAuthenticatedClient(
        CommonsApiApplication application,
        string userId)
    {
        var client = application.CreateClient();
        client.DefaultRequestHeaders.Add(TestAuthenticationHandler.UserHeader, userId);
        return client;
    }

    private static async Task AddCommonsAndUserAsync(
        CommonsApiApplication application,
        Guid commonsId,
        string commonsName,
        string userId)
    {
        await using var scope = application.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CommonsDbContext>();
        dbContext.Commons.Add(new CommonsEntity(commonsId, commonsName));
        dbContext.Users.Add(new IdentityUser { Id = userId, UserName = userId });
        await dbContext.SaveChangesAsync();
    }

    private static async Task JoinParticipantAsync(
        HttpClient client,
        Guid homeCommonsId,
        string displayName)
    {
        var response = await client.PostAsJsonAsync(
            "/api/participants/me",
            new JoinParticipantRequest(homeCommonsId, displayName, null));
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
            new CreateRequestRequest(title, "Original description"));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<RequestDetails>())!;
    }

    private sealed record OfferScenario(
        HttpClient RequestCreatorClient,
        HttpClient OfferCreatorClient,
        RequestDetails Request,
        IReadOnlyList<CapabilitySummary> Capabilities);
}
