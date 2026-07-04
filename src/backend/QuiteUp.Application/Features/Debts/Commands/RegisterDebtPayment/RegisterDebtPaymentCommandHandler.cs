using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Events;
using QuiteUp.Application.Features.Debts.DTOs;
using QuiteUp.Domain.Entities;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Debts.Commands.RegisterDebtPayment;

public class RegisterDebtPaymentCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder,
    IEventBus eventBus) : IRequestHandler<RegisterDebtPaymentCommand, Result<DebtPaymentDto>>
{
    public async Task<Result<DebtPaymentDto>> Handle(RegisterDebtPaymentCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var debt = await context.Debts
            .FirstOrDefaultAsync(d => d.Id == request.DebtId && d.UserId == userId, cancellationToken);

        if (debt is null)
            return Result<DebtPaymentDto>.Failure(Error.NotFound);

        Account? sourceAccount = null;
        Transaction? autoTransaction = null;
        if (request.AccountId.HasValue)
        {
            sourceAccount = await context.Accounts
                .FirstOrDefaultAsync(a => a.Id == request.AccountId.Value && a.UserId == userId, cancellationToken);

            if (sourceAccount is null)
                return Result<DebtPaymentDto>.Failure(Error.NotFound);

            var netAmount = request.Amount - request.Discount;
                if (netAmount > 0)
                {
                    autoTransaction = new Transaction
                    {
                        UserId = userId,
                        AccountId = request.AccountId.Value,
                        Type = TransactionType.Expense,
                        Amount = netAmount,
                        Date = request.PaymentDate,
                        Description = $"Pagamento: {debt.Name}"
                    };
                    context.Transactions.Add(autoTransaction);
                }
        }

        var payment = new DebtPayment
        {
            UserId = userId,
            DebtId = request.DebtId,
            Amount = request.Amount,
            PaymentDate = request.PaymentDate,
            IsEarlyPayment = request.IsEarlyPayment,
            Discount = request.Discount,
            Notes = request.Notes,
            AccountId = request.AccountId,
            TransactionId = autoTransaction?.Id
        };

        context.DebtPayments.Add(payment);

        debt.PaidAmount += request.Amount;

        if (debt.PaidAmount >= debt.TotalAmount)
        {
            debt.IsPaid = true;

            // TODO: Gamification — check for progress milestones and award points
            await eventBus.PublishAsync(
                new DebtPaidOffEvent(userId, debt.Id, debt.Name, debt.TotalAmount), cancellationToken);
        }

        await context.SaveChangesAsync(cancellationToken);

        if (payment.TransactionId.HasValue)
            await context.DebtPayments.Entry(payment)
                .Reference(dp => dp.Transaction)
                .Query()
                .Include(t => t!.Attachment)
                .LoadAsync(cancellationToken);

        var dto = new DebtPaymentDto(
            idEncoder.Encode(payment.Id),
            idEncoder.Encode(debt.Id),
            debt.Name,
            payment.Amount,
            payment.PaymentDate,
            payment.IsEarlyPayment,
            payment.Discount,
            payment.Notes,
            payment.AccountId.HasValue ? idEncoder.Encode(payment.AccountId.Value) : null,
            sourceAccount?.Name,
            payment.TransactionId.HasValue ? idEncoder.Encode(payment.TransactionId.Value) : null,
            payment.Transaction?.Attachment is not null ? idEncoder.Encode(payment.Transaction.Attachment.Id) : null,
            payment.Transaction?.Attachment?.FileName,
            payment.Transaction?.Attachment?.ContentType,
            payment.Transaction?.Attachment?.FileSize,
            payment.CreatedAt);

        return Result<DebtPaymentDto>.Success(dto);
    }
}
