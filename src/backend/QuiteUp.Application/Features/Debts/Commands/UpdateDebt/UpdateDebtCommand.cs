using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Debts.DTOs;

namespace QuiteUp.Application.Features.Debts.Commands.UpdateDebt;

public record UpdateDebtCommand(long Id, DebtInput Input) : IRequest<Result<DebtDto>>;
