using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Accounts.DTOs;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Accounts.Queries.GetAccountById;

public class GetAccountByIdQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<GetAccountByIdQuery, Result<AccountDto>>
{
    public async Task<Result<AccountDto>> Handle(GetAccountByIdQuery request, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var account = await context.Accounts
            .Where(a => a.Id == request.Id && a.UserId == currentUser.UserId)
            .Include(a => a.Transactions.Where(t => t.Date <= today))
            .Include(a => a.IncomingTransfers.Where(t => t.Date <= today))
            .FirstOrDefaultAsync(cancellationToken);

        if (account is null)
            return Result<AccountDto>.Failure(Error.NotFound);

        var income = account.Transactions
            .Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount);
        var expense = account.Transactions
            .Where(t => t.Type == TransactionType.Expense || t.Type == TransactionType.Transfer).Sum(t => t.Amount);
        var incoming = account.IncomingTransfers.Sum(t => t.Amount);
        var balance = account.InitialBalance + income - expense + incoming;

        var dto = new AccountDto(
            idEncoder.Encode(account.Id),
            account.Name,
            account.Type,
            account.InitialBalance,
            balance,
            account.IsActive,
            account.CreatedAt);

        return Result<AccountDto>.Success(dto);
    }
}
