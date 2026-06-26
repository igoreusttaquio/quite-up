using MediatR;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Accounts.DTOs;

namespace QuiteUp.Application.Features.Accounts.Queries.GetAccounts;

public record GetAccountsQuery(bool IncludeInactive = false) : IRequest<Result<IReadOnlyList<AccountDto>>>;
