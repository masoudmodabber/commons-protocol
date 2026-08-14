using Commons.Domain.Participants;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CommonsEntity = Commons.Domain.Participants.Commons;

namespace Commons.Infrastructure.Persistence.Configurations;

internal sealed class CommonsConfiguration : IEntityTypeConfiguration<CommonsEntity>
{
    public void Configure(EntityTypeBuilder<CommonsEntity> builder)
    {
        builder.ToTable("Commons");
        builder.HasKey(commons => commons.Id);
        builder.Property(commons => commons.Name).IsRequired();
    }
}
