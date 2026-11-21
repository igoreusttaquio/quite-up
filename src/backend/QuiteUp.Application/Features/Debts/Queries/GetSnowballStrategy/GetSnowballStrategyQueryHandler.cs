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
    private const int MaxMonths = 600;

    public async Task<Result<SnowballStrategyDto>> Handle(GetSnowballStrategyQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;
        var today = DebtMapper.Today;

        var debts = await context.Debts
            .Where(d => d.UserId == userId && !d.IsPaid)
            .ToListAsync(cancellationToken);

        // Bola de neve: menor saldo devedor primeiro.
        var ordered = debts
            .Select(d => new
            {
                Debt = d,
                Remaining = Math.Max(0, d.TotalAmount - d.PaidAmount),
                Monthly = DebtSchedule.MonthlyPayment(d, today),
            })
            .Where(x => x.Remaining > 0)
            .OrderBy(x => x.Remaining)
            .ToList();

        var items = ordered.Select((x, i) => new SnowballStrategyItemDto(
            idEncoder.Encode(x.Debt.Id),
            x.Debt.Name,
            x.Debt.Type,
            x.Debt.TotalAmount,
            x.Remaining,
            x.Monthly,
            DebtSchedule.ComputePayoffDate(x.Debt),
            i + 1
        )).ToList();

        var months = Simulate(ordered.Select(x => (x.Remaining, x.Monthly)).ToList());

        return Result<SnowballStrategyDto>.Success(
            new SnowballStrategyDto(items, items.Sum(i => i.RemainingAmount), months));
    }

    /// <summary>
    /// Simula a bola de neve com o orçamento mensal = soma das parcelas atuais: paga o mínimo
    /// de cada dívida e o que sobra (de dívidas já quitadas) vai para a menor em aberto.
    /// </summary>
    private static int Simulate(List<(decimal Remaining, decimal Monthly)> debts)
    {
        if (debts.Count == 0) return 0;
        var balances = debts.Select(d => d.Remaining).ToArray();
        var budget = debts.Sum(d => d.Monthly);
        if (budget <= 0) return 0;

        for (var month = 1; month <= MaxMonths; month++)
        {
            var available = budget;
            // Mínimos primeiro.
            for (var i = 0; i < balances.Length; i++)
            {
                if (balances[i] <= 0) continue;
                var pay = Math.Min(balances[i], Math.Min(debts[i].Monthly, available));
                balances[i] -= pay;
                available -= pay;
            }
            // Sobra vai para a menor dívida em aberto (ordem já é do menor saldo).
            for (var i = 0; i < balances.Length && available > 0; i++)
            {
                if (balances[i] <= 0) continue;
                var pay = Math.Min(balances[i], available);
                balances[i] -= pay;
                available -= pay;
            }
            if (balances.All(b => b <= 0)) return month;
        }
        return MaxMonths;
    }
}
