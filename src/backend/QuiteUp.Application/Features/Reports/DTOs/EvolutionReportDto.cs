namespace QuiteUp.Application.Features.Reports.DTOs;

public record EvolutionReportDto(
    int Year,
    int Month,
    decimal Income,
    decimal Expenses,
    decimal NetBalance
);
