using MediatR;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Accounts.DTOs;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Application.Features.Accounts.Commands.CreateAccount;

public class CreateAccountCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<CreateAccountCommand, Result<AccountDto>>
{
    public async Task<Result<AccountDto>> Handle(CreateAccountCommand request, CancellationToken cancellationToken)
    {
        var account = new Account
        {
            UserId = currentUser.UserId!.Value,
            Name = request.Name,
            Type = request.Type,
            InitialBalance = request.InitialBalance,
            IsActive = true
        };

        context.Accounts.Add(account);
        await context.SaveChangesAsync(cancellationToken);

        var dto = new AccountDto(
            idEncoder.Encode(account.Id),
            account.Name,
            account.Type,
            account.InitialBalance,
            account.InitialBalance,
            account.IsActive,
            account.CreatedAt);

        return Result<AccountDto>.Success(dto);
    }
}
