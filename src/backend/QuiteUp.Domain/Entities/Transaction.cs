using QuiteUp.Domain.Common;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Domain.Entities;

public class Transaction : BaseEntity
{
    public long UserId { get; set; }
    public long AccountId { get; set; }
    public long? DestinationAccountId { get; set; }
    public long? CategoryId { get; set; }
    public TransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public DateOnly Date { get; set; }
    public string? Description { get; set; }

    public long? DebtId { get; set; }

    public Account Account { get; set; } = null!;
    public Account? DestinationAccount { get; set; }
    public Category? Category { get; set; }
    public Debt? Debt { get; set; }
}
