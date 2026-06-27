using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Budgets.Commands.CreateBudget;
using QuiteUp.Application.Features.Budgets.DTOs;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Budgets.Queries.GetBudgets;

public class GetBudgetsQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<GetBudgetsQuery, Result<IReadOnlyList<BudgetDto>>>
{
    public async Task<Result<IReadOnlyList<BudgetDto>>> Handle(GetBudgetsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var query = context.Budgets
            .Include(b => b.Category)
            .Where(b => b.UserId == userId)
            .AsQueryable();

        if (request.Month.HasValue)
            query = query.Where(b => b.Month == request.Month.Value);

        if (request.Year.HasValue)
            query = query.Where(b => b.Year == request.Year.Value);

        var budgets = await query.ToListAsync(cancellationToken);

        var dtos = new List<BudgetDto>(budgets.Count);

        foreach (var budget in budgets)
        {
            var spent = await CreateBudgetCommandHandler.CalculateSpent(context, userId, budget.CategoryId, budget.Month, budget.Year, cancellationToken);

            dtos.Add(new BudgetDto(
                idEncoder.Encode(budget.Id),
                idEncoder.Encode(budget.CategoryId),
                budget.Category?.Name,
                budget.Amount,
                spent,
                budget.Amount - spent,
                budget.Month,
                budget.Year,
                budget.CreatedAt));
        }

        return Result<IReadOnlyList<BudgetDto>>.Success(dtos);
    }
}
