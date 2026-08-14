using Commons.Domain.Participants;
using Commons.Domain.Requests;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CommonsEntity = Commons.Domain.Participants.Commons;

namespace Commons.Infrastructure.Persistence.Configurations;

internal sealed class RequestConfiguration : IEntityTypeConfiguration<Request>
{
    public void Configure(EntityTypeBuilder<Request> builder)
    {
        builder.ToTable("Requests");
        builder.HasKey(request => request.Id);

        builder.Property(request => request.Title).IsRequired();
        builder.Property(request => request.Description).IsRequired();
        builder.Property(request => request.Status)
            .HasConversion<string>()
            .IsRequired();

        builder.HasOne<Participant>()
            .WithMany()
            .HasForeignKey(request => request.CreatorParticipantId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommonsEntity>()
            .WithMany()
            .HasForeignKey(request => request.HomeCommonsId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict);
    }
}
