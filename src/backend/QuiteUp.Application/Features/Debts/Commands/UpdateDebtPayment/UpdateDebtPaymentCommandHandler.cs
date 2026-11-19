using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Debts.DTOs;
using QuiteUp.Domain.Entities;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Debts.Commands.UpdateDebtPayment;

public class UpdateDebtPaymentCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<UpdateDebtPaymentCommand, Result<DebtPaymentDto>>
{
    public async Task<Result<DebtPaymentDto>> Handle(UpdateDebtPaymentCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var payment = await context.DebtPayments
            .Include(dp => dp.Debt)
            .Include(dp => dp.Account)
            .Include(dp => dp.Transaction)
            .ThenInclude(t => t!.Attachment)
            .FirstOrDefaultAsync(dp => dp.Id == request.PaymentId && dp.DebtId == request.DebtId && dp.UserId == userId, cancellationToken);

        if (payment is null)
            return Result<DebtPaymentDto>.Failure(Error.NotFound);

        Account? account = null;
        if (request.AccountId.HasValue)
        {
            account = await context.Accounts
                .FirstOrDefaultAsync(a => a.Id == request.AccountId.Value && a.UserId == userId, cancellationToken);
            if (account is null)
                return Result<DebtPaymentDto>.Failure(Error.NotFound);
        }

        var debt = payment.Debt;

        // Reflect the new amount on the debt.
        debt.PaidAmount += request.Amount - payment.Amount;
        debt.IsPaid = debt.PaidAmount >= debt.TotalAmount;

        payment.Amount = request.Amount;
        payment.PaymentDate = request.PaymentDate;
        payment.IsEarlyPayment = request.IsEarlyPayment;
        payment.Discount = request.Discount;
        payment.Notes = request.Notes;
        payment.AccountId = account?.Id;
        payment.Account = account;

        // Keep the expense transaction that moved money out of the account in sync.
        var netAmount = request.Amount - request.Discount;
        var transaction = payment.Transaction;

        if (account is not null && netAmount > 0)
        {
            if (transaction is null)
            {
                transaction = new Transaction
                {
                    UserId = userId,
                    Type = TransactionType.Expense,
                    Description = $"Pagamento: {debt.Name}"
                };
                context.Transactions.Add(transaction);
                payment.Transaction = transaction;
            }

            transaction.AccountId = account.Id;
            transaction.Account = account;
            transaction.Amount = netAmount;
            transaction.Date = request.PaymentDate;
        }
        else if (transaction is not null)
        {
            payment.Transaction = null;
            payment.TransactionId = null;
            context.Transactions.Remove(transaction);
            transaction = null;
        }

        await context.SaveChangesAsync(cancellationToken);

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
            account?.Name,
            transaction is not null ? idEncoder.Encode(transaction.Id) : null,
            transaction?.Attachment is not null ? idEncoder.Encode(transaction.Attachment.Id) : null,
            transaction?.Attachment?.FileName,
            transaction?.Attachment?.ContentType,
            transaction?.Attachment?.FileSize,
            payment.CreatedAt);

        return Result<DebtPaymentDto>.Success(dto);
    }
}
