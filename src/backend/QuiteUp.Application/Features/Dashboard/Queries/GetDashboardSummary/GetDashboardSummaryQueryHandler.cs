using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Dashboard.DTOs;
using QuiteUp.Application.Features.Transactions.DTOs;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Dashboard.Queries.GetDashboardSummary;

public class GetDashboardSummaryQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<GetDashboardSummaryQuery, Result<DashboardSummaryDto>>
{
    public async Task<Result<DashboardSummaryDto>> Handle(GetDashboardSummaryQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var monthStart = new DateOnly(today.Year, today.Month, 1);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);

        var accounts = await context.Accounts
            .Where(a => a.UserId == userId && a.IsActive)
            .Include(a => a.Transactions)
            .Include(a => a.IncomingTransfers)
            .ToListAsync(cancellationToken);

        var totalBalance = accounts.Sum(a =>
        {
            var income = a.Transactions.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount);
            var expense = a.Transactions.Where(t => t.Type is TransactionType.Expense or TransactionType.Transfer).Sum(t => t.Amount);
            var incoming = a.IncomingTransfers.Sum(t => t.Amount);
            return a.InitialBalance + income - expense + incoming;
        });

        var monthlyTransactions = await context.Transactions
            .Where(t => t.UserId == userId && t.Date >= monthStart && t.Date <= monthEnd)
            .ToListAsync(cancellationToken);

        var monthlyIncome = monthlyTransactions
            .Where(t => t.Type == TransactionType.Income)
            .Sum(t => t.Amount);

        var monthlyExpenses = monthlyTransactions
            .Where(t => t.Type == TransactionType.Expense)
            .Sum(t => t.Amount);

        var recentTransactions = await context.Transactions
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.Id)
            .Take(8)
            .Include(t => t.Account)
            .Include(t => t.Category)
            .Include(t => t.DestinationAccount)
            .ToListAsync(cancellationToken);

        var recentDtos = recentTransactions.Select(t => new TransactionDto(
            idEncoder.Encode(t.Id),
            t.Type,
            t.Amount,
            t.Date,
            t.Description,
            idEncoder.Encode(t.AccountId),
            t.Account.Name,
            t.CategoryId != null ? idEncoder.Encode(t.CategoryId.Value) : null,
            t.Category?.Name,
            t.DestinationAccountId != null ? idEncoder.Encode(t.DestinationAccountId.Value) : null,
            t.DestinationAccount?.Name,
            t.CreatedAt
        )).ToList();

        var dto = new DashboardSummaryDto(totalBalance, monthlyIncome, monthlyExpenses, recentDtos);
        return Result<DashboardSummaryDto>.Success(dto);
    }
}
