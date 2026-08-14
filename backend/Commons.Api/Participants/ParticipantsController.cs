using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Commons.Api.Participants;

[ApiController]
[Authorize]
[Route("api")]
public sealed class ParticipantsController(ParticipantApplicationService participantService) : ControllerBase
{
    [HttpGet("commons")]
    public async Task<ActionResult<IReadOnlyList<CommonsSummary>>> GetAvailableCommons(
        CancellationToken cancellationToken)
    {
        return Ok(await participantService.GetAvailableCommonsAsync(cancellationToken));
    }

    [HttpPost("participants/me")]
    public async Task<IActionResult> Join(
        JoinParticipantRequest request,
        CancellationToken cancellationToken)
    {
        var result = await participantService.JoinAsync(
            GetAuthenticatedUserId(),
            new JoinParticipantCommand(request.HomeCommonsId, request.DisplayName, request.Bio),
            cancellationToken);

        return result.Outcome switch
        {
            JoinParticipantOutcome.Joined => CreatedAtAction(
                nameof(GetMyProfile),
                value: new { id = result.ParticipantId }),
            JoinParticipantOutcome.AlreadyParticipant => Conflict(new ProblemDetails
            {
                Title = "The authenticated user already has a Participant identity."
            }),
            JoinParticipantOutcome.CommonsNotFound => NotFound(new ProblemDetails
            {
                Title = "The selected Commons does not exist."
            }),
            JoinParticipantOutcome.Invalid => BadRequest(new ProblemDetails
            {
                Title = result.Error
            }),
            _ => throw new InvalidOperationException("Unknown join outcome.")
        };
    }

    [HttpGet("participants/me")]
    public async Task<ActionResult<ParticipantProfile>> GetMyProfile(CancellationToken cancellationToken)
    {
        var profile = await participantService.GetProfileAsync(
            GetAuthenticatedUserId(),
            cancellationToken);

        return profile is null ? NotFound() : Ok(profile);
    }

    private string GetAuthenticatedUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("The authenticated user has no identifier claim.");
}

public sealed record JoinParticipantRequest(Guid HomeCommonsId, string DisplayName, string? Bio);
