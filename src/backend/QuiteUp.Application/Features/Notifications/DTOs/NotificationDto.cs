namespace QuiteUp.Application.Features.Notifications.DTOs;

public record NotificationDto(
    string Id,
    string Title,
    string Message,
    string Type,
    bool IsRead,
    string? ReferenceType,
    string? ReferenceId,
    DateTime CreatedAt
);
