using MediatR;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Notifications.Commands.MarkAllNotificationsRead;

public record MarkAllNotificationsReadCommand : IRequest<Result>;
