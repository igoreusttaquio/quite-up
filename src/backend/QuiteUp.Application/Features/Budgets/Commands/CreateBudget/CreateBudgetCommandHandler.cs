using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Budgets.DTOs;
using QuiteUp.Domain.Entities;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Budgets.Commands.CreateBudget;

public class CreateBudgetCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<CreateBudgetCommand, Result<BudgetDto>>
{
    public async Task<Result<BudgetDto>> Handle(CreateBudgetCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var category = await context.Categories
            .FirstOrDefaultAsync(c => c.Id == request.CategoryId && c.UserId == userId, cancellationToken);

        if (category is null)
            return Result<BudgetDto>.Failure(Error.NotFound);

        var budget = new Budget
        {
            UserId = userId,
            CategoryId = request.CategoryId,
            Amount = request.Amount,
            Month = request.Month,
            Year = request.Year
        };

        context.Budgets.Add(budget);
        await context.SaveChangesAsync(cancellationToken);

        var spent = await CalculateSpent(context, userId, request.CategoryId, request.Month, request.Year, cancellationToken);

        return Result<BudgetDto>.Success(new BudgetDto(
            idEncoder.Encode(budget.Id),
            idEncoder.Encode(budget.CategoryId),
            category.Name,
            budget.Amount,
            spent,
            budget.Amount - spent,
            budget.Month,
            budget.Year,
            budget.CreatedAt));
    }

    internal static async Task<decimal> CalculateSpent(IApplicationDbContext ctx, long userId, long categoryId, int month, int year, CancellationToken cancellationToken)
    {
        var start = new DateOnly(year, month, 1);
        var end = start.AddMonths(1);

        return await ctx.Transactions
            .Where(t => t.UserId == userId
                && t.CategoryId == categoryId
                && t.Type == TransactionType.Expense
                && t.Date >= start
                && t.Date < end)
            .SumAsync(t => (decimal?)t.Amount, cancellationToken) ?? 0;
    }
}
