using Commons.Domain.Participants;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Commons.Infrastructure.Persistence.Configurations;

internal sealed class ParticipantConfiguration : IEntityTypeConfiguration<Participant>
{
    public void Configure(EntityTypeBuilder<Participant> builder)
    {
        builder.ToTable("Participants");
        builder.HasKey(participant => participant.Id);

        builder.Property(participant => participant.AuthenticatedUserId)
            .HasMaxLength(450)
            .IsRequired();

        builder.HasIndex(participant => participant.AuthenticatedUserId)
            .IsUnique();

        builder.HasOne<Microsoft.AspNetCore.Identity.IdentityUser>()
            .WithOne()
            .HasForeignKey<Participant>(participant => participant.AuthenticatedUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(participant => participant.Profile)
            .WithOne()
            .HasForeignKey<Profile>(profile => profile.ParticipantId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(participant => participant.Membership)
            .WithOne()
            .HasForeignKey<Membership>(membership => membership.ParticipantId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(participant => participant.Profile).IsRequired();
        builder.Navigation(participant => participant.Membership).IsRequired();
    }
}
