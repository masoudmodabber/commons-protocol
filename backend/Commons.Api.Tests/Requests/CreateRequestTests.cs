using System.Net;
using System.Net.Http.Json;
using Commons.Api.Participants;
using Commons.Api.Requests;
using Commons.Api.Tests.Participants;
using Commons.Domain.Participants;
using Commons.Domain.Requests;
using Commons.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Commons.Api.Tests.Requests;

public sealed class CreateRequestTests
{
    [Fact]
    public async Task Participant_can_create_and_view_open_request_in_home_commons()
    {
        await using var application = new CommonsApiApplication();
        var client = await application.CreateSeededClientAsync("user-1");
        await JoinParticipantAsync(client, "Alice");

        var response = await client.PostAsJsonAsync(
            "/api/requests",
            new CreateRequestRequest(
                "  Help repairing a fence  ",
                "  One garden fence panel needs replacing.  "));
        var created = await response.Content.ReadFromJsonAsync<RequestDetails>();
        var viewed = await client.GetFromJsonAsync<RequestDetails>(
            $"/api/requests/{created!.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        response.Headers.Location.Should().Be($"http://localhost/api/requests/{created.Id}");
        viewed.Should().BeEquivalentTo(created);
        created.Title.Should().Be("Help repairing a fence");
        created.Description.Should().Be("One garden fence panel needs replacing.");
        created.Status.Should().Be(nameof(RequestStatus.Open));
        created.Creator.DisplayName.Should().Be("Alice");
        created.HomeCommons.Id.Should().Be(CommonsApiApplication.HomeCommonsId);
        created.HomeCommons.Name.Should().Be("Test Commons");

        await using var scope = application.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CommonsDbContext>();
        var persisted = await dbContext.Requests.SingleAsync();
        persisted.CreatorParticipantId.Should().Be(created.Creator.ParticipantId);
        persisted.HomeCommonsId.Should().Be(CommonsApiApplication.HomeCommonsId);
        (await dbContext.Participants.CountAsync()).Should().Be(1);
        (await dbContext.Set<Membership>().CountAsync()).Should().Be(1);
        (await dbContext.Capabilities.CountAsync()).Should().Be(0);
    }

    [Theory]
    [InlineData(" ", "A description")]
    [InlineData("A title", "\t")]
    public async Task Request_rejects_missing_title_or_description(string title, string description)
    {
        await using var application = new CommonsApiApplication();
        var client = await application.CreateSeededClientAsync("user-1");
        await JoinParticipantAsync(client, "Alice");

        var response = await client.PostAsJsonAsync(
            "/api/requests",
            new CreateRequestRequest(title, description));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        await using var scope = application.Services.CreateAsyncScope();
        (await scope.ServiceProvider.GetRequiredService<CommonsDbContext>()
            .Requests.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Request_creation_requires_authentication_and_participation()
    {
        await using var application = new CommonsApiApplication();
        var anonymousClient = await application.CreateSeededClientAsync();
        var participantlessClient = application.CreateClient();
        participantlessClient.DefaultRequestHeaders.Add(TestAuthenticationHandler.UserHeader, "user-1");
        var request = new CreateRequestRequest("A title", "A description");

        var anonymousResponse = await anonymousClient.PostAsJsonAsync("/api/requests", request);
        var participantlessResponse = await participantlessClient.PostAsJsonAsync(
            "/api/requests",
            request);

        anonymousResponse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        participantlessResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Participant_cannot_view_another_participants_request()
    {
        await using var application = new CommonsApiApplication();
        var firstClient = await application.CreateSeededClientAsync("user-1");
        await JoinParticipantAsync(firstClient, "Alice");
        var createResponse = await firstClient.PostAsJsonAsync(
            "/api/requests",
            new CreateRequestRequest("A title", "A description"));
        var request = await createResponse.Content.ReadFromJsonAsync<RequestDetails>();

        var secondClient = application.CreateClient();
        secondClient.DefaultRequestHeaders.Add(TestAuthenticationHandler.UserHeader, "user-2");
        await JoinParticipantAsync(secondClient, "Bob");

        var response = await secondClient.GetAsync($"/api/requests/{request!.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private static async Task JoinParticipantAsync(HttpClient client, string displayName)
    {
        var response = await client.PostAsJsonAsync(
            "/api/participants/me",
            new JoinParticipantRequest(CommonsApiApplication.HomeCommonsId, displayName, null));

        response.EnsureSuccessStatusCode();
    }
}
