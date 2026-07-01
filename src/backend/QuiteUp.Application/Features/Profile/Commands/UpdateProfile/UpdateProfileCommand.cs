using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Profile.DTOs;

namespace QuiteUp.Application.Features.Profile.Commands.UpdateProfile;

public record UpdateProfileCommand(string Name) : IRequest<Result<ProfileDto>>;
