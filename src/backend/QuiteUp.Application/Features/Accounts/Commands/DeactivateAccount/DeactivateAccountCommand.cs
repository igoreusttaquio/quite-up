using MediatR;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Accounts.Commands.DeactivateAccount;

public record DeactivateAccountCommand(long Id) : IRequest<Result>;
