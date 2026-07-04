using Microsoft.EntityFrameworkCore;
using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Attachments.Commands.DeleteAttachment;

public class DeleteAttachmentCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser) : IRequestHandler<DeleteAttachmentCommand, Result>
{
    public async Task<Result> Handle(DeleteAttachmentCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var attachment = await context.Attachments
            .Include(a => a.Transaction)
            .FirstOrDefaultAsync(a => a.Id == request.AttachmentId && a.UserId == userId, cancellationToken);

        if (attachment is null)
            return Result.Failure(Error.NotFound);

        context.Attachments.Remove(attachment);
        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
