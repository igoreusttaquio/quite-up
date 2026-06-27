using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.FinancialGoals.DTOs;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Application.Features.FinancialGoals.Commands.AddGoalContribution;

public class AddGoalContributionCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<AddGoalContributionCommand, Result<GoalContributionDto>>
{
    public async Task<Result<GoalContributionDto>> Handle(AddGoalContributionCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var goal = await context.FinancialGoals
            .FirstOrDefaultAsync(g => g.Id == request.FinancialGoalId && g.UserId == userId, cancellationToken);

        if (goal is null)
            return Result<GoalContributionDto>.Failure(Error.NotFound);

        var contribution = new GoalContribution
        {
            UserId = userId,
            FinancialGoalId = request.FinancialGoalId,
            Amount = request.Amount,
            Date = request.Date,
            Notes = request.Notes
        };

        goal.CurrentAmount += request.Amount;

        if (goal.CurrentAmount >= goal.TargetAmount)
            goal.IsCompleted = true;

        context.GoalContributions.Add(contribution);
        await context.SaveChangesAsync(cancellationToken);

        return Result<GoalContributionDto>.Success(new GoalContributionDto(
            idEncoder.Encode(contribution.Id),
            idEncoder.Encode(contribution.FinancialGoalId),
            contribution.Amount,
            contribution.Date,
            contribution.Notes,
            contribution.CreatedAt));
    }
}
