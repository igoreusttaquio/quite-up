using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Notifications.Queries.GetUnreadCount;

public class GetUnreadCountQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser) : IRequestHandler<GetUnreadCountQuery, Result<int>>
{
    public async Task<Result<int>> Handle(GetUnreadCountQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var count = await context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead, cancellationToken);

        return Result<int>.Success(count);
    }
}
