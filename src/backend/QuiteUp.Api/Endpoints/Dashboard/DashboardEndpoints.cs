using MediatR;
using QuiteUp.Api.Common;
using QuiteUp.Application.Features.Dashboard.Queries.GetDashboardSummary;

namespace QuiteUp.Api.Endpoints.Dashboard;

public class DashboardEndpoints : IEndpoint
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/dashboard")
            .WithTags("Dashboard")
            .RequireAuthorization();

        group.MapGet("/", async (ISender sender) =>
        {
            var result = await sender.Send(new GetDashboardSummaryQuery());
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        });
    }
}
