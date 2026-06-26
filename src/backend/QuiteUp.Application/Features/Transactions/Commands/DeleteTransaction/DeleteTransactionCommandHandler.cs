using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Transactions.Commands.DeleteTransaction;

public class DeleteTransactionCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser) : IRequestHandler<DeleteTransactionCommand, Result>
{
    public async Task<Result> Handle(DeleteTransactionCommand request, CancellationToken cancellationToken)
    {
        var transaction = await context.Transactions
            .FirstOrDefaultAsync(t => t.Id == request.Id && t.UserId == currentUser.UserId, cancellationToken);

        if (transaction is null)
            return Result.Failure(Error.NotFound);

        context.Transactions.Remove(transaction);
        await context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
