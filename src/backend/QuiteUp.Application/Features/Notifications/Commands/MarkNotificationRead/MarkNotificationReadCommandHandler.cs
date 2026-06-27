using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Notifications.Commands.MarkNotificationRead;

public class MarkNotificationReadCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser) : IRequestHandler<MarkNotificationReadCommand, Result>
{
    public async Task<Result> Handle(MarkNotificationReadCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var notification = await context.Notifications
            .FirstOrDefaultAsync(n => n.Id == request.Id && n.UserId == userId, cancellationToken);

        if (notification is null)
            return Result.Failure(Error.NotFound);

        notification.IsRead = true;
        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
