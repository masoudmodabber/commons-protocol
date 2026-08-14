using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Commons.Api.Offers;

[ApiController]
[Authorize]
[Route("api")]
public sealed class OffersController(OfferApplicationService offerService) : ControllerBase
{
    [HttpGet("requests/browse/{requestId:guid}/offer-options")]
    public async Task<ActionResult<OfferSubmissionOptions>> GetSubmissionOptions(
        Guid requestId,
        CancellationToken cancellationToken)
    {
        var options = await offerService.GetSubmissionOptionsAsync(
            GetAuthenticatedUserId(),
            requestId,
            cancellationToken);

        return options is null ? NotFound() : Ok(options);
    }

    [HttpPost("requests/{requestId:guid}/offers")]
    public async Task<IActionResult> Submit(
        Guid requestId,
        SubmitOfferRequest request,
        CancellationToken cancellationToken)
    {
        var result = await offerService.SubmitAsync(
            GetAuthenticatedUserId(),
            requestId,
            request.CommonsAccountingUnits,
            request.RequestedContributions?
                .Select(contribution => new RequestedContributionCommand(
                    contribution.CapabilityId,
                    contribution.Description))
                .ToList()
                ?? [],
            cancellationToken);

        return result.Outcome switch
        {
            SubmitOfferOutcome.Submitted => CreatedAtAction(
                nameof(Get),
                new { offerId = result.Offer!.Id },
                result.Offer),
            SubmitOfferOutcome.RequestNotAvailable => NotFound(new ProblemDetails
            {
                Title = "The Request is not available to this Participant."
            }),
            SubmitOfferOutcome.Invalid => BadRequest(new ProblemDetails
            {
                Title = result.Error
            }),
            _ => throw new InvalidOperationException("Unknown submit Offer outcome.")
        };
    }

    [HttpGet("offers/{offerId:guid}")]
    public async Task<ActionResult<OfferDetails>> Get(
        Guid offerId,
        CancellationToken cancellationToken)
    {
        var offer = await offerService.GetForCreatorAsync(
            GetAuthenticatedUserId(),
            offerId,
            cancellationToken);

        return offer is null ? NotFound() : Ok(offer);
    }

    [HttpGet("offers")]
    public async Task<ActionResult<IReadOnlyList<OfferDetails>>> List(
        CancellationToken cancellationToken)
    {
        var offers = await offerService.ListForCreatorAsync(
            GetAuthenticatedUserId(),
            cancellationToken);

        return offers is null ? NotFound() : Ok(offers);
    }

    [HttpPost("offers/{offerId:guid}/withdraw")]
    public async Task<IActionResult> Withdraw(
        Guid offerId,
        CancellationToken cancellationToken)
    {
        var result = await offerService.WithdrawAsync(
            GetAuthenticatedUserId(),
            offerId,
            cancellationToken);

        return result.Outcome switch
        {
            WithdrawOfferOutcome.Withdrawn => Ok(result.Offer),
            WithdrawOfferOutcome.NotFound => NotFound(new ProblemDetails
            {
                Title = "The Offer does not exist or was not created by this Participant."
            }),
            WithdrawOfferOutcome.NotActive => Conflict(new ProblemDetails
            {
                Title = result.Error
            }),
            _ => throw new InvalidOperationException("Unknown withdraw Offer outcome.")
        };
    }

    private string GetAuthenticatedUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("The authenticated user has no identifier claim.");
}

public sealed record SubmitOfferRequest(
    long? CommonsAccountingUnits,
    IReadOnlyList<RequestedContributionRequest>? RequestedContributions);

public sealed record RequestedContributionRequest(Guid CapabilityId, string Description);
