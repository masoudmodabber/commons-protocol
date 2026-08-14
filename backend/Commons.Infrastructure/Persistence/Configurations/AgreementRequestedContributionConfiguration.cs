using Commons.Domain.Agreements;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Commons.Infrastructure.Persistence.Configurations;

internal sealed class AgreementRequestedContributionConfiguration
    : IEntityTypeConfiguration<AgreementRequestedContribution>
{
    public void Configure(EntityTypeBuilder<AgreementRequestedContribution> builder)
    {
        builder.ToTable("AgreementRequestedContributions");
        builder.HasKey(contribution => contribution.Id);
        builder.Property(contribution => contribution.CapabilityTextSnapshot).IsRequired();
        builder.Property(contribution => contribution.Description).IsRequired();

        builder.HasIndex(contribution => new
        {
            contribution.AgreementId,
            contribution.CapabilityId
        }).IsUnique();
    }
}
