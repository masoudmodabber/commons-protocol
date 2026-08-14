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

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RequestDetails>>> GetMine(
        CancellationToken cancellationToken)
    {
        return Ok(await requestService.GetAllForCreatorAsync(
            GetAuthenticatedUserId(),
            cancellationToken));
    }

    [HttpGet("browse")]
    public async Task<ActionResult<IReadOnlyList<RequestDetails>>> Browse(
        [FromQuery] string? search,
        CancellationToken cancellationToken)
    {
        var requests = await requestService.BrowseAsync(
            GetAuthenticatedUserId(),
            search,
            cancellationToken);

        return requests is null
            ? NotFound(new ProblemDetails
            {
                Title = "The authenticated user does not have a Participant profile."
            })
            : Ok(requests);
    }

    [HttpGet("browse/{requestId:guid}")]
    public async Task<ActionResult<RequestDetails>> GetBrowseRequest(
        Guid requestId,
        CancellationToken cancellationToken)
    {
        var request = await requestService.GetBrowseRequestAsync(
            GetAuthenticatedUserId(),
            requestId,
            cancellationToken);

        return request is null ? NotFound() : Ok(request);
    }

    [HttpPut("{requestId:guid}")]
    public async Task<IActionResult> Edit(
        Guid requestId,
        EditRequestRequest request,
        CancellationToken cancellationToken)
    {
        var result = await requestService.EditAsync(
            GetAuthenticatedUserId(),
            requestId,
            request.Title,
            request.Description,
            cancellationToken);

        return result.Outcome switch
        {
            EditRequestOutcome.Edited => Ok(result.Request),
            EditRequestOutcome.NotFound => NotFound(new ProblemDetails
            {
                Title = "The Request does not exist or was not created by this Participant."
            }),
            EditRequestOutcome.NotOpen => Conflict(new ProblemDetails
            {
                Title = result.Error
            }),
            EditRequestOutcome.Invalid => BadRequest(new ProblemDetails
            {
                Title = result.Error
            }),
            _ => throw new InvalidOperationException("Unknown edit Request outcome.")
        };
    }

    [HttpPost("{requestId:guid}/cancel")]
    public async Task<IActionResult> Cancel(
        Guid requestId,
        CancellationToken cancellationToken)
    {
        var result = await requestService.CancelAsync(
            GetAuthenticatedUserId(),
            requestId,
            cancellationToken);

        return result.Outcome switch
        {
            CancelRequestOutcome.Cancelled => Ok(result.Request),
            CancelRequestOutcome.NotFound => NotFound(new ProblemDetails
            {
                Title = "The Request does not exist or was not created by this Participant."
            }),
            CancelRequestOutcome.NotOpen => Conflict(new ProblemDetails
            {
                Title = result.Error
            }),
            _ => throw new InvalidOperationException("Unknown cancel Request outcome.")
        };
    }

    private string GetAuthenticatedUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("The authenticated user has no identifier claim.");
}

public sealed record CreateRequestRequest(string Title, string Description);

public sealed record EditRequestRequest(string Title, string Description);
