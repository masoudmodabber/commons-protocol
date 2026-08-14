using Commons.Domain.Offers;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Commons.Infrastructure.Persistence.Configurations;

internal sealed class RequestedContributionConfiguration
    : IEntityTypeConfiguration<RequestedContribution>
{
    public void Configure(EntityTypeBuilder<RequestedContribution> builder)
    {
        builder.ToTable("OfferRequestedContributions");
        builder.HasKey(contribution => contribution.Id);
        builder.Property(contribution => contribution.CapabilityTextSnapshot).IsRequired();
        builder.Property(contribution => contribution.Description).IsRequired();

        builder.HasIndex(contribution => new
        {
            contribution.OfferId,
            contribution.CapabilityId
        })
            .IsUnique();
    }
}
