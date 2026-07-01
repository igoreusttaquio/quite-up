using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Profile.DTOs;

namespace QuiteUp.Application.Features.Profile.Queries.GetProfile;

public record GetProfileQuery : IRequest<Result<ProfileDto>>;
