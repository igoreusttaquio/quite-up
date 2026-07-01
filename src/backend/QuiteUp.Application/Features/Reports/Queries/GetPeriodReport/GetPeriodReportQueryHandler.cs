using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Reports.DTOs;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Reports.Queries.GetPeriodReport;

public class GetPeriodReportQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<GetPeriodReportQuery, Result<PeriodReportDto>>
{
    public async Task<Result<PeriodReportDto>> Handle(GetPeriodReportQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var transactions = await context.Transactions
            .Where(t => t.UserId == userId && t.Date >= request.StartDate && t.Date <= request.EndDate)
            .Include(t => t.Category)
            .ToListAsync(cancellationToken);

        var totalIncome = transactions
            .Where(t => t.Type == TransactionType.Income)
            .Sum(t => t.Amount);

        var totalExpenses = transactions
            .Where(t => t.Type == TransactionType.Expense)
            .Sum(t => t.Amount);

        var netBalance = totalIncome - totalExpenses;

        var expensesByCategory = transactions
            .Where(t => t.Type == TransactionType.Expense && t.CategoryId.HasValue)
            .GroupBy(t => new { t.CategoryId, t.Category!.Name })
            .Select(g => new CategoryReportDto(
                idEncoder.Encode(g.Key.CategoryId!.Value),
                g.Key.Name,
                g.Sum(t => t.Amount),
                g.Count(),
                totalExpenses > 0 ? Math.Round(g.Sum(t => t.Amount) / totalExpenses * 100, 2) : 0
            ))
            .OrderByDescending(c => c.TotalAmount)
            .ToList();

        var dto = new PeriodReportDto(
            request.StartDate,
            request.EndDate,
            totalIncome,
            totalExpenses,
            netBalance,
            expensesByCategory
        );

        return Result<PeriodReportDto>.Success(dto);
    }
}
