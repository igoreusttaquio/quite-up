using Microsoft.EntityFrameworkCore;
using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Attachments.DTOs;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Application.Features.Attachments.Commands.UploadAttachment;

public class UploadAttachmentCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<UploadAttachmentCommand, Result<AttachmentDto>>
{
    public async Task<Result<AttachmentDto>> Handle(UploadAttachmentCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var transaction = await context.Transactions
            .Include(t => t.Attachment)
            .FirstOrDefaultAsync(t => t.Id == request.TransactionId && t.UserId == userId, cancellationToken);

        if (transaction is null)
            return Result<AttachmentDto>.Failure(Error.NotFound);

        if (transaction.Attachment is not null)
            return Result<AttachmentDto>.Failure(new Error("Attachment.AlreadyExists", "Esta transação já possui um comprovante anexado."));

        var attachment = new Attachment
        {
            UserId = userId,
            TransactionId = request.TransactionId,
            FileName = request.FileName,
            ContentType = request.ContentType,
            FileSize = request.FileSize,
            Data = request.Data
        };

        context.Attachments.Add(attachment);
        await context.SaveChangesAsync(cancellationToken);

        var dto = new AttachmentDto(
            idEncoder.Encode(attachment.Id),
            attachment.FileName,
            attachment.ContentType,
            attachment.FileSize,
            attachment.CreatedAt);

        return Result<AttachmentDto>.Success(dto);
    }
}
