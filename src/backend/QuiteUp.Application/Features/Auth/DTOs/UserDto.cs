using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Auth.DTOs;

public record UserDto(long Id, string Name, string Email, UserStatus Status, DateTime CreatedAt);
