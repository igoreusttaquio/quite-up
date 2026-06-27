using MediatR;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Notifications.DTOs;

namespace QuiteUp.Application.Features.Notifications.Queries.GetNotifications;

public record GetNotificationsQuery(bool? UnreadOnly = null) : IRequest<Result<IReadOnlyList<NotificationDto>>>;
