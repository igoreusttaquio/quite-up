using Microsoft.EntityFrameworkCore;
using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Profile.DTOs;

namespace QuiteUp.Application.Features.Profile.Queries.GetProfilePhoto;

public class GetProfilePhotoQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser) : IRequestHandler<GetProfilePhotoQuery, Result<ProfilePhotoDto>>
{
    public async Task<Result<ProfilePhotoDto>> Handle(GetProfilePhotoQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var photo = await context.UserProfilePhotos
            .Where(p => p.UserId == userId)
            .Select(p => new ProfilePhotoDto(p.FileName, p.ContentType, p.Data))
            .FirstOrDefaultAsync(cancellationToken);

        return photo is null
            ? Result<ProfilePhotoDto>.Failure(Error.NotFound)
            : Result<ProfilePhotoDto>.Success(photo);
    }
}
