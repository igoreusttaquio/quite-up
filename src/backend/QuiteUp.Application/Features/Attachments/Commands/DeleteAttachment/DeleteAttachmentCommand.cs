using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Attachments.Commands.DeleteAttachment;

public record DeleteAttachmentCommand(long AttachmentId) : IRequest<Result>;
