using NetDevPack.SimpleMediator;
using QuiteUp.Api.Common;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Features.Dashboard.Queries.GetDashboardSummary;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Api.Endpoints.Dashboard;

public class DashboardEndpoints : IEndpoint
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/dashboard")
            .WithTags("Dashboard")
            .RequireAuthorization();

        group.MapGet("/", async (
            IMediator sender,
            IIdEncoder encoder,
            string? startDate = null,
            string? endDate = null,
            TransactionType? type = null,
            string? categoryId = null) =>
        {
            DateOnly? parsedStart = startDate is not null && DateOnly.TryParse(startDate, out var s) ? s : null;
            DateOnly? parsedEnd = endDate is not null && DateOnly.TryParse(endDate, out var e) ? e : null;
            long? decodedCategoryId = categoryId is not null ? encoder.Decode(categoryId) : null;

            var result = await sender.Send(new GetDashboardSummaryQuery(parsedStart, parsedEnd, type, decodedCategoryId));
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        });
    }
}
