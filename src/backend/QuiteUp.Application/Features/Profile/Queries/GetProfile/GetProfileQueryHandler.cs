using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Profile.DTOs;

namespace QuiteUp.Application.Features.Profile.Queries.GetProfile;

public class GetProfileQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<GetProfileQuery, Result<ProfileDto>>
{
    public async Task<Result<ProfileDto>> Handle(GetProfileQuery request, CancellationToken cancellationToken)
    {
        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Id == currentUser.UserId, cancellationToken);

        if (user is null)
            return Result<ProfileDto>.Failure(Error.NotFound);

        var photoUpdatedAt = await context.UserProfilePhotos
            .Where(p => p.UserId == user.Id)
            .Select(p => (DateTime?)(p.UpdatedAt ?? p.CreatedAt))
            .FirstOrDefaultAsync(cancellationToken);

        return Result<ProfileDto>.Success(new ProfileDto(
            idEncoder.Encode(user.Id),
            user.Name,
            user.Email,
            user.PendingEmail,
            user.CreatedAt,
            photoUpdatedAt));
    }
}
