using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.FinancialGoals.Commands.CreateFinancialGoal;
using QuiteUp.Application.Features.FinancialGoals.DTOs;

namespace QuiteUp.Application.Features.FinancialGoals.Commands.UpdateFinancialGoal;

public class UpdateFinancialGoalCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<UpdateFinancialGoalCommand, Result<FinancialGoalDto>>
{
    public async Task<Result<FinancialGoalDto>> Handle(UpdateFinancialGoalCommand request, CancellationToken cancellationToken)
    {
        var goal = await context.FinancialGoals
            .FirstOrDefaultAsync(g => g.Id == request.Id && g.UserId == currentUser.UserId, cancellationToken);

        if (goal is null)
            return Result<FinancialGoalDto>.Failure(Error.NotFound);

        goal.Name = request.Name;
        goal.TargetAmount = request.TargetAmount;
        goal.TargetDate = request.TargetDate;

        await context.SaveChangesAsync(cancellationToken);

        return Result<FinancialGoalDto>.Success(CreateFinancialGoalCommandHandler.ToDto(goal, idEncoder));
    }
}
