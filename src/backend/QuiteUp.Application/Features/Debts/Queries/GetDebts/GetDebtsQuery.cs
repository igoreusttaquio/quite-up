using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Debts.DTOs;

namespace QuiteUp.Application.Features.Debts.Queries.GetDebts;

public record GetDebtsQuery(bool? IsPaid = null) : IRequest<Result<IReadOnlyList<DebtDto>>>;
