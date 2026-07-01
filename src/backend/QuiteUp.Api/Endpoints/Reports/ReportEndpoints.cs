using NetDevPack.SimpleMediator;
using QuiteUp.Api.Common;
using QuiteUp.Application.Features.Reports.Queries.GetEvolutionReport;
using QuiteUp.Application.Features.Reports.Queries.GetPeriodReport;

namespace QuiteUp.Api.Endpoints.Reports;

public class ReportEndpoints : IEndpoint
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/reports")
            .WithTags("Reports")
            .RequireAuthorization();

        group.MapGet("/period", async (IMediator sender, DateOnly? startDate, DateOnly? endDate) =>
        {
            if (startDate is null || endDate is null)
                return Results.BadRequest(new { message = "startDate and endDate are required." });

            var result = await sender.Send(new GetPeriodReportQuery(startDate.Value, endDate.Value));
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        });

        group.MapGet("/evolution", async (IMediator sender, int? year) =>
        {
            if (year is null)
                return Results.BadRequest(new { message = "year is required." });

            var result = await sender.Send(new GetEvolutionReportQuery(year.Value));
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        });
    }
}
