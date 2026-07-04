using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Attachments.DTOs;

namespace QuiteUp.Application.Features.Attachments.Queries.GetAttachment;

public record GetAttachmentQuery(long AttachmentId) : IRequest<Result<AttachmentDataDto>>;
