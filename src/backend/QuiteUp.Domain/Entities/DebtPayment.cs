using QuiteUp.Domain.Common;

namespace QuiteUp.Domain.Entities;

public class DebtPayment : BaseEntity
{
    public long UserId { get; set; }
    public long DebtId { get; set; }
    public decimal Amount { get; set; }
    public DateOnly PaymentDate { get; set; }
    public bool IsEarlyPayment { get; set; }
    public decimal Discount { get; set; }
    public string? Notes { get; set; }

    public long? AccountId { get; set; }

    public User User { get; set; } = null!;
    public Debt Debt { get; set; } = null!;
    public Account? Account { get; set; }
}
