using MediatR;

namespace QuiteUp.Application.Features.Auth.Commands.Logout;

public record LogoutCommand(string RefreshToken) : IRequest;
