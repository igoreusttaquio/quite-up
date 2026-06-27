using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Budgets.Commands.DeleteBudget;

public class DeleteBudgetCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser) : IRequestHandler<DeleteBudgetCommand, Result>
{
    public async Task<Result> Handle(DeleteBudgetCommand request, CancellationToken cancellationToken)
    {
        var budget = await context.Budgets
            .FirstOrDefaultAsync(b => b.Id == request.Id && b.UserId == currentUser.UserId, cancellationToken);

        if (budget is null)
            return Result.Failure(Error.NotFound);

        context.Budgets.Remove(budget);
        await context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
