using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.FinancialGoals.Commands.CreateFinancialGoal;
using QuiteUp.Application.Features.FinancialGoals.DTOs;

namespace QuiteUp.Application.Features.FinancialGoals.Queries.GetFinancialGoals;

public class GetFinancialGoalsQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<GetFinancialGoalsQuery, Result<IReadOnlyList<FinancialGoalDto>>>
{
    public async Task<Result<IReadOnlyList<FinancialGoalDto>>> Handle(GetFinancialGoalsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var query = context.FinancialGoals
            .Where(g => g.UserId == userId)
            .AsQueryable();

        if (request.IsCompleted.HasValue)
            query = query.Where(g => g.IsCompleted == request.IsCompleted.Value);

        var goals = await query
            .OrderByDescending(g => g.CreatedAt)
            .ToListAsync(cancellationToken);

        var dtos = goals.Select(g => CreateFinancialGoalCommandHandler.ToDto(g, idEncoder)).ToList();

        return Result<IReadOnlyList<FinancialGoalDto>>.Success(dtos);
    }
}
