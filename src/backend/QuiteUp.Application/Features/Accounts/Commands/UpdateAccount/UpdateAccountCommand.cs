using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Accounts.DTOs;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Accounts.Commands.UpdateAccount;

public record UpdateAccountCommand(long Id, string Name, AccountType Type) : IRequest<Result<AccountDto>>;
