using MediatR;

namespace QuiteUp.Application.Features.Auth.Commands.ForgotPassword;

public record ForgotPasswordCommand(string Email) : IRequest;
