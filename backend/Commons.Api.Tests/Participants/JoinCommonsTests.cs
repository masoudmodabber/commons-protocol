using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Commons.Api.Participants;
using Commons.Domain.Participants;
using Commons.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using CommonsEntity = Commons.Domain.Participants.Commons;

namespace Commons.Api.Tests.Participants;

public sealed class JoinCommonsTests
{
    [Fact]
    public async Task Joining_requires_authentication()
    {
        await using var application = new CommonsApiApplication();
        var client = await application.CreateSeededClientAsync();

        var response = await client.PostAsJsonAsync(
            "/api/participants/me",
            new JoinParticipantRequest(CommonsApiApplication.HomeCommonsId, "Alice", null));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Authenticated_user_can_list_existing_commons_join_and_view_profile()
    {
        await using var application = new CommonsApiApplication();
        var client = await application.CreateSeededClientAsync("user-1");

        var commons = await client.GetFromJsonAsync<List<CommonsSummary>>("/api/commons");
        var joinResponse = await client.PostAsJsonAsync(
            "/api/participants/me",
            new JoinParticipantRequest(
                CommonsApiApplication.HomeCommonsId,
                " Alice ",
                " Neighbourhood gardener "));
        var profile = await client.GetFromJsonAsync<ParticipantProfile>("/api/participants/me");

        commons.Should().ContainSingle().Which.Id.Should().Be(CommonsApiApplication.HomeCommonsId);
        joinResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        profile.Should().NotBeNull();
        profile!.DisplayName.Should().Be("Alice");
        profile.Bio.Should().Be("Neighbourhood gardener");
        profile.HomeCommons.Id.Should().Be(CommonsApiApplication.HomeCommonsId);

        await using var scope = application.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CommonsDbContext>();
        (await dbContext.Participants.CountAsync()).Should().Be(1);
        (await dbContext.Set<Profile>().CountAsync()).Should().Be(1);
        (await dbContext.Set<Membership>().CountAsync()).Should().Be(1);
        (await dbContext.Participants
                .Include(participant => participant.Membership)
                .SingleAsync())
            .Membership.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task One_authenticated_user_cannot_create_two_participant_identities()
    {
        await using var application = new CommonsApiApplication();
        var client = await application.CreateSeededClientAsync("user-1");
        var request = new JoinParticipantRequest(
            CommonsApiApplication.HomeCommonsId,
            "Alice",
            null);

        var firstResponse = await client.PostAsJsonAsync("/api/participants/me", request);
        var secondResponse = await client.PostAsJsonAsync("/api/participants/me", request);

        firstResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        secondResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);

        await using var scope = application.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CommonsDbContext>();
        (await dbContext.Participants.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task User_cannot_join_a_commons_that_does_not_exist()
    {
        await using var application = new CommonsApiApplication();
        var client = await application.CreateSeededClientAsync("user-1");

        var response = await client.PostAsJsonAsync(
            "/api/participants/me",
            new JoinParticipantRequest(Guid.NewGuid(), "Alice", null));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        await using var scope = application.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CommonsDbContext>();
        (await dbContext.Participants.CountAsync()).Should().Be(0);
        (await dbContext.Set<Profile>().CountAsync()).Should().Be(0);
        (await dbContext.Set<Membership>().CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task User_cannot_join_without_a_display_name()
    {
        await using var application = new CommonsApiApplication();
        var client = await application.CreateSeededClientAsync("user-1");

        var response = await client.PostAsJsonAsync(
            "/api/participants/me",
            new JoinParticipantRequest(CommonsApiApplication.HomeCommonsId, " ", null));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}

internal sealed class CommonsApiApplication : WebApplicationFactory<Program>
{
    public static readonly Guid HomeCommonsId = Guid.Parse("8c509b30-86bb-4530-86a5-aa8c09720582");
    private readonly string databaseName = Guid.NewGuid().ToString();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<CommonsDbContext>>();
            services.RemoveAll<CommonsDbContext>();
            services.RemoveAll<IDatabaseProvider>();
            services.AddDbContext<CommonsDbContext>(options =>
                options.UseInMemoryDatabase(databaseName));

            services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = TestAuthenticationHandler.SchemeName;
                    options.DefaultChallengeScheme = TestAuthenticationHandler.SchemeName;
                })
                .AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>(
                    TestAuthenticationHandler.SchemeName,
                    _ => { });
        });
    }

    public async Task<HttpClient> CreateSeededClientAsync(string? userId = null)
    {
        var client = CreateClient();

        await using var scope = Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CommonsDbContext>();
        dbContext.Commons.Add(new CommonsEntity(HomeCommonsId, "Test Commons"));
        dbContext.Users.AddRange(
            new IdentityUser { Id = "user-1", UserName = "user-1" },
            new IdentityUser { Id = "user-2", UserName = "user-2" });
        await dbContext.SaveChangesAsync();

        if (userId is not null)
        {
            client.DefaultRequestHeaders.Add(TestAuthenticationHandler.UserHeader, userId);
        }

        return client;
    }
}

internal sealed class TestAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "Test";
    public const string UserHeader = "X-Test-User";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue(UserHeader, out var userId))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var identity = new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, userId.ToString())],
            SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
