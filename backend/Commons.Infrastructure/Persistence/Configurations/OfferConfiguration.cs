using Commons.Domain.Offers;
using Commons.Domain.Participants;
using Commons.Domain.Requests;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Commons.Infrastructure.Persistence.Configurations;

internal sealed class OfferConfiguration : IEntityTypeConfiguration<Offer>
{
    public void Configure(EntityTypeBuilder<Offer> builder)
    {
        builder.ToTable("Offers", table => table.HasCheckConstraint(
            "CK_Offers_CommonsAccountingUnits_Range",
            "\"CommonsAccountingUnits\" IS NULL OR "
            + "(\"CommonsAccountingUnits\" > 0 "
            + "AND \"CommonsAccountingUnits\" <= 9007199254740991)"));
        builder.HasKey(offer => offer.Id);
        builder.Property(offer => offer.Status)
            .HasConversion<string>()
            .IsRequired();

        builder.HasIndex(offer => offer.RequestId)
            .IsUnique()
            .HasDatabaseName("IX_Offers_RequestId_Accepted")
            .HasFilter("\"Status\" = 'Accepted'");

        builder.HasOne<Request>()
            .WithMany()
            .HasForeignKey(offer => offer.RequestId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Participant>()
            .WithMany()
            .HasForeignKey(offer => offer.CreatorParticipantId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(offer => offer.RequestedContributions)
            .WithOne()
            .HasForeignKey(contribution => contribution.OfferId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(offer => offer.RequestedContributions)
            .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
