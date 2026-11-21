using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Debts.DTOs;

namespace QuiteUp.Application.Features.Debts.Queries.GetDebts;

public class GetDebtsQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<GetDebtsQuery, Result<IReadOnlyList<DebtDto>>>
{
    public async Task<Result<IReadOnlyList<DebtDto>>> Handle(GetDebtsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var query = context.Debts
            .Include(d => d.Payments)
            .Where(d => d.UserId == userId);

        if (request.IsPaid.HasValue)
            query = query.Where(d => d.IsPaid == request.IsPaid.Value);

        var debts = await query.ToListAsync(cancellationToken);

        // Pendentes primeiro, pelo próximo vencimento (atrasadas no topo); quitadas por último.
        var dtos = debts
            .Select(d => DebtMapper.ToDto(d, idEncoder))
            .OrderBy(d => d.IsPaid)
            .ThenBy(d => d.Status == "overdue" ? 0 : 1)
            .ThenBy(d => d.NextDueDate ?? d.PayoffDate ?? DateOnly.MaxValue)
            .ToList();

        return Result<IReadOnlyList<DebtDto>>.Success(dtos);
    }
}
