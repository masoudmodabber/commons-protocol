using Commons.Domain.Participants;
using Commons.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Commons.Api.Requests;

public sealed class RequestApplicationService(CommonsDbContext dbContext)
{
    public async Task<CreateRequestResult> CreateAsync(
        string authenticatedUserId,
        string title,
        string description,
        CancellationToken cancellationToken)
    {
        var participant = await dbContext.Participants
            .Include(existing => existing.Membership)
            .SingleOrDefaultAsync(
                existing => existing.AuthenticatedUserId == authenticatedUserId,
                cancellationToken);

        if (participant is null)
        {
            return CreateRequestResult.NotParticipant();
        }

        Commons.Domain.Requests.Request request;

        try
        {
            request = participant.CreateRequest(title, description);
        }
        catch (DomainRuleViolationException exception)
        {
            return CreateRequestResult.Invalid(exception.Message);
        }

        dbContext.Requests.Add(request);
        await dbContext.SaveChangesAsync(cancellationToken);

        var details = await GetForCreatorAsync(authenticatedUserId, request.Id, cancellationToken)
            ?? throw new InvalidOperationException("The created Request could not be loaded.");

        return CreateRequestResult.Created(details);
    }

    public Task<RequestDetails?> GetForCreatorAsync(
        string authenticatedUserId,
        Guid requestId,
        CancellationToken cancellationToken)
    {
        return dbContext.Requests
            .AsNoTracking()
            .Where(request => request.Id == requestId)
            .Where(request => dbContext.Participants.Any(participant =>
                participant.Id == request.CreatorParticipantId
                && participant.AuthenticatedUserId == authenticatedUserId))
            .Select(request => new RequestDetails(
                request.Id,
                request.Title,
                request.Description,
                request.Status.ToString(),
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
            .SingleOrDefaultAsync(cancellationToken);
    }
}

public sealed record RequestDetails(
    Guid Id,
    string Title,
    string Description,
    string Status,
    RequestCreatorSummary Creator,
    RequestCommonsSummary HomeCommons);

public sealed record RequestCreatorSummary(Guid ParticipantId, string DisplayName);

public sealed record RequestCommonsSummary(Guid Id, string Name);

public enum CreateRequestOutcome
{
    Created,
    NotParticipant,
    Invalid
}

public sealed record CreateRequestResult(
    CreateRequestOutcome Outcome,
    RequestDetails? Request = null,
    string? Error = null)
{
    public static CreateRequestResult Created(RequestDetails request) =>
        new(CreateRequestOutcome.Created, request);

    public static CreateRequestResult NotParticipant() =>
        new(CreateRequestOutcome.NotParticipant);

    public static CreateRequestResult Invalid(string error) =>
        new(CreateRequestOutcome.Invalid, Error: error);
}
