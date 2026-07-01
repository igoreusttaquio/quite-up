using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.FinancialGoals.DTOs;

namespace QuiteUp.Application.Features.FinancialGoals.Queries.GetGoalContributions;

public class GetGoalContributionsQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<GetGoalContributionsQuery, Result<IReadOnlyList<GoalContributionDto>>>
{
    public async Task<Result<IReadOnlyList<GoalContributionDto>>> Handle(GetGoalContributionsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var goal = await context.FinancialGoals
            .FirstOrDefaultAsync(g => g.Id == request.FinancialGoalId && g.UserId == userId, cancellationToken);

        if (goal is null)
            return Result<IReadOnlyList<GoalContributionDto>>.Failure(Error.NotFound);

        var contributions = await context.GoalContributions
            .Where(gc => gc.FinancialGoalId == request.FinancialGoalId)
            .OrderByDescending(gc => gc.Date)
            .ThenByDescending(gc => gc.CreatedAt)
            .ToListAsync(cancellationToken);

        var dtos = contributions.Select(gc => new GoalContributionDto(
            idEncoder.Encode(gc.Id),
            idEncoder.Encode(gc.FinancialGoalId),
            gc.Amount,
            gc.Date,
            gc.Notes,
            gc.CreatedAt
        )).ToList();

        return Result<IReadOnlyList<GoalContributionDto>>.Success(dtos);
    }
}
