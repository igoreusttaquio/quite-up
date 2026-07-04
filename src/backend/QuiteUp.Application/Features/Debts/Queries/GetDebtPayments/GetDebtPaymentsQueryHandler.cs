using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Debts.DTOs;

namespace QuiteUp.Application.Features.Debts.Queries.GetDebtPayments;

public class GetDebtPaymentsQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<GetDebtPaymentsQuery, Result<IReadOnlyList<DebtPaymentDto>>>
{
    public async Task<Result<IReadOnlyList<DebtPaymentDto>>> Handle(GetDebtPaymentsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var payments = await context.DebtPayments
            .Include(dp => dp.Debt)
            .Include(dp => dp.Account)
            .Include(dp => dp.Transaction)
            .ThenInclude(t => t!.Attachment)
            .Where(dp => dp.DebtId == request.DebtId && dp.UserId == userId)
            .OrderByDescending(dp => dp.PaymentDate)
            .ThenByDescending(dp => dp.Id)
            .ToListAsync(cancellationToken);

        var dtos = payments.Select(dp => new DebtPaymentDto(
            idEncoder.Encode(dp.Id),
            idEncoder.Encode(dp.DebtId),
            dp.Debt.Name,
            dp.Amount,
            dp.PaymentDate,
            dp.IsEarlyPayment,
            dp.Discount,
            dp.Notes,
            dp.AccountId.HasValue ? idEncoder.Encode(dp.AccountId.Value) : null,
            dp.Account?.Name,
            dp.TransactionId.HasValue ? idEncoder.Encode(dp.TransactionId.Value) : null,
            dp.Transaction?.Attachment is not null ? idEncoder.Encode(dp.Transaction.Attachment.Id) : null,
            dp.Transaction?.Attachment?.FileName,
            dp.Transaction?.Attachment?.ContentType,
            dp.Transaction?.Attachment?.FileSize,
            dp.CreatedAt
        )).ToList();

        return Result<IReadOnlyList<DebtPaymentDto>>.Success(dtos);
    }
}
