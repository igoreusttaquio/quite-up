using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Debts.DTOs;

namespace QuiteUp.Application.Features.Debts.Commands.CreateDebt;

public record CreateDebtCommand(DebtInput Input) : IRequest<Result<DebtDto>>;
