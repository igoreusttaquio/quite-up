using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Models;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Transactions.Commands.CreateTransaction;
using QuiteUp.Application.Features.Transactions.DTOs;

namespace QuiteUp.Application.Features.Transactions.Queries.GetTransactions;

public class GetTransactionsQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<GetTransactionsQuery, Result<PagedResult<TransactionDto>>>
{
    public async Task<Result<PagedResult<TransactionDto>>> Handle(GetTransactionsQuery request, CancellationToken cancellationToken)
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

        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize < 1 ? 20 : Math.Min(request.PageSize, 100);

        var items = await query
            .Include(t => t.Account)
            .Include(t => t.DestinationAccount)
            .Include(t => t.Category)
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = items.Select(t => CreateTransactionCommandHandler.ToDto(t, idEncoder)).ToList();

        return Result<PagedResult<TransactionDto>>.Success(new PagedResult<TransactionDto>(dtos, page, pageSize, total));
    }
}
