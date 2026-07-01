using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Notifications.Commands.MarkNotificationRead;

public record MarkNotificationReadCommand(long Id) : IRequest<Result>;
