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

        var debts = await query
            .OrderBy(d => d.DueDate)
            .ToListAsync(cancellationToken);

        var dtos = debts.Select(d => new DebtDto(
            idEncoder.Encode(d.Id),
            d.Name,
            d.Type,
            d.TotalAmount,
            d.PaidAmount,
            d.TotalAmount - d.PaidAmount,
            d.InterestRate,
            d.DueDate,
            d.IsPaid,
            d.Notes,
            d.CreatedAt
        )).ToList();

        return Result<IReadOnlyList<DebtDto>>.Success(dtos);
    }
}
