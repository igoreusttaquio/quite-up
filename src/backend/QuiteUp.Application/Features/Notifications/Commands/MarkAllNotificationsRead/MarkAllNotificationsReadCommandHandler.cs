using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Notifications.Commands.MarkAllNotificationsRead;

public class MarkAllNotificationsReadCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser) : IRequestHandler<MarkAllNotificationsReadCommand, Result>
{
    public async Task<Result> Handle(MarkAllNotificationsReadCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var unread = await context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync(cancellationToken);

        foreach (var notification in unread)
            notification.IsRead = true;

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
