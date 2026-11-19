using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Dashboard.DTOs;
using QuiteUp.Application.Features.Transactions.Commands.CreateTransaction;
using QuiteUp.Domain.Entities;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Dashboard.Queries.GetDashboardSummary;

public class GetDashboardSummaryQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<GetDashboardSummaryQuery, Result<DashboardSummaryDto>>
{
    private const int DailySeriesMaxDays = 31;

    public async Task<Result<DashboardSummaryDto>> Handle(GetDashboardSummaryQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var startDate = request.StartDate ?? new DateOnly(today.Year, today.Month, 1);
        var endDate = request.EndDate ?? startDate.AddMonths(1).AddDays(-1);
        if (endDate < startDate)
            (startDate, endDate) = (endDate, startDate);

        // Saldo atual: mesma regra das contas (transações com data futura ainda não contam).
        var accounts = await context.Accounts
            .Where(a => a.UserId == userId && a.IsActive)
            .Include(a => a.Transactions.Where(t => t.Date <= today))
            .Include(a => a.IncomingTransfers.Where(t => t.Date <= today))
            .ToListAsync(cancellationToken);

        var totalBalance = accounts.Sum(a =>
        {
            var income = a.Transactions.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount);
            var expense = a.Transactions.Where(t => t.Type is TransactionType.Expense or TransactionType.Transfer).Sum(t => t.Amount);
            var incoming = a.IncomingTransfers.Sum(t => t.Amount);
            return a.InitialBalance + income - expense + incoming;
        });

        // Transactions in the period that match the filters (type + category).
        var filtered = context.Transactions
            .Where(t => t.UserId == userId && t.Date >= startDate && t.Date <= endDate);

        if (request.Type.HasValue)
            filtered = filtered.Where(t => t.Type == request.Type.Value);

        if (request.CategoryId.HasValue)
            filtered = filtered.Where(t => t.CategoryId == request.CategoryId.Value);

        var periodTransactions = await filtered
            .Include(t => t.Category)
            .ToListAsync(cancellationToken);

        var incomes = periodTransactions.Where(t => t.Type == TransactionType.Income).ToList();
        var expenses = periodTransactions.Where(t => t.Type == TransactionType.Expense).ToList();

        var periodIncome = incomes.Sum(t => t.Amount);
        var periodExpenses = expenses.Sum(t => t.Amount);

        var daily = endDate.DayNumber - startDate.DayNumber + 1 <= DailySeriesMaxDays;
        var series = BuildSeries(periodTransactions, startDate, endDate, daily);

        var recentTransactions = await filtered
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.Id)
            .Take(8)
            .Include(t => t.Account)
            .Include(t => t.Category)
            .Include(t => t.DestinationAccount)
            .Include(t => t.Debt)
            .Include(t => t.Attachment)
            .ToListAsync(cancellationToken);

        var dto = new DashboardSummaryDto(
            startDate,
            endDate,
            totalBalance,
            periodIncome,
            periodExpenses,
            daily ? "day" : "month",
            series,
            GroupByCategory(expenses),
            GroupByCategory(incomes),
            recentTransactions.Select(t => CreateTransactionCommandHandler.ToDto(t, idEncoder)).ToList());

        return Result<DashboardSummaryDto>.Success(dto);
    }

    private static List<DashboardSeriesPointDto> BuildSeries(
        List<Transaction> transactions, DateOnly startDate, DateOnly endDate, bool daily)
    {
        DateOnly Bucket(DateOnly d) => daily ? d : new DateOnly(d.Year, d.Month, 1);

        var grouped = transactions
            .GroupBy(t => Bucket(t.Date))
            .ToDictionary(g => g.Key, g => (
                Income: g.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount),
                Expenses: g.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount)));

        var points = new List<DashboardSeriesPointDto>();
        var cursor = Bucket(startDate);
        var last = Bucket(endDate);

        while (cursor <= last)
        {
            var (income, expense) = grouped.TryGetValue(cursor, out var v) ? v : (0m, 0m);
            points.Add(new DashboardSeriesPointDto(cursor, income, expense, income - expense));
            cursor = daily ? cursor.AddDays(1) : cursor.AddMonths(1);
        }

        return points;
    }

    private List<DashboardCategoryItemDto> GroupByCategory(List<Transaction> transactions)
    {
        var total = transactions.Sum(t => t.Amount);

        return transactions
            .GroupBy(t => t.CategoryId)
            .Select(g =>
            {
                var sum = g.Sum(t => t.Amount);
                var category = g.First().Category;
                return new DashboardCategoryItemDto(
                    g.Key.HasValue ? idEncoder.Encode(g.Key.Value) : null,
                    category?.Name ?? "Sem categoria",
                    category?.Color,
                    sum,
                    g.Count(),
                    total > 0 ? Math.Round(sum / total * 100, 2) : 0);
            })
            .OrderByDescending(c => c.TotalAmount)
            .ToList();
    }
}
