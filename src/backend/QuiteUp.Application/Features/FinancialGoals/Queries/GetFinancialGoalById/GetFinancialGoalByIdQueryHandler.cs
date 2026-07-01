using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.FinancialGoals.Commands.CreateFinancialGoal;
using QuiteUp.Application.Features.FinancialGoals.DTOs;

namespace QuiteUp.Application.Features.FinancialGoals.Queries.GetFinancialGoalById;

public class GetFinancialGoalByIdQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<GetFinancialGoalByIdQuery, Result<FinancialGoalDto>>
{
    public async Task<Result<FinancialGoalDto>> Handle(GetFinancialGoalByIdQuery request, CancellationToken cancellationToken)
    {
        var goal = await context.FinancialGoals
            .FirstOrDefaultAsync(g => g.Id == request.Id && g.UserId == currentUser.UserId, cancellationToken);

        if (goal is null)
            return Result<FinancialGoalDto>.Failure(Error.NotFound);

        return Result<FinancialGoalDto>.Success(CreateFinancialGoalCommandHandler.ToDto(goal, idEncoder));
    }
}
