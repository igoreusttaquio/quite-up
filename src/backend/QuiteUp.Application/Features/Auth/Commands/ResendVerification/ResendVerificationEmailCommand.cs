using MediatR;

namespace QuiteUp.Application.Features.Auth.Commands.ResendVerification;

public record ResendVerificationEmailCommand(string Email) : IRequest;
