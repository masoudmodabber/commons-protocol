using Commons.Domain.Participants;
using Commons.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Commons.Api.Participants;

public sealed class ParticipantApplicationService(
    CommonsDbContext dbContext,
    TimeProvider timeProvider)
{
    public async Task<IReadOnlyList<CommonsSummary>> GetAvailableCommonsAsync(
        CancellationToken cancellationToken)
    {
        return await dbContext.Commons
            .AsNoTracking()
            .OrderBy(commons => commons.Name)
            .Select(commons => new CommonsSummary(commons.Id, commons.Name))
            .ToListAsync(cancellationToken);
    }

    public async Task<JoinParticipantResult> JoinAsync(
        string authenticatedUserId,
        JoinParticipantCommand command,
        CancellationToken cancellationToken)
    {
        if (await dbContext.Participants.AnyAsync(
                participant => participant.AuthenticatedUserId == authenticatedUserId,
                cancellationToken))
        {
            return JoinParticipantResult.AlreadyParticipant();
        }

        if (!await dbContext.Commons.AnyAsync(
                commons => commons.Id == command.HomeCommonsId,
                cancellationToken))
        {
            return JoinParticipantResult.CommonsNotFound();
        }

        Participant participant;

        try
        {
            participant = Participant.Join(
                authenticatedUserId,
                command.HomeCommonsId,
                command.DisplayName,
                command.Bio,
                timeProvider.GetUtcNow());
        }
        catch (DomainRuleViolationException exception)
        {
            return JoinParticipantResult.Invalid(exception.Message);
        }

        dbContext.Participants.Add(participant);
        await dbContext.SaveChangesAsync(cancellationToken);

        return JoinParticipantResult.Joined(participant.Id);
    }

    public async Task<ParticipantProfile?> GetProfileAsync(
        string authenticatedUserId,
        CancellationToken cancellationToken)
    {
        return await dbContext.Participants
            .AsNoTracking()
            .Where(participant => participant.AuthenticatedUserId == authenticatedUserId)
            .Select(participant => new ParticipantProfile(
                participant.Id,
                participant.Profile.DisplayName,
                participant.Profile.Bio,
                participant.Membership.JoinedAt,
                new CommonsSummary(
                    participant.Membership.HomeCommons.Id,
                    participant.Membership.HomeCommons.Name)))
            .SingleOrDefaultAsync(cancellationToken);
    }
}

public sealed record JoinParticipantCommand(Guid HomeCommonsId, string DisplayName, string? Bio);

public sealed record CommonsSummary(Guid Id, string Name);

public sealed record ParticipantProfile(
    Guid Id,
    string DisplayName,
    string? Bio,
    DateTimeOffset JoinedAt,
    CommonsSummary HomeCommons);

public enum JoinParticipantOutcome
{
    Joined,
    AlreadyParticipant,
    CommonsNotFound,
    Invalid
}

public sealed record JoinParticipantResult(
    JoinParticipantOutcome Outcome,
    Guid? ParticipantId = null,
    string? Error = null)
{
    public static JoinParticipantResult Joined(Guid participantId) =>
        new(JoinParticipantOutcome.Joined, participantId);

    public static JoinParticipantResult AlreadyParticipant() =>
        new(JoinParticipantOutcome.AlreadyParticipant);

    public static JoinParticipantResult CommonsNotFound() =>
        new(JoinParticipantOutcome.CommonsNotFound);

    public static JoinParticipantResult Invalid(string error) =>
        new(JoinParticipantOutcome.Invalid, Error: error);
}
