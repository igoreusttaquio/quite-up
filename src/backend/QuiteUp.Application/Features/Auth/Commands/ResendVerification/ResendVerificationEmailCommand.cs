using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Auth.Commands.ResendVerification;

public record ResendVerificationEmailCommand(string Email) : IRequest<Result>;
