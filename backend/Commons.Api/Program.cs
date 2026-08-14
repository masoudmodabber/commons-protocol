using Commons.Api.Participants;
using Commons.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddHealthChecks();
builder.Services.AddAuthorization();
builder.Services.AddAuthentication();
builder.Services.AddIdentityApiEndpoints<IdentityUser>()
    .AddEntityFrameworkStores<CommonsDbContext>();
if (!builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddDbContext<CommonsDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("Commons")));
}
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<ParticipantApplicationService>();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");
app.MapGroup("/api/auth").MapIdentityApi<IdentityUser>();

await using (var scope = app.Services.CreateAsyncScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<CommonsDbContext>();
    await dbContext.Database.EnsureCreatedAsync();
}

app.Run();

public partial class Program;
