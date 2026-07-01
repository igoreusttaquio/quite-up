using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Reports.DTOs;

namespace QuiteUp.Application.Features.Reports.Queries.GetPeriodReport;

public record GetPeriodReportQuery(DateOnly StartDate, DateOnly EndDate) : IRequest<Result<PeriodReportDto>>;
