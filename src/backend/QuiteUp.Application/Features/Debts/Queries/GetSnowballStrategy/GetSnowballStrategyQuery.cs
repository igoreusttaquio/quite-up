using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Debts.DTOs;

namespace QuiteUp.Application.Features.Debts.Queries.GetSnowballStrategy;

public record GetSnowballStrategyQuery : IRequest<Result<SnowballStrategyDto>>;
