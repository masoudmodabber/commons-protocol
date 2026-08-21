using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Commons.Api.Agreements;

[ApiController]
[Authorize]
[Route("api")]
public sealed class AgreementsController(AgreementApplicationService agreementService)
    : ControllerBase
{
    [HttpPost("offers/{offerId:guid}/accept")]
    public async Task<IActionResult> Accept(
        Guid offerId,
        CancellationToken cancellationToken)
    {
        var result = await agreementService.AcceptAsync(
            GetAuthenticatedUserId(),
            offerId,
            cancellationToken);

        return result.Outcome switch
        {
            AcceptOfferOutcome.Accepted => CreatedAtAction(
                nameof(Get),
                new { agreementId = result.Agreement!.Id },
                result.Agreement),
            AcceptOfferOutcome.NotFound => NotFound(new ProblemDetails
            {
                Title = "The Offer does not exist or its Request was not created by this Participant."
            }),
            AcceptOfferOutcome.NotAvailable => Conflict(new ProblemDetails
            {
                Title = result.Error
            }),
            _ => throw new InvalidOperationException("Unknown accept Offer outcome.")
        };
    }

    [HttpGet("agreements/{agreementId:guid}")]
    public async Task<ActionResult<AgreementDetails>> Get(
        Guid agreementId,
        CancellationToken cancellationToken)
    {
        var agreement = await agreementService.GetForParticipantAsync(
            GetAuthenticatedUserId(),
            agreementId,
            cancellationToken);

        return agreement is null ? NotFound() : Ok(agreement);
    }

    [HttpGet("agreements")]
    public async Task<ActionResult<IReadOnlyList<AgreementDetails>>> List(
        CancellationToken cancellationToken)
    {
        var agreements = await agreementService.ListForParticipantAsync(
            GetAuthenticatedUserId(),
            cancellationToken);

        return agreements is null ? NotFound() : Ok(agreements);
    }

    private string GetAuthenticatedUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("The authenticated user has no identifier claim.");
}
