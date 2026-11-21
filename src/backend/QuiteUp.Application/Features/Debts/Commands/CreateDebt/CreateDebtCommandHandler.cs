using NetDevPack.SimpleMediator;
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
        var debt = new Debt { UserId = currentUser.UserId!.Value };
        request.Input.ApplyTo(debt);
        // Parcelas pagas antes do app geram o "Pago" inicial.
        DebtInput.RecomputePaid(debt, paymentsTotal: 0);

        context.Debts.Add(debt);
        await context.SaveChangesAsync(cancellationToken);

        return Result<DebtDto>.Success(DebtMapper.ToDto(debt, idEncoder));
    }
}
