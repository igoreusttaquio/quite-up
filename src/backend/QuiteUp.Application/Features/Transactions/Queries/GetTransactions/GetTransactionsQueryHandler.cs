using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Transactions.Commands.CreateTransaction;
using QuiteUp.Application.Features.Transactions.DTOs;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Transactions.Queries.GetTransactions;

public class GetTransactionsQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<GetTransactionsQuery, Result<TransactionPageDto>>
{
    public async Task<Result<TransactionPageDto>> Handle(GetTransactionsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var query = context.Transactions
            .Where(t => t.UserId == userId)
            .AsQueryable();

        if (request.AccountId.HasValue)
            query = query.Where(t => t.AccountId == request.AccountId || t.DestinationAccountId == request.AccountId);

        if (request.Type.HasValue)
            query = query.Where(t => t.Type == request.Type.Value);

        if (request.CategoryId.HasValue)
            query = query.Where(t => t.CategoryId == request.CategoryId.Value);

        if (request.StartDate.HasValue)
            query = query.Where(t => t.Date >= request.StartDate.Value);

        if (request.EndDate.HasValue)
            query = query.Where(t => t.Date <= request.EndDate.Value);

        var total = await query.CountAsync(cancellationToken);

        var accountId = request.AccountId;
        var sums = await query
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Income = g.Sum(t => t.Type == TransactionType.Income ? t.Amount : 0),
                Expenses = g.Sum(t => t.Type == TransactionType.Expense ? t.Amount : 0),
                TransfersOut = g.Sum(t => t.Type == TransactionType.Transfer && t.AccountId == accountId ? t.Amount : 0),
                TransfersIn = g.Sum(t => t.Type == TransactionType.Transfer && t.DestinationAccountId == accountId ? t.Amount : 0),
            })
            .FirstOrDefaultAsync(cancellationToken);

        var income = sums?.Income ?? 0;
        var expenses = sums?.Expenses ?? 0;
        // Sem filtro de conta, transferência é neutra (sai de uma conta sua e entra em outra).
        var transfersIn = accountId.HasValue ? sums?.TransfersIn ?? 0 : 0;
        var transfersOut = accountId.HasValue ? sums?.TransfersOut ?? 0 : 0;
        var totals = new TransactionTotalsDto(
            income, expenses, transfersIn, transfersOut,
            income + transfersIn - expenses - transfersOut);

        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize < 1 ? 20 : Math.Min(request.PageSize, 100);

        var items = await query
            .Include(t => t.Account)
            .Include(t => t.DestinationAccount)
            .Include(t => t.Category)
            .Include(t => t.Debt)
            .Include(t => t.Attachment)
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = items.Select(t => CreateTransactionCommandHandler.ToDto(t, idEncoder)).ToList();

        return Result<TransactionPageDto>.Success(new TransactionPageDto(dtos, page, pageSize, total, totals));
    }
}
