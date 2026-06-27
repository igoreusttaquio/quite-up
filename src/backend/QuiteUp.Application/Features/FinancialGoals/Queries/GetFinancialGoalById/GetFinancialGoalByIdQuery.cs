using MediatR;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.FinancialGoals.DTOs;

namespace QuiteUp.Application.Features.FinancialGoals.Queries.GetFinancialGoalById;

public record GetFinancialGoalByIdQuery(long Id) : IRequest<Result<FinancialGoalDto>>;
