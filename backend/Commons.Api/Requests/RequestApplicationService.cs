using Commons.Domain.Participants;
using Commons.Domain.Requests;
using Commons.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using RequestEntity = Commons.Domain.Requests.Request;

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
        return ProjectDetails(GetRequestsForCreator(authenticatedUserId)
                .Where(request => request.Id == requestId))
            .SingleOrDefaultAsync(cancellationToken);
    }

    public Task<List<RequestDetails>> GetAllForCreatorAsync(
        string authenticatedUserId,
        CancellationToken cancellationToken)
    {
        var requests = GetRequestsForCreator(authenticatedUserId)
            .OrderBy(request => request.Title)
            .ThenBy(request => request.Id);

        return ProjectDetails(requests)
            .ToListAsync(cancellationToken);
    }

    private IQueryable<RequestEntity> GetRequestsForCreator(string authenticatedUserId)
    {
        return dbContext.Requests
            .AsNoTracking()
            .Where(request => dbContext.Participants.Any(participant =>
                participant.Id == request.CreatorParticipantId
                && participant.AuthenticatedUserId == authenticatedUserId));
    }

    private IQueryable<RequestDetails> ProjectDetails(IQueryable<RequestEntity> requests)
    {
        return requests.Select(request => new RequestDetails(
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
                        .Single())));
    }

    public async Task<EditRequestResult> EditAsync(
        string authenticatedUserId,
        Guid requestId,
        string title,
        string description,
        CancellationToken cancellationToken)
    {
        var request = await dbContext.Requests
            .SingleOrDefaultAsync(existing =>
                existing.Id == requestId
                && dbContext.Participants.Any(participant =>
                    participant.Id == existing.CreatorParticipantId
                    && participant.AuthenticatedUserId == authenticatedUserId),
                cancellationToken);

        if (request is null)
        {
            return EditRequestResult.NotFound();
        }

        try
        {
            request.Edit(title, description);
        }
        catch (RequestNotOpenException exception)
        {
            return EditRequestResult.NotOpen(exception.Message);
        }
        catch (DomainRuleViolationException exception)
        {
            return EditRequestResult.Invalid(exception.Message);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var details = await GetForCreatorAsync(authenticatedUserId, request.Id, cancellationToken)
            ?? throw new InvalidOperationException("The edited Request could not be loaded.");

        return EditRequestResult.Edited(details);
    }

    public async Task<CancelRequestResult> CancelAsync(
        string authenticatedUserId,
        Guid requestId,
        CancellationToken cancellationToken)
    {
        var request = await dbContext.Requests
            .SingleOrDefaultAsync(existing =>
                existing.Id == requestId
                && dbContext.Participants.Any(participant =>
                    participant.Id == existing.CreatorParticipantId
                    && participant.AuthenticatedUserId == authenticatedUserId),
                cancellationToken);

        if (request is null)
        {
            return CancelRequestResult.NotFound();
        }

        try
        {
            request.Cancel();
        }
        catch (RequestNotOpenException exception)
        {
            return CancelRequestResult.NotOpen(exception.Message);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var details = await GetForCreatorAsync(authenticatedUserId, request.Id, cancellationToken)
            ?? throw new InvalidOperationException("The cancelled Request could not be loaded.");

        return CancelRequestResult.Cancelled(details);
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

public enum EditRequestOutcome
{
    Edited,
    NotFound,
    NotOpen,
    Invalid
}

public sealed record EditRequestResult(
    EditRequestOutcome Outcome,
    RequestDetails? Request = null,
    string? Error = null)
{
    public static EditRequestResult Edited(RequestDetails request) =>
        new(EditRequestOutcome.Edited, request);

    public static EditRequestResult NotFound() =>
        new(EditRequestOutcome.NotFound);

    public static EditRequestResult NotOpen(string error) =>
        new(EditRequestOutcome.NotOpen, Error: error);

    public static EditRequestResult Invalid(string error) =>
        new(EditRequestOutcome.Invalid, Error: error);
}

public enum CancelRequestOutcome
{
    Cancelled,
    NotFound,
    NotOpen
}

public sealed record CancelRequestResult(
    CancelRequestOutcome Outcome,
    RequestDetails? Request = null,
    string? Error = null)
{
    public static CancelRequestResult Cancelled(RequestDetails request) =>
        new(CancelRequestOutcome.Cancelled, request);

    public static CancelRequestResult NotFound() =>
        new(CancelRequestOutcome.NotFound);

    public static CancelRequestResult NotOpen(string error) =>
        new(CancelRequestOutcome.NotOpen, Error: error);
}
