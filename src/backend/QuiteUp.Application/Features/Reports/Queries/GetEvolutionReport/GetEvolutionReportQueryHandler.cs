using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Reports.DTOs;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Reports.Queries.GetEvolutionReport;

public class GetEvolutionReportQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser) : IRequestHandler<GetEvolutionReportQuery, Result<IReadOnlyList<EvolutionReportDto>>>
{
    public async Task<Result<IReadOnlyList<EvolutionReportDto>>> Handle(GetEvolutionReportQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var startDate = new DateOnly(request.Year, 1, 1);
        var endDate = new DateOnly(request.Year, 12, 31);

        var transactions = await context.Transactions
            .Where(t => t.UserId == userId && t.Date >= startDate && t.Date <= endDate)
            .ToListAsync(cancellationToken);

        var monthly = transactions
            .GroupBy(t => t.Date.Month)
            .ToDictionary(g => g.Key, g => g.ToList());

        var result = new List<EvolutionReportDto>();

        for (int month = 1; month <= 12; month++)
        {
            if (monthly.TryGetValue(month, out var monthTransactions))
            {
                var income = monthTransactions
                    .Where(t => t.Type == TransactionType.Income)
                    .Sum(t => t.Amount);

                var expenses = monthTransactions
                    .Where(t => t.Type == TransactionType.Expense)
                    .Sum(t => t.Amount);

                result.Add(new EvolutionReportDto(
                    request.Year,
                    month,
                    income,
                    expenses,
                    income - expenses
                ));
            }
            else
            {
                result.Add(new EvolutionReportDto(request.Year, month, 0, 0, 0));
            }
        }

        return Result<IReadOnlyList<EvolutionReportDto>>.Success(result);
    }
}
