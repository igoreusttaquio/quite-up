using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Debts.Commands.DeleteDebtPayment;

public class DeleteDebtPaymentCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser) : IRequestHandler<DeleteDebtPaymentCommand, Result>
{
    public async Task<Result> Handle(DeleteDebtPaymentCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var payment = await context.DebtPayments
            .Include(dp => dp.Debt)
            .Include(dp => dp.Transaction)
            .FirstOrDefaultAsync(dp => dp.Id == request.PaymentId && dp.DebtId == request.DebtId && dp.UserId == userId, cancellationToken);

        if (payment is null)
            return Result.Failure(Error.NotFound);

        var debt = payment.Debt;
        debt.PaidAmount = Math.Max(0, debt.PaidAmount - payment.Amount);
        debt.IsPaid = debt.PaidAmount >= debt.TotalAmount;

        // Removing the payment also gives the money back to the account it was paid from.
        if (payment.Transaction is not null)
            context.Transactions.Remove(payment.Transaction);

        context.DebtPayments.Remove(payment);
        await context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
