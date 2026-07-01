using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.FinancialGoals.Commands.DeleteFinancialGoal;

public class DeleteFinancialGoalCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser) : IRequestHandler<DeleteFinancialGoalCommand, Result>
{
    public async Task<Result> Handle(DeleteFinancialGoalCommand request, CancellationToken cancellationToken)
    {
        var goal = await context.FinancialGoals
            .FirstOrDefaultAsync(g => g.Id == request.Id && g.UserId == currentUser.UserId, cancellationToken);

        if (goal is null)
            return Result.Failure(Error.NotFound);

        context.FinancialGoals.Remove(goal);
        await context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
