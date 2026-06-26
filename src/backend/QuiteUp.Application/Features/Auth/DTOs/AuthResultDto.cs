namespace QuiteUp.Application.Features.Auth.DTOs;

public record AuthResultDto(string AccessToken, string RefreshToken, DateTime ExpiresAt);
