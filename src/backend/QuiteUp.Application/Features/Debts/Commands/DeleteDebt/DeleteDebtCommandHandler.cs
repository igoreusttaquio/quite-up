using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Debts.Commands.DeleteDebt;

public class DeleteDebtCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser) : IRequestHandler<DeleteDebtCommand, Result>
{
    public async Task<Result> Handle(DeleteDebtCommand request, CancellationToken cancellationToken)
    {
        var debt = await context.Debts
            .FirstOrDefaultAsync(d => d.Id == request.Id && d.UserId == currentUser.UserId, cancellationToken);

        if (debt is null)
            return Result.Failure(Error.NotFound);

        context.Debts.Remove(debt);
        await context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
