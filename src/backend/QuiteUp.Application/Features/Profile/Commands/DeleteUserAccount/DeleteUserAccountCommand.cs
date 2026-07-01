using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Profile.Commands.DeleteUserAccount;

public record DeleteUserAccountCommand(string Password) : IRequest<Result>;
