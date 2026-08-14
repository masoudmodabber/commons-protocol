using Commons.Domain.Offers;

namespace Commons.Domain.Agreements;

public sealed class AgreementRequestedContribution
{
    private AgreementRequestedContribution()
    {
    }

    internal AgreementRequestedContribution(Guid agreementId, RequestedContribution contribution)
    {
        Id = Guid.NewGuid();
        AgreementId = agreementId;
        CapabilityId = contribution.CapabilityId;
        CapabilityTextSnapshot = contribution.CapabilityTextSnapshot;
        Description = contribution.Description;
    }

    public Guid Id { get; private set; }

    public Guid AgreementId { get; private set; }

    public Guid CapabilityId { get; private set; }

    public string CapabilityTextSnapshot { get; private set; } = string.Empty;

    public string Description { get; private set; } = string.Empty;
}
