using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Debts.DTOs;

namespace QuiteUp.Application.Features.Debts.Queries.GetSnowballStrategy;

public class GetSnowballStrategyQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<GetSnowballStrategyQuery, Result<SnowballStrategyDto>>
{
    public async Task<Result<SnowballStrategyDto>> Handle(GetSnowballStrategyQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var debts = await context.Debts
            .Where(d => d.UserId == userId && !d.IsPaid)
            .OrderBy(d => d.TotalAmount - d.PaidAmount)
            .ToListAsync(cancellationToken);

        var items = debts.Select((d, i) => new SnowballStrategyItemDto(
            idEncoder.Encode(d.Id),
            d.Name,
            d.Type,
            d.TotalAmount,
            d.TotalAmount - d.PaidAmount,
            d.TotalAmount / 12,
            d.DueDate,
            i + 1
        )).ToList();

        var totalRemaining = items.Sum(i => i.RemainingAmount);

        var averageMonthlyPayment = items.Any()
            ? items.Average(i => i.MinimumPayment)
            : 0;

        var estimatedMonths = averageMonthlyPayment > 0
            ? (int)Math.Ceiling(totalRemaining / averageMonthlyPayment)
            : 0;

        var dto = new SnowballStrategyDto(items, totalRemaining, estimatedMonths);

        return Result<SnowballStrategyDto>.Success(dto);
    }
}
