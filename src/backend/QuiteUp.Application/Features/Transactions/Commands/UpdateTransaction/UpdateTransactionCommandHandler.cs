using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Transactions.Commands.CreateTransaction;
using QuiteUp.Application.Features.Transactions.DTOs;

namespace QuiteUp.Application.Features.Transactions.Commands.UpdateTransaction;

public class UpdateTransactionCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<UpdateTransactionCommand, Result<TransactionDto>>
{
    public async Task<Result<TransactionDto>> Handle(UpdateTransactionCommand request, CancellationToken cancellationToken)
    {
        var transaction = await context.Transactions
            .Include(t => t.Account)
            .Include(t => t.DestinationAccount)
            .Include(t => t.Category)
            .FirstOrDefaultAsync(t => t.Id == request.Id && t.UserId == currentUser.UserId, cancellationToken);

        if (transaction is null)
            return Result<TransactionDto>.Failure(Error.NotFound);

        transaction.Amount = request.Amount;
        transaction.Date = request.Date;
        transaction.Description = request.Description;

        if (transaction.CategoryId != request.CategoryId)
            transaction.CategoryId = request.CategoryId;

        await context.SaveChangesAsync(cancellationToken);

        if (transaction.CategoryId.HasValue && transaction.Category is null)
            await context.Transactions.Entry(transaction).Reference(t => t.Category).LoadAsync(cancellationToken);

        return Result<TransactionDto>.Success(CreateTransactionCommandHandler.ToDto(transaction, idEncoder));
    }
}
