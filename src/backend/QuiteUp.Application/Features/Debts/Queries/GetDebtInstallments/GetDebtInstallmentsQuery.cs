using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Debts.DTOs;

namespace QuiteUp.Application.Features.Debts.Queries.GetDebtInstallments;

/// <summary>Cronograma de parcelas (número, valor, vencimento, status) de uma dívida parcelada.</summary>
public record GetDebtInstallmentsQuery(long DebtId) : IRequest<Result<IReadOnlyList<InstallmentDto>>>;

public class GetDebtInstallmentsQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser) : IRequestHandler<GetDebtInstallmentsQuery, Result<IReadOnlyList<InstallmentDto>>>
{
    public async Task<Result<IReadOnlyList<InstallmentDto>>> Handle(GetDebtInstallmentsQuery request, CancellationToken cancellationToken)
    {
        var debt = await context.Debts
            .FirstOrDefaultAsync(d => d.Id == request.DebtId && d.UserId == currentUser.UserId, cancellationToken);

        return debt is null
            ? Result<IReadOnlyList<InstallmentDto>>.Failure(Error.NotFound)
            : Result<IReadOnlyList<InstallmentDto>>.Success(DebtMapper.Installments(debt));
    }
}
