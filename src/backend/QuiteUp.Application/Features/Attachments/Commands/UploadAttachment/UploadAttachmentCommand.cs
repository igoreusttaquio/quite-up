using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Attachments.DTOs;

namespace QuiteUp.Application.Features.Attachments.Commands.UploadAttachment;

public record UploadAttachmentCommand(
    long TransactionId,
    string FileName,
    string ContentType,
    long FileSize,
    byte[] Data
) : IRequest<Result<AttachmentDto>>;
