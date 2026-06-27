using MediatR;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Notifications.Queries.GetUnreadCount;

public record GetUnreadCountQuery : IRequest<Result<int>>;
