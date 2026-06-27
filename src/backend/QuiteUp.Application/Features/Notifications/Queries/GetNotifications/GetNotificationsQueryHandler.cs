using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Notifications.DTOs;

namespace QuiteUp.Application.Features.Notifications.Queries.GetNotifications;

public class GetNotificationsQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<GetNotificationsQuery, Result<IReadOnlyList<NotificationDto>>>
{
    public async Task<Result<IReadOnlyList<NotificationDto>>> Handle(GetNotificationsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var query = context.Notifications
            .Where(n => n.UserId == userId)
            .AsQueryable();

        if (request.UnreadOnly == true)
            query = query.Where(n => !n.IsRead);

        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync(cancellationToken);

        var dtos = notifications.Select(n => new NotificationDto(
            idEncoder.Encode(n.Id),
            n.Title,
            n.Message,
            n.Type,
            n.IsRead,
            n.ReferenceType,
            n.ReferenceId,
            n.CreatedAt
        )).ToList();

        return Result<IReadOnlyList<NotificationDto>>.Success(dtos);
    }
}
