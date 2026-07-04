using Microsoft.EntityFrameworkCore;
using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Attachments.DTOs;

namespace QuiteUp.Application.Features.Attachments.Queries.GetAttachment;

public class GetAttachmentQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser) : IRequestHandler<GetAttachmentQuery, Result<AttachmentDataDto>>
{
    public async Task<Result<AttachmentDataDto>> Handle(GetAttachmentQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var attachment = await context.Attachments
            .FirstOrDefaultAsync(a => a.Id == request.AttachmentId && a.UserId == userId, cancellationToken);

        if (attachment is null)
            return Result<AttachmentDataDto>.Failure(Error.NotFound);

        return Result<AttachmentDataDto>.Success(new AttachmentDataDto(
            attachment.FileName,
            attachment.ContentType,
            attachment.Data));
    }
}
