using NetDevPack.SimpleMediator;
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
            .Include(d => d.Payments)
            .FirstOrDefaultAsync(d => d.Id == request.Id && d.UserId == currentUser.UserId, cancellationToken);

        if (debt is null)
            return Result<DebtDto>.Failure(Error.NotFound);

        // Salvar o formulário confirma os dados (limpa "revisar dados" de dívidas migradas).
        request.Input.ApplyTo(debt);
        DebtInput.RecomputePaid(debt, debt.Payments.Sum(p => p.Amount));

        await context.SaveChangesAsync(cancellationToken);
        return Result<DebtDto>.Success(DebtMapper.ToDto(debt, idEncoder));
    }
}
