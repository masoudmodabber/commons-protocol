using Commons.Api.Requests;
using Commons.Domain.Offers;
using Commons.Domain.Participants;
using Commons.Domain.Requests;
using Commons.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using RequestEntity = Commons.Domain.Requests.Request;

namespace Commons.Api.Offers;

public sealed class OfferApplicationService(CommonsDbContext dbContext)
{
    public async Task<OfferSubmissionOptions?> GetSubmissionOptionsAsync(
        string authenticatedUserId,
        Guid requestId,
        CancellationToken cancellationToken)
    {
        var context = await GetAvailableRequestContextAsync(
            authenticatedUserId,
            requestId,
            cancellationToken);

        if (context is null)
        {
            return null;
        }

        var capabilities = await dbContext.Capabilities
            .AsNoTracking()
            .Where(capability => capability.ParticipantId == context.Request.CreatorParticipantId)
            .OrderBy(capability => capability.Text)
            .Select(capability => new OfferCapabilityOption(capability.Id, capability.Text))
            .ToListAsync(cancellationToken);

        return new OfferSubmissionOptions(
            await ProjectRequestSummary(context.Request.Id, cancellationToken),
            capabilities);
    }

    public async Task<SubmitOfferResult> SubmitAsync(
        string authenticatedUserId,
        Guid requestId,
        long? commonsAccountingUnits,
        IReadOnlyList<RequestedContributionCommand> requestedContributions,
        CancellationToken cancellationToken)
    {
        var context = await GetAvailableRequestContextAsync(
            authenticatedUserId,
            requestId,
            cancellationToken);

        if (context is null)
        {
            return SubmitOfferResult.RequestNotAvailable();
        }

        var requestCreator = await dbContext.Participants
            .Include(participant => participant.Capabilities)
            .SingleAsync(
                participant => participant.Id == context.Request.CreatorParticipantId,
                cancellationToken);
        var selections = requestedContributions
            .Select(contribution => new RequestedContributionSelection(
                contribution.CapabilityId,
                contribution.Description))
            .ToList();

        Offer offer;

        try
        {
            offer = context.Participant.SubmitOffer(
                context.Request,
                requestCreator,
                commonsAccountingUnits,
                selections);
        }
        catch (DomainRuleViolationException exception)
        {
            return SubmitOfferResult.Invalid(exception.Message);
        }

        dbContext.Offers.Add(offer);
        await dbContext.SaveChangesAsync(cancellationToken);

        var details = await GetForCreatorAsync(
            authenticatedUserId,
            offer.Id,
            cancellationToken)
            ?? throw new InvalidOperationException("The submitted Offer could not be loaded.");

        return SubmitOfferResult.Submitted(details);
    }

    public Task<OfferDetails?> GetForCreatorAsync(
        string authenticatedUserId,
        Guid offerId,
        CancellationToken cancellationToken)
    {
        return ProjectOfferDetails(dbContext.Offers
                .AsNoTracking()
                .Where(offer =>
                    offer.Id == offerId
                    && dbContext.Participants.Any(participant =>
                        participant.Id == offer.CreatorParticipantId
                        && participant.AuthenticatedUserId == authenticatedUserId)))
            .SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<OfferDetails>?> ListForCreatorAsync(
        string authenticatedUserId,
        CancellationToken cancellationToken)
    {
        var participantId = await dbContext.Participants
            .AsNoTracking()
            .Where(participant => participant.AuthenticatedUserId == authenticatedUserId)
            .Select(participant => (Guid?)participant.Id)
            .SingleOrDefaultAsync(cancellationToken);

        if (participantId is null)
        {
            return null;
        }

        return await ProjectOfferDetails(dbContext.Offers
                .AsNoTracking()
                .Where(offer => offer.CreatorParticipantId == participantId.Value)
                .OrderBy(offer => offer.Id))
            .ToListAsync(cancellationToken);
    }

    public async Task<WithdrawOfferResult> WithdrawAsync(
        string authenticatedUserId,
        Guid offerId,
        CancellationToken cancellationToken)
    {
        var offer = await dbContext.Offers
            .SingleOrDefaultAsync(existing =>
                existing.Id == offerId
                && dbContext.Participants.Any(participant =>
                    participant.Id == existing.CreatorParticipantId
                    && participant.AuthenticatedUserId == authenticatedUserId),
                cancellationToken);

        if (offer is null)
        {
            return WithdrawOfferResult.NotFound();
        }

        try
        {
            offer.Withdraw();
        }
        catch (OfferNotActiveException exception)
        {
            return WithdrawOfferResult.NotActive(exception.Message);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var details = await GetForCreatorAsync(
            authenticatedUserId,
            offer.Id,
            cancellationToken)
            ?? throw new InvalidOperationException("The withdrawn Offer could not be loaded.");

        return WithdrawOfferResult.Withdrawn(details);
    }

    public async Task<RequestOfferComparison?> GetActiveForRequestCreatorAsync(
        string authenticatedUserId,
        Guid requestId,
        CancellationToken cancellationToken)
    {
        var participantId = await dbContext.Participants
            .AsNoTracking()
            .Where(participant => participant.AuthenticatedUserId == authenticatedUserId)
            .Select(participant => (Guid?)participant.Id)
            .SingleOrDefaultAsync(cancellationToken);

        if (participantId is null)
        {
            return null;
        }

        var ownsRequest = await dbContext.Requests
            .AsNoTracking()
            .AnyAsync(request =>
                request.Id == requestId
                && request.CreatorParticipantId == participantId.Value,
                cancellationToken);

        if (!ownsRequest)
        {
            return null;
        }

        var offers = await ProjectOfferDetails(dbContext.Offers
                .AsNoTracking()
                .Where(offer =>
                    offer.RequestId == requestId
                    && offer.Status == OfferStatus.Active)
                .OrderBy(offer => offer.Id))
            .ToListAsync(cancellationToken);

        return new RequestOfferComparison(
            await ProjectRequestSummary(requestId, cancellationToken),
            offers);
    }

    private async Task<AvailableRequestContext?> GetAvailableRequestContextAsync(
        string authenticatedUserId,
        Guid requestId,
        CancellationToken cancellationToken)
    {
        var participant = await dbContext.Participants
            .Include(existing => existing.Membership)
            .SingleOrDefaultAsync(
                existing => existing.AuthenticatedUserId == authenticatedUserId,
                cancellationToken);

        if (participant is null)
        {
            return null;
        }

        var request = await dbContext.Requests
            .SingleOrDefaultAsync(existing =>
                existing.Id == requestId
                && existing.HomeCommonsId == participant.Membership.HomeCommonsId
                && existing.CreatorParticipantId != participant.Id
                && existing.Status == RequestStatus.Open,
                cancellationToken);

        return request is null
            ? null
            : new AvailableRequestContext(participant, request);
    }

    private async Task<OfferRequestSummary> ProjectRequestSummary(
        Guid requestId,
        CancellationToken cancellationToken)
    {
        return await dbContext.Requests
            .AsNoTracking()
            .Where(request => request.Id == requestId)
            .Select(request => new OfferRequestSummary(
                request.Id,
                request.Title,
                request.Description,
                new RequestCreatorSummary(
                    request.CreatorParticipantId,
                    dbContext.Participants
                        .Where(participant => participant.Id == request.CreatorParticipantId)
                        .Select(participant => participant.Profile.DisplayName)
                        .Single()),
                new RequestCommonsSummary(
                    request.HomeCommonsId,
                    dbContext.Commons
                        .Where(commons => commons.Id == request.HomeCommonsId)
                        .Select(commons => commons.Name)
                        .Single())))
            .SingleAsync(cancellationToken);
    }

    private IQueryable<OfferDetails> ProjectOfferDetails(IQueryable<Offer> offers)
    {
        return offers.Select(offer => new OfferDetails(
            offer.Id,
            offer.Status.ToString(),
            offer.CommonsAccountingUnits,
            new OfferCreatorSummary(
                offer.CreatorParticipantId,
                dbContext.Participants
                    .Where(participant => participant.Id == offer.CreatorParticipantId)
                    .Select(participant => participant.Profile.DisplayName)
                    .Single()),
            dbContext.Requests
                .Where(request => request.Id == offer.RequestId)
                .Select(request => new OfferRequestSummary(
                    request.Id,
                    request.Title,
                    request.Description,
                    new RequestCreatorSummary(
                        request.CreatorParticipantId,
                        dbContext.Participants
                            .Where(participant => participant.Id == request.CreatorParticipantId)
                            .Select(participant => participant.Profile.DisplayName)
                            .Single()),
                    new RequestCommonsSummary(
                        request.HomeCommonsId,
                        dbContext.Commons
                            .Where(commons => commons.Id == request.HomeCommonsId)
                            .Select(commons => commons.Name)
                            .Single())))
                .Single(),
            offer.RequestedContributions
                .OrderBy(contribution => contribution.CapabilityTextSnapshot)
                .Select(contribution => new RequestedContributionDetails(
                    contribution.CapabilityId,
                    contribution.CapabilityTextSnapshot,
                    contribution.Description))
                .ToList(),
            dbContext.Agreements
                .Where(agreement => agreement.AcceptedOfferId == offer.Id)
                .Select(agreement => (Guid?)agreement.Id)
                .SingleOrDefault()));
    }

    private sealed record AvailableRequestContext(
        Participant Participant,
        RequestEntity Request);
}

public sealed record RequestedContributionCommand(Guid CapabilityId, string Description);

public sealed record OfferCapabilityOption(Guid Id, string Text);

public sealed record OfferSubmissionOptions(
    OfferRequestSummary Request,
    IReadOnlyList<OfferCapabilityOption> Capabilities);

public sealed record RequestOfferComparison(
    OfferRequestSummary Request,
    IReadOnlyList<OfferDetails> Offers);

public sealed record OfferDetails(
    Guid Id,
    string Status,
    long? CommonsAccountingUnits,
    OfferCreatorSummary Creator,
    OfferRequestSummary Request,
    IReadOnlyList<RequestedContributionDetails> RequestedContributions,
    Guid? AgreementId);

public sealed record OfferCreatorSummary(Guid ParticipantId, string DisplayName);

public sealed record OfferRequestSummary(
    Guid Id,
    string Title,
    string Description,
    RequestCreatorSummary Creator,
    RequestCommonsSummary HomeCommons);

public sealed record RequestedContributionDetails(
    Guid CapabilityId,
    string CapabilityTextSnapshot,
    string Description);

public enum WithdrawOfferOutcome
{
    Withdrawn,
    NotFound,
    NotActive
}

public sealed record WithdrawOfferResult(
    WithdrawOfferOutcome Outcome,
    OfferDetails? Offer = null,
    string? Error = null)
{
    public static WithdrawOfferResult Withdrawn(OfferDetails offer) =>
        new(WithdrawOfferOutcome.Withdrawn, offer);

    public static WithdrawOfferResult NotFound() =>
        new(WithdrawOfferOutcome.NotFound);

    public static WithdrawOfferResult NotActive(string error) =>
        new(WithdrawOfferOutcome.NotActive, Error: error);
}

public enum SubmitOfferOutcome
{
    Submitted,
    RequestNotAvailable,
    Invalid
}

public sealed record SubmitOfferResult(
    SubmitOfferOutcome Outcome,
    OfferDetails? Offer = null,
    string? Error = null)
{
    public static SubmitOfferResult Submitted(OfferDetails offer) =>
        new(SubmitOfferOutcome.Submitted, offer);

    public static SubmitOfferResult RequestNotAvailable() =>
        new(SubmitOfferOutcome.RequestNotAvailable);

    public static SubmitOfferResult Invalid(string error) =>
        new(SubmitOfferOutcome.Invalid, Error: error);
}
