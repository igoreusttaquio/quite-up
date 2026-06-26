using MediatR;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Accounts.DTOs;

namespace QuiteUp.Application.Features.Accounts.Queries.GetAccountById;

public record GetAccountByIdQuery(long Id) : IRequest<Result<AccountDto>>;
