using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Transactions.Commands.CreateTransaction;
using QuiteUp.Application.Features.Transactions.DTOs;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Transactions.Commands.UpdateTransaction;

public class UpdateTransactionCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<UpdateTransactionCommand, Result<TransactionDto>>
{
    public async Task<Result<TransactionDto>> Handle(UpdateTransactionCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var transaction = await context.Transactions
            .Include(t => t.Account)
            .Include(t => t.DestinationAccount)
            .Include(t => t.Category)
            .Include(t => t.Debt)
            .Include(t => t.Attachment)
            .FirstOrDefaultAsync(t => t.Id == request.Id && t.UserId == userId, cancellationToken);

        if (transaction is null)
            return Result<TransactionDto>.Failure(Error.NotFound);

        var accountId = request.AccountId ?? transaction.AccountId;

        if (accountId != transaction.AccountId)
        {
            var account = await context.Accounts
                .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId, cancellationToken);
            if (account is null)
                return Result<TransactionDto>.Failure(Error.NotFound);

            transaction.AccountId = account.Id;
            transaction.Account = account;
        }

        if (transaction.Type == TransactionType.Transfer)
        {
            var destinationId = request.DestinationAccountId ?? transaction.DestinationAccountId;

            if (destinationId is null)
                return Result<TransactionDto>.Failure(Error.TransferRequiresDestination);

            if (destinationId == transaction.AccountId)
                return Result<TransactionDto>.Failure(Error.SameAccount);

            if (destinationId != transaction.DestinationAccountId)
            {
                var destination = await context.Accounts
                    .FirstOrDefaultAsync(a => a.Id == destinationId && a.UserId == userId, cancellationToken);
                if (destination is null)
                    return Result<TransactionDto>.Failure(Error.NotFound);

                transaction.DestinationAccountId = destination.Id;
                transaction.DestinationAccount = destination;
            }

            // Transfers never carry a category.
            transaction.CategoryId = null;
            transaction.Category = null;
        }
        else if (transaction.CategoryId != request.CategoryId)
        {
            // Only the FK changes; EF fixes up the navigation on SaveChanges.
            transaction.CategoryId = request.CategoryId;
        }

        if (transaction.DebtId.HasValue && transaction.Type == TransactionType.Expense && transaction.Amount != request.Amount)
            transaction.Debt!.TotalAmount += request.Amount - transaction.Amount;

        transaction.Amount = request.Amount;
        transaction.Date = request.Date;
        transaction.Description = request.Description;

        await context.SaveChangesAsync(cancellationToken);

        if (transaction.CategoryId.HasValue && transaction.Category is null)
            await context.Transactions.Entry(transaction).Reference(t => t.Category).LoadAsync(cancellationToken);

        return Result<TransactionDto>.Success(CreateTransactionCommandHandler.ToDto(transaction, idEncoder));
    }
}
