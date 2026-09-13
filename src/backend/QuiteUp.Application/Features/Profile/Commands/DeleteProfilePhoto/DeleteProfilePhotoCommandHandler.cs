using Microsoft.EntityFrameworkCore;
using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Profile.DTOs;

namespace QuiteUp.Application.Features.Profile.Commands.DeleteProfilePhoto;

public class DeleteProfilePhotoCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<DeleteProfilePhotoCommand, Result<ProfileDto>>
{
    public async Task<Result<ProfileDto>> Handle(DeleteProfilePhotoCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null)
            return Result<ProfileDto>.Failure(Error.NotFound);

        var photo = await context.UserProfilePhotos
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (photo is not null)
        {
            context.UserProfilePhotos.Remove(photo);
            await context.SaveChangesAsync(cancellationToken);
        }

        return Result<ProfileDto>.Success(new ProfileDto(
            idEncoder.Encode(user.Id),
            user.Name,
            user.Email,
            user.PendingEmail,
            user.CreatedAt,
            null));
    }
}
