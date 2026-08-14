using System.Net;
using System.Net.Http.Json;
using Commons.Api.Participants;
using Commons.Api.Requests;
using Commons.Api.Tests.Participants;
using Commons.Domain.Participants;
using Commons.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using CommonsEntity = Commons.Domain.Participants.Commons;

namespace Commons.Api.Tests.Requests;

public sealed class BrowseRequestsTests
{
    private static readonly Guid OtherCommonsId =
        Guid.Parse("dc66ee37-8646-4afd-9014-768fb75c8753");

    [Fact]
    public async Task Participant_browses_only_other_participants_open_requests_in_home_commons()
    {
        await using var application = new CommonsApiApplication();
        var aliceClient = await application.CreateSeededClientAsync("user-1");
        await JoinParticipantAsync(aliceClient, CommonsApiApplication.HomeCommonsId, "Alice");
        var aliceRequest = await CreateRequestAsync(aliceClient, "Alice needs seedlings");

        var bobClient = CreateAuthenticatedClient(application, "user-2");
        await JoinParticipantAsync(bobClient, CommonsApiApplication.HomeCommonsId, "Bob");
        var bobOpenRequest = await CreateRequestAsync(bobClient, "Bob needs a ladder");
        var bobCancelledRequest = await CreateRequestAsync(bobClient, "Bob needs boxes");
        await bobClient.PostAsync($"/api/requests/{bobCancelledRequest.Id}/cancel", null);

        await AddCommonsAndUserAsync(application, OtherCommonsId, "Other Commons", "user-3");
        var carolClient = CreateAuthenticatedClient(application, "user-3");
        await JoinParticipantAsync(carolClient, OtherCommonsId, "Carol");
        var otherCommonsRequest = await CreateRequestAsync(carolClient, "Carol needs paint");

        var response = await aliceClient.GetAsync(
            $"/api/requests/browse?commonsId={OtherCommonsId}");
        var requests = await response.Content.ReadFromJsonAsync<List<RequestDetails>>();

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        requests.Should().NotBeNull();
        requests!.Select(request => request.Id).Should().BeEquivalentTo(
            new[] { bobOpenRequest.Id });
        requests.Should().Contain(request =>
            request.Id == bobOpenRequest.Id
            && request.Title == "Bob needs a ladder"
            && request.Description == "Description for Bob needs a ladder"
            && request.Creator.DisplayName == "Bob"
            && request.Status == "Open");
        requests.Should().NotContain(request => request.Id == aliceRequest.Id);
        requests.Should().NotContain(request => request.Id == bobCancelledRequest.Id);
        requests.Should().NotContain(request => request.Id == otherCommonsRequest.Id);

        await using var scope = application.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CommonsDbContext>();
        (await dbContext.Requests.CountAsync()).Should().Be(4);
        (await dbContext.Participants.CountAsync()).Should().Be(3);
        (await dbContext.Set<Membership>().CountAsync()).Should().Be(3);
        (await dbContext.Capabilities.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Participant_cannot_view_own_request_through_browse_detail()
    {
        await using var application = new CommonsApiApplication();
        var client = await application.CreateSeededClientAsync("user-1");
        await JoinParticipantAsync(client, CommonsApiApplication.HomeCommonsId, "Alice");
        var ownRequest = await CreateRequestAsync(client, "Alice needs seedlings");

        var response = await client.GetAsync($"/api/requests/browse/{ownRequest.Id}");
        var ownedResponse = await client.GetAsync($"/api/requests/{ownRequest.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        ownedResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Participant_can_view_another_participants_open_request_in_same_commons()
    {
        await using var application = new CommonsApiApplication();
        var aliceClient = await application.CreateSeededClientAsync("user-1");
        await JoinParticipantAsync(aliceClient, CommonsApiApplication.HomeCommonsId, "Alice");
        var bobClient = CreateAuthenticatedClient(application, "user-2");
        await JoinParticipantAsync(bobClient, CommonsApiApplication.HomeCommonsId, "Bob");
        var request = await CreateRequestAsync(bobClient, "Borrow a wheelbarrow");

        var response = await aliceClient.GetAsync($"/api/requests/browse/{request.Id}");
        var details = await response.Content.ReadFromJsonAsync<RequestDetails>();

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        details.Should().BeEquivalentTo(request);
        var editResponse = await aliceClient.PutAsJsonAsync(
            $"/api/requests/{request.Id}",
            new EditRequestRequest("Changed", "Changed"));
        var cancelResponse = await aliceClient.PostAsync(
            $"/api/requests/{request.Id}/cancel",
            null);
        editResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
        cancelResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Browse_detail_does_not_expose_non_open_or_other_commons_requests_by_valid_id()
    {
        await using var application = new CommonsApiApplication();
        var aliceClient = await application.CreateSeededClientAsync("user-1");
        await JoinParticipantAsync(aliceClient, CommonsApiApplication.HomeCommonsId, "Alice");
        var bobClient = CreateAuthenticatedClient(application, "user-2");
        await JoinParticipantAsync(bobClient, CommonsApiApplication.HomeCommonsId, "Bob");
        var cancelledRequest = await CreateRequestAsync(bobClient, "Cancelled need");
        await bobClient.PostAsync($"/api/requests/{cancelledRequest.Id}/cancel", null);

        await AddCommonsAndUserAsync(application, OtherCommonsId, "Other Commons", "user-3");
        var carolClient = CreateAuthenticatedClient(application, "user-3");
        await JoinParticipantAsync(carolClient, OtherCommonsId, "Carol");
        var otherCommonsRequest = await CreateRequestAsync(carolClient, "Private to other Commons");

        var cancelledResponse = await aliceClient.GetAsync(
            $"/api/requests/browse/{cancelledRequest.Id}");
        var otherCommonsResponse = await aliceClient.GetAsync(
            $"/api/requests/browse/{otherCommonsRequest.Id}?commonsId={OtherCommonsId}");

        cancelledResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
        otherCommonsResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Browse_requires_authentication_and_participation()
    {
        await using var application = new CommonsApiApplication();
        var anonymousClient = await application.CreateSeededClientAsync();
        var participantlessClient = CreateAuthenticatedClient(application, "user-1");
        var requestId = Guid.NewGuid();

        var anonymousListResponse = await anonymousClient.GetAsync("/api/requests/browse");
        var anonymousDetailResponse = await anonymousClient.GetAsync(
            $"/api/requests/browse/{requestId}");
        var participantlessListResponse = await participantlessClient.GetAsync(
            "/api/requests/browse");
        var participantlessDetailResponse = await participantlessClient.GetAsync(
            $"/api/requests/browse/{requestId}");

        anonymousListResponse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        anonymousDetailResponse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        participantlessListResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
        participantlessDetailResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
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
}
