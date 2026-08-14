using Commons.Domain.Participants;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Commons.Infrastructure.Persistence.Configurations;

internal sealed class CapabilityConfiguration : IEntityTypeConfiguration<Capability>
{
    public void Configure(EntityTypeBuilder<Capability> builder)
    {
        builder.ToTable("Capabilities");
        builder.HasKey(capability => capability.Id);
        builder.Property(capability => capability.Text).IsRequired();
        builder.Property<string>("NormalizedText").IsRequired();

        builder.HasIndex(nameof(Capability.ParticipantId), "NormalizedText")
            .IsUnique();
    }
}
