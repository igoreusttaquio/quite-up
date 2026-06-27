using MediatR;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Debts.DTOs;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Application.Features.Debts.Commands.CreateDebt;

public class CreateDebtCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<CreateDebtCommand, Result<DebtDto>>
{
    public async Task<Result<DebtDto>> Handle(CreateDebtCommand request, CancellationToken cancellationToken)
    {
        var debt = new Debt
        {
            UserId = currentUser.UserId!.Value,
            Name = request.Name,
            Type = request.Type,
            TotalAmount = request.TotalAmount,
            InterestRate = request.InterestRate,
            DueDate = request.DueDate,
            Notes = request.Notes
        };

        context.Debts.Add(debt);
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
