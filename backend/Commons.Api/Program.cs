using Commons.Api.Participants;
using Commons.Api.Requests;
using Commons.Infrastructure.Persistence;
using Commons.Infrastructure.Persistence.Schema;
using Commons.Infrastructure.Persistence.Seeding;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

builder.Services.AddControllers();
builder.Services.AddHealthChecks();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
{
    if (allowedOrigins.Length > 0)
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    }
}));
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
builder.Services.AddScoped<RequestApplicationService>();

var app = builder.Build();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");
app.MapGroup("/api/auth").MapIdentityApi<IdentityUser>();

await using (var scope = app.Services.CreateAsyncScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<CommonsDbContext>();
    await dbContext.Database.EnsureCreatedAsync();

    if (dbContext.Database.IsRelational())
    {
        await RelationalSchemaInitializer.InitializeAsync(dbContext);
    }

    if (app.Environment.IsDevelopment())
    {
        await DevelopmentDataSeeder.SeedAsync(dbContext);
    }
}

app.Run();

public partial class Program;
