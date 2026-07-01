using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Auth.Commands.VerifyEmail;

public record VerifyEmailCommand(string Token) : IRequest<Result>;
