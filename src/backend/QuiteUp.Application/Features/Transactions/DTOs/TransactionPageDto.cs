namespace QuiteUp.Application.Features.Transactions.DTOs;

/// <summary>Página de transações + totais de TODAS as transações que batem com o filtro.</summary>
public record TransactionPageDto(
    IReadOnlyList<TransactionDto> Items,
    int Page,
    int PageSize,
    int TotalCount,
    TransactionTotalsDto Totals)
{
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}

/// <summary>
/// Totais do filtro. Transferências só entram quando há filtro de conta:
/// as que saem da conta contam como saída e as que chegam, como entrada.
/// </summary>
public record TransactionTotalsDto(
    decimal Income,
    decimal Expenses,
    decimal TransfersIn,
    decimal TransfersOut,
    decimal Net);
