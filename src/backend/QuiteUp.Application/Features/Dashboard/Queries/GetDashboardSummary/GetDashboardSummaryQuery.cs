using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Dashboard.DTOs;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Dashboard.Queries.GetDashboardSummary;

public record GetDashboardSummaryQuery(
    DateOnly? StartDate = null,
    DateOnly? EndDate = null,
    TransactionType? Type = null,
    long? CategoryId = null
) : IRequest<Result<DashboardSummaryDto>>;
