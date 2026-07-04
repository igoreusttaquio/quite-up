using Microsoft.EntityFrameworkCore;
using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Attachments.Commands.DeleteAttachment;

public class DeleteAttachmentByTransactionCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser) : IRequestHandler<DeleteAttachmentByTransactionCommand, Result>
{
    public async Task<Result> Handle(DeleteAttachmentByTransactionCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var attachment = await context.Attachments
            .FirstOrDefaultAsync(a => a.TransactionId == request.TransactionId && a.UserId == userId, cancellationToken);

        if (attachment is null)
            return Result.Failure(Error.NotFound);

        context.Attachments.Remove(attachment);
        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
