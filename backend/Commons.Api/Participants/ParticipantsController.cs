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

    [HttpGet("participants/me/capabilities")]
    public async Task<ActionResult<IReadOnlyList<CapabilitySummary>>> GetMyCapabilities(
        CancellationToken cancellationToken)
    {
        var capabilities = await participantService.GetCapabilitiesAsync(
            GetAuthenticatedUserId(),
            cancellationToken);

        return capabilities is null ? NotFound() : Ok(capabilities);
    }

    [HttpPost("participants/me/capabilities")]
    public async Task<IActionResult> AddCapability(
        AddCapabilityRequest request,
        CancellationToken cancellationToken)
    {
        var result = await participantService.AddCapabilityAsync(
            GetAuthenticatedUserId(),
            request.Text,
            cancellationToken);

        return result.Outcome switch
        {
            AddCapabilityOutcome.Added => CreatedAtAction(
                nameof(GetMyCapabilities),
                value: result.Capability),
            AddCapabilityOutcome.NotParticipant => NotFound(new ProblemDetails
            {
                Title = "The authenticated user does not have a Participant profile."
            }),
            AddCapabilityOutcome.Duplicate => Conflict(new ProblemDetails
            {
                Title = result.Error
            }),
            AddCapabilityOutcome.Invalid => BadRequest(new ProblemDetails
            {
                Title = result.Error
            }),
            _ => throw new InvalidOperationException("Unknown add Capability outcome.")
        };
    }

    [HttpDelete("participants/me/capabilities/{capabilityId:guid}")]
    public async Task<IActionResult> RemoveCapability(
        Guid capabilityId,
        CancellationToken cancellationToken)
    {
        var outcome = await participantService.RemoveCapabilityAsync(
            GetAuthenticatedUserId(),
            capabilityId,
            cancellationToken);

        return outcome switch
        {
            RemoveCapabilityOutcome.Removed => NoContent(),
            RemoveCapabilityOutcome.NotParticipant => NotFound(new ProblemDetails
            {
                Title = "The authenticated user does not have a Participant profile."
            }),
            RemoveCapabilityOutcome.CapabilityNotFound => NotFound(new ProblemDetails
            {
                Title = "The Capability does not exist on this Participant's profile."
            }),
            _ => throw new InvalidOperationException("Unknown remove Capability outcome.")
        };
    }

    private string GetAuthenticatedUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("The authenticated user has no identifier claim.");
}

public sealed record JoinParticipantRequest(Guid HomeCommonsId, string DisplayName, string? Bio);

public sealed record AddCapabilityRequest(string Text);
