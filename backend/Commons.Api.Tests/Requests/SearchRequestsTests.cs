using System.Net;
using System.Net.Http.Json;
using Commons.Api.Participants;
using Commons.Api.Requests;
using Commons.Api.Tests.Participants;
using Commons.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using CommonsEntity = Commons.Domain.Participants.Commons;

namespace Commons.Api.Tests.Requests;

public sealed class SearchRequestsTests
{
    private static readonly Guid OtherCommonsId =
        Guid.Parse("713d793a-8f09-4b66-ab92-f32774836d48");

    [Fact]
    public async Task Search_matches_trimmed_case_insensitive_title_substring_without_expanding_visibility()
    {
        await using var application = new CommonsApiApplication();
        var aliceClient = await application.CreateSeededClientAsync("user-1");
        await JoinParticipantAsync(aliceClient, CommonsApiApplication.HomeCommonsId, "Alice");
        var ownRequest = await CreateRequestAsync(
            aliceClient,
            "Alice needs GARDEN help",
            "Owned Request");

        var bobClient = CreateAuthenticatedClient(application, "user-2");
        await JoinParticipantAsync(bobClient, CommonsApiApplication.HomeCommonsId, "Bob");
        var matchingRequest = await CreateRequestAsync(
            bobClient,
            "Community GARDEN tools",
            "Tools needed for the working bee");
        var cancelledRequest = await CreateRequestAsync(
            bobClient,
            "Garden cleanup",
            "This Request is cancelled");
        await bobClient.PostAsync($"/api/requests/{cancelledRequest.Id}/cancel", null);

        await AddCommonsAndUserAsync(application, OtherCommonsId, "Other Commons", "user-3");
        var carolClient = CreateAuthenticatedClient(application, "user-3");
        await JoinParticipantAsync(carolClient, OtherCommonsId, "Carol");
        var otherCommonsRequest = await CreateRequestAsync(
            carolClient,
            "Garden soil",
            "Available in another Commons");

        var response = await aliceClient.GetAsync(
            $"/api/requests/browse?search={Uri.EscapeDataString("  gArDeN  ")}&commonsId={OtherCommonsId}");
        var results = await response.Content.ReadFromJsonAsync<List<RequestDetails>>();
        var detailResponse = await aliceClient.GetAsync(
            $"/api/requests/browse/{matchingRequest.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        results.Should().ContainSingle().Which.Id.Should().Be(matchingRequest.Id);
        results.Should().NotContain(request => request.Id == ownRequest.Id);
        results.Should().NotContain(request => request.Id == cancelledRequest.Id);
        results.Should().NotContain(request => request.Id == otherCommonsRequest.Id);
        detailResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        await using var scope = application.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CommonsDbContext>();
        (await dbContext.Requests.CountAsync()).Should().Be(4);
        (await dbContext.Participants.CountAsync()).Should().Be(3);
    }

    [Fact]
    public async Task Search_matches_description_substring()
    {
        await using var application = new CommonsApiApplication();
        var aliceClient = await application.CreateSeededClientAsync("user-1");
        await JoinParticipantAsync(aliceClient, CommonsApiApplication.HomeCommonsId, "Alice");
        var bobClient = CreateAuthenticatedClient(application, "user-2");
        await JoinParticipantAsync(bobClient, CommonsApiApplication.HomeCommonsId, "Bob");
        var matchingRequest = await CreateRequestAsync(
            bobClient,
            "Borrow a pump",
            "Needed for a BICYCLE tyre");
        await CreateRequestAsync(
            bobClient,
            "Borrow a trailer",
            "Needed for moving compost");

        var results = await aliceClient.GetFromJsonAsync<List<RequestDetails>>(
            "/api/requests/browse?search=cycle");

        results.Should().ContainSingle().Which.Id.Should().Be(matchingRequest.Id);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Empty_or_whitespace_search_returns_normal_available_requests(string searchTerm)
    {
        await using var application = new CommonsApiApplication();
        var aliceClient = await application.CreateSeededClientAsync("user-1");
        await JoinParticipantAsync(aliceClient, CommonsApiApplication.HomeCommonsId, "Alice");
        await CreateRequestAsync(aliceClient, "Owned Request", "Not available");
        var bobClient = CreateAuthenticatedClient(application, "user-2");
        await JoinParticipantAsync(bobClient, CommonsApiApplication.HomeCommonsId, "Bob");
        var firstRequest = await CreateRequestAsync(bobClient, "First need", "Description one");
        var secondRequest = await CreateRequestAsync(bobClient, "Second need", "Description two");

        var results = await aliceClient.GetFromJsonAsync<List<RequestDetails>>(
            $"/api/requests/browse?search={Uri.EscapeDataString(searchTerm)}");

        results!.Select(request => request.Id).Should().BeEquivalentTo(
            new[] { firstRequest.Id, secondRequest.Id });
    }

    [Fact]
    public async Task Search_requires_authentication_and_participation()
    {
        await using var application = new CommonsApiApplication();
        var anonymousClient = await application.CreateSeededClientAsync();
        var participantlessClient = CreateAuthenticatedClient(application, "user-1");

        var anonymousResponse = await anonymousClient.GetAsync(
            "/api/requests/browse?search=garden");
        var participantlessResponse = await participantlessClient.GetAsync(
            "/api/requests/browse?search=garden");

        anonymousResponse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        participantlessResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
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
        string title,
        string description)
    {
        var response = await client.PostAsJsonAsync(
            "/api/requests",
            new CreateRequestRequest(title, description));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<RequestDetails>())!;
    }
}
