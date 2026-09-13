using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Profile.DTOs;

namespace QuiteUp.Application.Features.Profile.Commands.DeleteProfilePhoto;

public record DeleteProfilePhotoCommand : IRequest<Result<ProfileDto>>;
