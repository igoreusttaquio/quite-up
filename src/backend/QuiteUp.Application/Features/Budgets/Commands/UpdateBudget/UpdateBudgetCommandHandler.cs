using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Budgets.Commands.CreateBudget;
using QuiteUp.Application.Features.Budgets.DTOs;

namespace QuiteUp.Application.Features.Budgets.Commands.UpdateBudget;

public class UpdateBudgetCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<UpdateBudgetCommand, Result<BudgetDto>>
{
    public async Task<Result<BudgetDto>> Handle(UpdateBudgetCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var budget = await context.Budgets
            .Include(b => b.Category)
            .FirstOrDefaultAsync(b => b.Id == request.Id && b.UserId == userId, cancellationToken);

        if (budget is null)
            return Result<BudgetDto>.Failure(Error.NotFound);

        budget.CategoryId = request.CategoryId;
        budget.Amount = request.Amount;
        budget.Month = request.Month;
        budget.Year = request.Year;

        await context.SaveChangesAsync(cancellationToken);

        if (budget.Category is null)
            await context.Budgets.Entry(budget).Reference(b => b.Category).LoadAsync(cancellationToken);

        var spent = await CreateBudgetCommandHandler.CalculateSpent(context, userId, budget.CategoryId, budget.Month, budget.Year, cancellationToken);

        return Result<BudgetDto>.Success(new BudgetDto(
            idEncoder.Encode(budget.Id),
            idEncoder.Encode(budget.CategoryId),
            budget.Category!.Name,
            budget.Amount,
            spent,
            budget.Amount - spent,
            budget.Month,
            budget.Year,
            budget.CreatedAt));
    }
}
