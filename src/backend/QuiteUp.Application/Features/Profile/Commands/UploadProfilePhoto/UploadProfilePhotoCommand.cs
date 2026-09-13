using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Profile.DTOs;

namespace QuiteUp.Application.Features.Profile.Commands.UploadProfilePhoto;

public record UploadProfilePhotoCommand(
    string FileName,
    string ContentType,
    long FileSize,
    byte[] Data
) : IRequest<Result<ProfileDto>>;
