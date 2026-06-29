using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Transactions.DTOs;
using QuiteUp.Domain.Entities;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Transactions.Commands.CreateTransaction;

public class CreateTransactionCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<CreateTransactionCommand, Result<TransactionDto>>
{
    public async Task<Result<TransactionDto>> Handle(CreateTransactionCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var account = await context.Accounts
            .FirstOrDefaultAsync(a => a.Id == request.AccountId && a.UserId == userId, cancellationToken);

        if (account is null)
            return Result<TransactionDto>.Failure(Error.NotFound);

        if (request.Type == TransactionType.Transfer)
        {
            if (request.DestinationAccountId is null)
                return Result<TransactionDto>.Failure(Error.TransferRequiresDestination);

            if (request.DestinationAccountId == request.AccountId)
                return Result<TransactionDto>.Failure(Error.SameAccount);

            var destAccount = await context.Accounts
                .FirstOrDefaultAsync(a => a.Id == request.DestinationAccountId && a.UserId == userId, cancellationToken);

            if (destAccount is null)
                return Result<TransactionDto>.Failure(Error.NotFound);
        }

        Debt? linkedDebt = null;
        if (request.DebtId.HasValue && request.Type == TransactionType.Expense)
        {
            linkedDebt = await context.Debts
                .FirstOrDefaultAsync(d => d.Id == request.DebtId.Value && d.UserId == userId, cancellationToken);

            if (linkedDebt is null)
                return Result<TransactionDto>.Failure(Error.NotFound);

            linkedDebt.TotalAmount += request.Amount;
        }

        var transaction = new Transaction
        {
            UserId = userId,
            AccountId = request.AccountId,
            DestinationAccountId = request.Type == TransactionType.Transfer ? request.DestinationAccountId : null,
            CategoryId = request.Type != TransactionType.Transfer ? request.CategoryId : null,
            Type = request.Type,
            Amount = request.Amount,
            Date = request.Date,
            Description = request.Description,
            DebtId = request.DebtId.HasValue && request.Type == TransactionType.Expense ? request.DebtId : null
        };

        context.Transactions.Add(transaction);
        await context.SaveChangesAsync(cancellationToken);

        await context.Transactions.Entry(transaction)
            .Reference(t => t.Account).LoadAsync(cancellationToken);

        if (transaction.DestinationAccountId.HasValue)
            await context.Transactions.Entry(transaction)
                .Reference(t => t.DestinationAccount).LoadAsync(cancellationToken);

        if (transaction.CategoryId.HasValue)
            await context.Transactions.Entry(transaction)
                .Reference(t => t.Category).LoadAsync(cancellationToken);

        if (transaction.DebtId.HasValue)
            transaction.Debt = linkedDebt;

        return Result<TransactionDto>.Success(ToDto(transaction, idEncoder));
    }

    internal static TransactionDto ToDto(Transaction t, IIdEncoder encoder) => new(
        encoder.Encode(t.Id),
        t.Type,
        t.Amount,
        t.Date,
        t.Description,
        encoder.Encode(t.AccountId),
        t.Account.Name,
        t.CategoryId.HasValue ? encoder.Encode(t.CategoryId.Value) : null,
        t.Category?.Name,
        t.DestinationAccountId.HasValue ? encoder.Encode(t.DestinationAccountId.Value) : null,
        t.DestinationAccount?.Name,
        t.DebtId.HasValue ? encoder.Encode(t.DebtId.Value) : null,
        t.Debt?.Name,
        t.CreatedAt);
}
