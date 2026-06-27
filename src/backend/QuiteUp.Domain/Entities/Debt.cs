using QuiteUp.Domain.Common;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Domain.Entities;

public class Debt : BaseEntity
{
    public long UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DebtType Type { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal? InterestRate { get; set; }
    public DateOnly DueDate { get; set; }
    public bool IsPaid { get; set; }
    public string? Notes { get; set; }

    public User User { get; set; } = null!;
    public ICollection<DebtPayment> Payments { get; set; } = new List<DebtPayment>();
}
