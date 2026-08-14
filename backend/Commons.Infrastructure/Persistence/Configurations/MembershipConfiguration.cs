using Commons.Domain.Participants;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Commons.Infrastructure.Persistence.Configurations;

internal sealed class MembershipConfiguration : IEntityTypeConfiguration<Membership>
{
    public void Configure(EntityTypeBuilder<Membership> builder)
    {
        builder.ToTable("Memberships");
        builder.HasKey(membership => membership.Id);
        builder.Ignore(membership => membership.IsActive);

        builder.HasOne(membership => membership.HomeCommons)
            .WithMany()
            .HasForeignKey(membership => membership.HomeCommonsId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict);
    }
}
