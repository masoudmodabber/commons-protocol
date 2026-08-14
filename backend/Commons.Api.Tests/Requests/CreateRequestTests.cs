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

    [Fact]
    public async Task Creator_can_edit_open_request_and_view_updated_details()
    {
        await using var application = new CommonsApiApplication();
        var client = await application.CreateSeededClientAsync("user-1");
        await JoinParticipantAsync(client, "Alice");
        var original = await CreateRequestAsync(client);
        var originalCreator = original.Creator;
        var originalCommons = original.HomeCommons;

        var response = await client.PutAsJsonAsync(
            $"/api/requests/{original.Id}",
            new EditRequestRequest(
                "  Corrected fence repair  ",
                "  Two garden fence panels need replacing.  "));
        var updated = await response.Content.ReadFromJsonAsync<RequestDetails>();
        var viewed = await client.GetFromJsonAsync<RequestDetails>(
            $"/api/requests/{original.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        updated!.Title.Should().Be("Corrected fence repair");
        updated.Description.Should().Be("Two garden fence panels need replacing.");
        updated.Creator.Should().Be(originalCreator);
        updated.HomeCommons.Should().Be(originalCommons);
        updated.Status.Should().Be(nameof(RequestStatus.Open));
        viewed.Should().BeEquivalentTo(updated);

        await using var scope = application.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CommonsDbContext>();
        (await dbContext.Requests.CountAsync()).Should().Be(1);
        (await dbContext.Participants.CountAsync()).Should().Be(1);
        (await dbContext.Set<Membership>().CountAsync()).Should().Be(1);
        (await dbContext.Capabilities.CountAsync()).Should().Be(0);
    }

    [Theory]
    [InlineData(" ", "A description")]
    [InlineData("A title", "\t")]
    public async Task Edit_rejects_missing_title_or_description(string title, string description)
    {
        await using var application = new CommonsApiApplication();
        var client = await application.CreateSeededClientAsync("user-1");
        await JoinParticipantAsync(client, "Alice");
        var original = await CreateRequestAsync(client);

        var response = await client.PutAsJsonAsync(
            $"/api/requests/{original.Id}",
            new EditRequestRequest(title, description));
        var viewed = await client.GetFromJsonAsync<RequestDetails>(
            $"/api/requests/{original.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        viewed!.Title.Should().Be(original.Title);
        viewed.Description.Should().Be(original.Description);
    }

    [Fact]
    public async Task Participant_cannot_edit_another_participants_request()
    {
        await using var application = new CommonsApiApplication();
        var firstClient = await application.CreateSeededClientAsync("user-1");
        await JoinParticipantAsync(firstClient, "Alice");
        var original = await CreateRequestAsync(firstClient);

        var secondClient = application.CreateClient();
        secondClient.DefaultRequestHeaders.Add(TestAuthenticationHandler.UserHeader, "user-2");
        await JoinParticipantAsync(secondClient, "Bob");

        var response = await secondClient.PutAsJsonAsync(
            $"/api/requests/{original.Id}",
            new EditRequestRequest("Changed title", "Changed description"));
        var viewed = await firstClient.GetFromJsonAsync<RequestDetails>(
            $"/api/requests/{original.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        viewed!.Title.Should().Be(original.Title);
        viewed.Description.Should().Be(original.Description);
    }

    [Fact]
    public async Task Request_that_is_not_open_cannot_be_edited()
    {
        await using var application = new CommonsApiApplication();
        var client = await application.CreateSeededClientAsync("user-1");
        await JoinParticipantAsync(client, "Alice");
        var original = await CreateRequestAsync(client);

        await using (var scope = application.Services.CreateAsyncScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<CommonsDbContext>();
            var request = await dbContext.Requests.SingleAsync(existing => existing.Id == original.Id);
            dbContext.Entry(request).Property(existing => existing.Status).CurrentValue =
                RequestStatus.Cancelled;
            await dbContext.SaveChangesAsync();
        }

        var response = await client.PutAsJsonAsync(
            $"/api/requests/{original.Id}",
            new EditRequestRequest("Changed title", "Changed description"));
        var viewed = await client.GetFromJsonAsync<RequestDetails>(
            $"/api/requests/{original.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        viewed!.Title.Should().Be(original.Title);
        viewed.Description.Should().Be(original.Description);
        viewed.Status.Should().Be(nameof(RequestStatus.Cancelled));
    }

    [Fact]
    public async Task Editing_requires_authentication()
    {
        await using var application = new CommonsApiApplication();
        var anonymousClient = await application.CreateSeededClientAsync();

        var response = await anonymousClient.PutAsJsonAsync(
            $"/api/requests/{Guid.NewGuid()}",
            new EditRequestRequest("A title", "A description"));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    private static async Task<RequestDetails> CreateRequestAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync(
            "/api/requests",
            new CreateRequestRequest("Original title", "Original description"));
        response.EnsureSuccessStatusCode();

        return (await response.Content.ReadFromJsonAsync<RequestDetails>())!;
    }

    private static async Task JoinParticipantAsync(HttpClient client, string displayName)
    {
        var response = await client.PostAsJsonAsync(
            "/api/participants/me",
            new JoinParticipantRequest(CommonsApiApplication.HomeCommonsId, displayName, null));

        response.EnsureSuccessStatusCode();
    }
}
