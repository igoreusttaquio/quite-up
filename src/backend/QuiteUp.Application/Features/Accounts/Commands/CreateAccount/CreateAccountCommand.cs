using MediatR;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Accounts.DTOs;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Accounts.Commands.CreateAccount;

public record CreateAccountCommand(string Name, AccountType Type, decimal InitialBalance)
    : IRequest<Result<AccountDto>>;
