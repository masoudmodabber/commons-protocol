using Commons.Domain.Agreements;
using Commons.Domain.Offers;
using Commons.Domain.Participants;
using Commons.Domain.Requests;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Commons.Infrastructure.Persistence.Configurations;

internal sealed class AgreementConfiguration : IEntityTypeConfiguration<Agreement>
{
    public void Configure(EntityTypeBuilder<Agreement> builder)
    {
        builder.ToTable("Agreements", table => table.HasCheckConstraint(
            "CK_Agreements_CommonsAccountingUnits_Positive",
            "\"CommonsAccountingUnits\" IS NULL OR \"CommonsAccountingUnits\" > 0"));
        builder.HasKey(agreement => agreement.Id);

        builder.HasIndex(agreement => agreement.RequestId).IsUnique();
        builder.HasIndex(agreement => agreement.AcceptedOfferId).IsUnique();

        builder.HasOne<Request>()
            .WithOne()
            .HasForeignKey<Agreement>(agreement => agreement.RequestId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Offer>()
            .WithOne()
            .HasForeignKey<Agreement>(agreement => agreement.AcceptedOfferId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Participant>()
            .WithMany()
            .HasForeignKey(agreement => agreement.RequestCreatorParticipantId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Participant>()
            .WithMany()
            .HasForeignKey(agreement => agreement.OfferCreatorParticipantId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(agreement => agreement.RequestedContributions)
            .WithOne()
            .HasForeignKey(contribution => contribution.AgreementId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(agreement => agreement.RequestedContributions)
            .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
