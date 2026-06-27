using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Debts.DTOs;

namespace QuiteUp.Application.Features.Debts.Commands.UpdateDebt;

public class UpdateDebtCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<UpdateDebtCommand, Result<DebtDto>>
{
    public async Task<Result<DebtDto>> Handle(UpdateDebtCommand request, CancellationToken cancellationToken)
    {
        var debt = await context.Debts
            .FirstOrDefaultAsync(d => d.Id == request.Id && d.UserId == currentUser.UserId, cancellationToken);

        if (debt is null)
            return Result<DebtDto>.Failure(Error.NotFound);

        debt.Name = request.Name;
        debt.Type = request.Type;
        debt.TotalAmount = request.TotalAmount;
        debt.InterestRate = request.InterestRate;
        debt.DueDate = request.DueDate;
        debt.Notes = request.Notes;

        await context.SaveChangesAsync(cancellationToken);

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
