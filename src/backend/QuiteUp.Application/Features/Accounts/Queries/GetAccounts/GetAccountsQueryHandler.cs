using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Accounts.DTOs;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Accounts.Queries.GetAccounts;

public class GetAccountsQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<GetAccountsQuery, Result<IReadOnlyList<AccountDto>>>
{
    public async Task<Result<IReadOnlyList<AccountDto>>> Handle(GetAccountsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var accounts = await context.Accounts
            .Where(a => a.UserId == userId && (request.IncludeInactive || a.IsActive))
            .Include(a => a.Transactions.Where(t => t.Date <= today))
            .Include(a => a.IncomingTransfers.Where(t => t.Date <= today))
            .OrderBy(a => a.Name)
            .ToListAsync(cancellationToken);

        var dtos = accounts.Select(a =>
        {
            var income = a.Transactions
                .Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount);
            var expense = a.Transactions
                .Where(t => t.Type == TransactionType.Expense || t.Type == TransactionType.Transfer).Sum(t => t.Amount);
            var incoming = a.IncomingTransfers.Sum(t => t.Amount);
            var balance = a.InitialBalance + income - expense + incoming;

            return new AccountDto(
                idEncoder.Encode(a.Id),
                a.Name,
                a.Type,
                a.InitialBalance,
                balance,
                a.IsActive,
                a.CreatedAt);
        }).ToList();

        return Result<IReadOnlyList<AccountDto>>.Success(dtos);
    }
}
