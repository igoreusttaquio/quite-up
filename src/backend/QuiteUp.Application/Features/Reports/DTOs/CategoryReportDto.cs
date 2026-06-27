namespace QuiteUp.Application.Features.Reports.DTOs;

public record CategoryReportDto(
    string CategoryId,
    string CategoryName,
    decimal TotalAmount,
    int TransactionCount,
    decimal Percentage
);
