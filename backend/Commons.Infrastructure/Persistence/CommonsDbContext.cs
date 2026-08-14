using Commons.Domain.Agreements;
using Commons.Domain.Participants;
using Commons.Domain.Requests;
using Commons.Domain.Offers;
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

    public DbSet<Offer> Offers => Set<Offer>();

    public DbSet<RequestedContribution> RequestedContributions => Set<RequestedContribution>();

    public DbSet<Agreement> Agreements => Set<Agreement>();

    public DbSet<AgreementRequestedContribution> AgreementRequestedContributions =>
        Set<AgreementRequestedContribution>();

    public DbSet<CommonsEntity> Commons => Set<CommonsEntity>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(CommonsDbContext).Assembly);
    }
}
