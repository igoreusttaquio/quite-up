using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Debts.DTOs;

namespace QuiteUp.Application.Features.Debts.Queries.GetDebtById;

public class GetDebtByIdQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<GetDebtByIdQuery, Result<DebtDto>>
{
    public async Task<Result<DebtDto>> Handle(GetDebtByIdQuery request, CancellationToken cancellationToken)
    {
        var debt = await context.Debts
            .Include(d => d.Payments)
            .FirstOrDefaultAsync(d => d.Id == request.Id && d.UserId == currentUser.UserId, cancellationToken);

        if (debt is null)
            return Result<DebtDto>.Failure(Error.NotFound);

        var dto = new DebtDto(
            idEncoder.Encode(debt.Id),
            debt.Name,
            debt.Type,
            debt.TotalAmount,
            debt.PaidAmount,
            debt.TotalAmount - debt.PaidAmount,
            debt.InterestRate,
            debt.DueDate,
            debt.IsPaid,
            debt.Notes,
            debt.CreatedAt);

        return Result<DebtDto>.Success(dto);
    }
}
