using MediatR;
using QuiteUp.Api.Common;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Features.Notifications.Commands.MarkAllNotificationsRead;
using QuiteUp.Application.Features.Notifications.Commands.MarkNotificationRead;
using QuiteUp.Application.Features.Notifications.Queries.GetNotifications;
using QuiteUp.Application.Features.Notifications.Queries.GetUnreadCount;

namespace QuiteUp.Api.Endpoints.Notifications;

public class NotificationEndpoints : IEndpoint
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/notifications")
            .WithTags("Notifications")
            .RequireAuthorization();

        group.MapGet("/", async (ISender sender, bool? unreadOnly = null) =>
        {
            var result = await sender.Send(new GetNotificationsQuery(unreadOnly));
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        });

        group.MapGet("/unread-count", async (ISender sender) =>
        {
            var result = await sender.Send(new GetUnreadCountQuery());
            return result.IsSuccess ? Results.Ok(new { count = result.Value }) : Results.BadRequest(result.Error);
        });

        group.MapPut("/{externalId}/read", async (string externalId, ISender sender, IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            if (id is null) return Results.NotFound();

            var result = await sender.Send(new MarkNotificationReadCommand(id.Value));
            return result.IsSuccess ? Results.NoContent() : Results.NotFound(result.Error);
        });

        group.MapPut("/read-all", async (ISender sender) =>
        {
            var result = await sender.Send(new MarkAllNotificationsReadCommand());
            return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
        });
    }
}
