using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Profile.DTOs;

namespace QuiteUp.Application.Features.Profile.Queries.GetProfilePhoto;

public record GetProfilePhotoQuery : IRequest<Result<ProfilePhotoDto>>;
