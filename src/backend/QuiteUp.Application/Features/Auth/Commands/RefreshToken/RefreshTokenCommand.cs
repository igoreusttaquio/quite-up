using MediatR;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Auth.DTOs;

namespace QuiteUp.Application.Features.Auth.Commands.RefreshToken;

public record RefreshTokenCommand(string RefreshToken) : IRequest<Result<AuthResultDto>>;
