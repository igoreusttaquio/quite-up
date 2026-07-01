using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Auth.DTOs;

namespace QuiteUp.Application.Features.Auth.Commands.Register;

public record RegisterUserCommand(string Name, string Email, string Password, string ConfirmPassword) : IRequest<Result<UserDto>>;
