using Commons.Api.Offers;
using Commons.Api.Requests;
using Commons.Domain.Agreements;
using Commons.Domain.Offers;
using Commons.Domain.Participants;
using Commons.Domain.Requests;
using Commons.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Commons.Api.Agreements;

public sealed class AgreementApplicationService(CommonsDbContext dbContext)
{
    public async Task<AcceptOfferResult> AcceptAsync(
        string authenticatedUserId,
        Guid offerId,
        CancellationToken cancellationToken)
    {
        var participantId = await ResolveParticipantIdAsync(
            authenticatedUserId,
            cancellationToken);

        if (participantId is null)
        {
            return AcceptOfferResult.NotFound();
        }

        var requestId = await dbContext.Offers
            .AsNoTracking()
            .Where(offer => offer.Id == offerId)
            .Select(offer => (Guid?)offer.RequestId)
            .SingleOrDefaultAsync(cancellationToken);

        if (requestId is null)
        {
            return AcceptOfferResult.NotFound();
        }

        var request = await dbContext.Requests
            .SingleOrDefaultAsync(existing =>
                existing.Id == requestId.Value
                && existing.CreatorParticipantId == participantId.Value,
                cancellationToken);

        if (request is null)
        {
            return AcceptOfferResult.NotFound();
        }

        // Completeness is an application responsibility: load every persisted Offer
        // for this Request before the domain applies the lifecycle consequences.
        var offersOnRequest = await dbContext.Offers
            .Include(offer => offer.RequestedContributions)
            .Where(offer => offer.RequestId == request.Id)
            .ToListAsync(cancellationToken);
        var selectedOffer = offersOnRequest.Single(offer => offer.Id == offerId);

        Agreement agreement;

        try
        {
            agreement = request.AcceptOffer(selectedOffer, offersOnRequest);
        }
        catch (RequestNotOpenException exception)
        {
            return AcceptOfferResult.NotAvailable(exception.Message);
        }
        catch (OfferNotActiveException exception)
        {
            return AcceptOfferResult.NotAvailable(exception.Message);
        }
        catch (DomainRuleViolationException exception)
        {
            return AcceptOfferResult.NotAvailable(exception.Message);
        }

        dbContext.Agreements.Add(agreement);

        try
        {
            // One persistence operation commits the Request, all Offers, and Agreement.
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return AcceptOfferResult.NotAvailable(
                "An Offer has already been accepted for this Request.");
        }

        var details = await GetForParticipantAsync(
            authenticatedUserId,
            agreement.Id,
            cancellationToken)
            ?? throw new InvalidOperationException("The created Agreement could not be loaded.");

        return AcceptOfferResult.Accepted(details);
    }

    public async Task<AgreementDetails?> GetForParticipantAsync(
        string authenticatedUserId,
        Guid agreementId,
        CancellationToken cancellationToken)
    {
        var participantId = await ResolveParticipantIdAsync(
            authenticatedUserId,
            cancellationToken);

        if (participantId is null)
        {
            return null;
        }

        return await ProjectDetails(dbContext.Agreements
                .AsNoTracking()
                .Where(agreement =>
                    agreement.Id == agreementId
                    && (agreement.RequestCreatorParticipantId == participantId.Value
                        || agreement.OfferCreatorParticipantId == participantId.Value)))
            .SingleOrDefaultAsync(cancellationToken);
    }

    private Task<Guid?> ResolveParticipantIdAsync(
        string authenticatedUserId,
        CancellationToken cancellationToken)
    {
        return dbContext.Participants
            .AsNoTracking()
            .Where(participant => participant.AuthenticatedUserId == authenticatedUserId)
            .Select(participant => (Guid?)participant.Id)
            .SingleOrDefaultAsync(cancellationToken);
    }

    private IQueryable<AgreementDetails> ProjectDetails(IQueryable<Agreement> agreements)
    {
        return agreements.Select(agreement => new AgreementDetails(
            agreement.Id,
            dbContext.Requests
                .Where(request => request.Id == agreement.RequestId)
                .Select(request => new AgreementRequestDetails(
                    request.Id,
                    request.Title,
                    request.Description,
                    request.Status.ToString(),
                    new RequestCreatorSummary(
                        request.CreatorParticipantId,
                        dbContext.Participants
                            .Where(participant => participant.Id == request.CreatorParticipantId)
                            .Select(participant => participant.Profile.DisplayName)
                            .Single())))
                .Single(),
            dbContext.Offers
                .Where(offer => offer.Id == agreement.AcceptedOfferId)
                .Select(offer => new AgreementOfferDetails(
                    offer.Id,
                    offer.Status.ToString(),
                    new OfferCreatorSummary(
                        offer.CreatorParticipantId,
                        dbContext.Participants
                            .Where(participant => participant.Id == offer.CreatorParticipantId)
                            .Select(participant => participant.Profile.DisplayName)
                            .Single())))
                .Single(),
            agreement.CommonsAccountingUnits,
            agreement.RequestedContributions
                .OrderBy(contribution => contribution.CapabilityTextSnapshot)
                .Select(contribution => new RequestedContributionDetails(
                    contribution.CapabilityId,
                    contribution.CapabilityTextSnapshot,
                    contribution.Description))
                .ToList()));
    }
}

public sealed record AgreementDetails(
    Guid Id,
    AgreementRequestDetails Request,
    AgreementOfferDetails AcceptedOffer,
    long? CommonsAccountingUnits,
    IReadOnlyList<RequestedContributionDetails> RequestedContributions);

public sealed record AgreementRequestDetails(
    Guid Id,
    string Title,
    string Description,
    string Status,
    RequestCreatorSummary Creator);

public sealed record AgreementOfferDetails(
    Guid Id,
    string Status,
    OfferCreatorSummary Creator);

public enum AcceptOfferOutcome
{
    Accepted,
    NotFound,
    NotAvailable
}

public sealed record AcceptOfferResult(
    AcceptOfferOutcome Outcome,
    AgreementDetails? Agreement = null,
    string? Error = null)
{
    public static AcceptOfferResult Accepted(AgreementDetails agreement) =>
        new(AcceptOfferOutcome.Accepted, agreement);

    public static AcceptOfferResult NotFound() =>
        new(AcceptOfferOutcome.NotFound);

    public static AcceptOfferResult NotAvailable(string error) =>
        new(AcceptOfferOutcome.NotAvailable, Error: error);
}
