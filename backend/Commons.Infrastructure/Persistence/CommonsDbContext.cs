using Commons.Domain.Participants;
using Commons.Domain.Requests;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using CommonsEntity = Commons.Domain.Participants.Commons;

namespace Commons.Infrastructure.Persistence;

public sealed class CommonsDbContext(DbContextOptions<CommonsDbContext> options)
    : IdentityDbContext<IdentityUser>(options)
{
    public DbSet<Participant> Participants => Set<Participant>();

    public DbSet<Capability> Capabilities => Set<Capability>();

    public DbSet<Request> Requests => Set<Request>();

    public DbSet<CommonsEntity> Commons => Set<CommonsEntity>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(CommonsDbContext).Assembly);
    }
}
