using MediatR;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Reports.DTOs;

namespace QuiteUp.Application.Features.Reports.Queries.GetEvolutionReport;

public record GetEvolutionReportQuery(int Year) : IRequest<Result<IReadOnlyList<EvolutionReportDto>>>;
