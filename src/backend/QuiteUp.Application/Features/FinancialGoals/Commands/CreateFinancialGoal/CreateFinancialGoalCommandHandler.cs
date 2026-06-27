using MediatR;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.FinancialGoals.DTOs;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Application.Features.FinancialGoals.Commands.CreateFinancialGoal;

public class CreateFinancialGoalCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<CreateFinancialGoalCommand, Result<FinancialGoalDto>>
{
    public async Task<Result<FinancialGoalDto>> Handle(CreateFinancialGoalCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var goal = new FinancialGoal
        {
            UserId = userId,
            Name = request.Name,
            TargetAmount = request.TargetAmount,
            TargetDate = request.TargetDate
        };

        context.FinancialGoals.Add(goal);
        await context.SaveChangesAsync(cancellationToken);

        return Result<FinancialGoalDto>.Success(ToDto(goal, idEncoder));
    }

    internal static FinancialGoalDto ToDto(FinancialGoal goal, IIdEncoder encoder) => new(
        encoder.Encode(goal.Id),
        goal.Name,
        goal.TargetAmount,
        goal.CurrentAmount,
        goal.TargetAmount > 0 ? Math.Round(goal.CurrentAmount / goal.TargetAmount * 100, 2) : 0,
        goal.TargetDate,
        goal.IsCompleted,
        goal.CreatedAt);
}
