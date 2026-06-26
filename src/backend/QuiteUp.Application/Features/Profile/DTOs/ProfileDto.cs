namespace QuiteUp.Application.Features.Profile.DTOs;

public record ProfileDto(string Id, string Name, string Email, string? PendingEmail, DateTime CreatedAt);
