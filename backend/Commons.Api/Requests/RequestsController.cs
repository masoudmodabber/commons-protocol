using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Commons.Api.Requests;

[ApiController]
[Authorize]
[Route("api/requests")]
public sealed class RequestsController(RequestApplicationService requestService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(
        CreateRequestRequest request,
        CancellationToken cancellationToken)
    {
        var result = await requestService.CreateAsync(
            GetAuthenticatedUserId(),
            request.Title,
            request.Description,
            cancellationToken);

        return result.Outcome switch
        {
            CreateRequestOutcome.Created => CreatedAtAction(
                nameof(Get),
                new { requestId = result.Request!.Id },
                result.Request),
            CreateRequestOutcome.NotParticipant => NotFound(new ProblemDetails
            {
                Title = "The authenticated user does not have a Participant profile."
            }),
            CreateRequestOutcome.Invalid => BadRequest(new ProblemDetails
            {
                Title = result.Error
            }),
            _ => throw new InvalidOperationException("Unknown create Request outcome.")
        };
    }

    [HttpGet("{requestId:guid}")]
    public async Task<ActionResult<RequestDetails>> Get(
        Guid requestId,
        CancellationToken cancellationToken)
    {
        var request = await requestService.GetForCreatorAsync(
            GetAuthenticatedUserId(),
            requestId,
            cancellationToken);

        return request is null ? NotFound() : Ok(request);
    }

    private string GetAuthenticatedUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("The authenticated user has no identifier claim.");
}

public sealed record CreateRequestRequest(string Title, string Description);
