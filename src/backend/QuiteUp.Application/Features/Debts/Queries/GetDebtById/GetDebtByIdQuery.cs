using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Debts.DTOs;

namespace QuiteUp.Application.Features.Debts.Queries.GetDebtById;

public record GetDebtByIdQuery(long Id) : IRequest<Result<DebtDto>>;
