using Microsoft.EntityFrameworkCore;
using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Profile.DTOs;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Application.Features.Profile.Commands.UploadProfilePhoto;

public class UploadProfilePhotoCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<UploadProfilePhotoCommand, Result<ProfileDto>>
{
    public async Task<Result<ProfileDto>> Handle(UploadProfilePhotoCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null)
            return Result<ProfileDto>.Failure(Error.NotFound);

        var photo = await context.UserProfilePhotos
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (photo is null)
        {
            photo = new UserProfilePhoto
            {
                UserId = userId,
                FileName = request.FileName,
                ContentType = request.ContentType,
                FileSize = request.FileSize,
                Data = request.Data
            };
            context.UserProfilePhotos.Add(photo);
        }
        else
        {
            photo.FileName = request.FileName;
            photo.ContentType = request.ContentType;
            photo.FileSize = request.FileSize;
            photo.Data = request.Data;
        }

        await context.SaveChangesAsync(cancellationToken);

        return Result<ProfileDto>.Success(new ProfileDto(
            idEncoder.Encode(user.Id),
            user.Name,
            user.Email,
            user.PendingEmail,
            user.CreatedAt,
            photo.UpdatedAt ?? photo.CreatedAt));
    }
}
