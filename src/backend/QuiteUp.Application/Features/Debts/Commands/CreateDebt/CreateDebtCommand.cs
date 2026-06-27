using MediatR;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Debts.DTOs;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Debts.Commands.CreateDebt;

public record CreateDebtCommand(
    string Name,
    DebtType Type,
    decimal TotalAmount,
    decimal? InterestRate,
    DateOnly DueDate,
    string? Notes
) : IRequest<Result<DebtDto>>;
