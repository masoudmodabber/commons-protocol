using System.Net;
using System.Net.Http.Json;
using Commons.Api.Participants;
using Commons.Domain.Participants;
using Commons.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Commons.Api.Tests.Participants;

public sealed class ManageCapabilitiesTests
{
    [Fact]
    public async Task Participant_can_add_view_and_remove_capabilities()
    {
        await using var application = new CommonsApiApplication();
        var client = await application.CreateSeededClientAsync("user-1");
        await JoinParticipantAsync(client);

        var carpentryResponse = await client.PostAsJsonAsync(
            "/api/participants/me/capabilities",
            new AddCapabilityRequest("  Carpentry  "));
        var gardeningResponse = await client.PostAsJsonAsync(
            "/api/participants/me/capabilities",
            new AddCapabilityRequest("Gardening"));
        var carpentry = await carpentryResponse.Content.ReadFromJsonAsync<CapabilitySummary>();
        var capabilities = await client.GetFromJsonAsync<List<CapabilitySummary>>(
            "/api/participants/me/capabilities");
        var profile = await client.GetFromJsonAsync<ParticipantProfile>("/api/participants/me");

        carpentryResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        gardeningResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        carpentry!.Text.Should().Be("Carpentry");
        capabilities.Should().HaveCount(2)
            .And.Contain(capability => capability.Text == "Carpentry")
            .And.Contain(capability => capability.Text == "Gardening");
        profile!.Capabilities.Should().BeEquivalentTo(capabilities);

        var removeResponse = await client.DeleteAsync(
            $"/api/participants/me/capabilities/{carpentry.Id}");
        var remaining = await client.GetFromJsonAsync<List<CapabilitySummary>>(
            "/api/participants/me/capabilities");

        removeResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);
        remaining.Should().ContainSingle()
            .Which.Text.Should().Be("Gardening");
    }

    [Fact]
    public async Task Participant_cannot_add_empty_or_case_insensitive_duplicate_capability()
    {
        await using var application = new CommonsApiApplication();
        var client = await application.CreateSeededClientAsync("user-1");
        await JoinParticipantAsync(client);

        var firstResponse = await client.PostAsJsonAsync(
            "/api/participants/me/capabilities",
            new AddCapabilityRequest("Carpentry"));
        var duplicateResponse = await client.PostAsJsonAsync(
            "/api/participants/me/capabilities",
            new AddCapabilityRequest("  cArPeNtRy  "));
        var emptyResponse = await client.PostAsJsonAsync(
            "/api/participants/me/capabilities",
            new AddCapabilityRequest(" \t "));

        firstResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        duplicateResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);
        emptyResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        await using var scope = application.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CommonsDbContext>();
        (await dbContext.Capabilities.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task Participant_cannot_remove_another_participants_capability()
    {
        await using var application = new CommonsApiApplication();
        var firstClient = await application.CreateSeededClientAsync("user-1");
        await JoinParticipantAsync(firstClient);
        var addResponse = await firstClient.PostAsJsonAsync(
            "/api/participants/me/capabilities",
            new AddCapabilityRequest("Carpentry"));
        var capability = await addResponse.Content.ReadFromJsonAsync<CapabilitySummary>();

        var secondClient = application.CreateClient();
        secondClient.DefaultRequestHeaders.Add(TestAuthenticationHandler.UserHeader, "user-2");
        await JoinParticipantAsync(secondClient);

        var response = await secondClient.DeleteAsync(
            $"/api/participants/me/capabilities/{capability!.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await firstClient.GetFromJsonAsync<List<CapabilitySummary>>(
            "/api/participants/me/capabilities")).Should().ContainSingle();
    }

    [Fact]
    public async Task Capability_management_requires_authentication_and_participation()
    {
        await using var application = new CommonsApiApplication();
        var anonymousClient = await application.CreateSeededClientAsync();
        var participantlessClient = application.CreateClient();
        participantlessClient.DefaultRequestHeaders.Add(TestAuthenticationHandler.UserHeader, "user-1");

        var anonymousResponse = await anonymousClient.GetAsync("/api/participants/me/capabilities");
        var participantlessResponse = await participantlessClient.PostAsJsonAsync(
            "/api/participants/me/capabilities",
            new AddCapabilityRequest("Carpentry"));

        anonymousResponse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        participantlessResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private static async Task JoinParticipantAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync(
            "/api/participants/me",
            new JoinParticipantRequest(CommonsApiApplication.HomeCommonsId, "Alice", null));

        response.EnsureSuccessStatusCode();
    }
}
