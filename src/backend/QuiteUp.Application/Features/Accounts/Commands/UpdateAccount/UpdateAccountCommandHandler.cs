using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Accounts.DTOs;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Accounts.Commands.UpdateAccount;

public class UpdateAccountCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<UpdateAccountCommand, Result<AccountDto>>
{
    public async Task<Result<AccountDto>> Handle(UpdateAccountCommand request, CancellationToken cancellationToken)
    {
        var account = await context.Accounts
            .FirstOrDefaultAsync(a => a.Id == request.Id && a.UserId == currentUser.UserId, cancellationToken);

        if (account is null)
            return Result<AccountDto>.Failure(Error.NotFound);

        account.Name = request.Name;
        account.Type = request.Type;

        await context.SaveChangesAsync(cancellationToken);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var balance = await CalculateBalance(context, account.Id, account.InitialBalance, today, cancellationToken);

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

    private static async Task<decimal> CalculateBalance(
        IApplicationDbContext context, long accountId, decimal initialBalance, DateOnly today, CancellationToken ct)
    {
        var income = await context.Transactions
            .Where(t => t.AccountId == accountId && t.Date <= today && t.Type == TransactionType.Income)
            .SumAsync(t => (decimal?)t.Amount, ct) ?? 0;

        var expense = await context.Transactions
            .Where(t => t.AccountId == accountId && t.Date <= today &&
                        (t.Type == TransactionType.Expense || t.Type == TransactionType.Transfer))
            .SumAsync(t => (decimal?)t.Amount, ct) ?? 0;

        var incoming = await context.Transactions
            .Where(t => t.DestinationAccountId == accountId && t.Date <= today)
            .SumAsync(t => (decimal?)t.Amount, ct) ?? 0;

        return initialBalance + income - expense + incoming;
    }
}
