using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Profile.DTOs;

namespace QuiteUp.Application.Features.Profile.Commands.UpdateProfile;

public class UpdateProfileCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<UpdateProfileCommand, Result<ProfileDto>>
{
    public async Task<Result<ProfileDto>> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
    {
        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Id == currentUser.UserId, cancellationToken);

        if (user is null)
            return Result<ProfileDto>.Failure(Error.NotFound);

        user.Name = request.Name;
        await context.SaveChangesAsync(cancellationToken);

        return Result<ProfileDto>.Success(new ProfileDto(
            idEncoder.Encode(user.Id),
            user.Name,
            user.Email,
            user.PendingEmail,
            user.CreatedAt));
    }
}
