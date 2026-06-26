using QuiteUp.Domain.Common;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Domain.Entities;

public class Account : BaseEntity
{
    public long UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public AccountType Type { get; set; }
    public decimal InitialBalance { get; set; }
    public bool IsActive { get; set; } = true;

    public User User { get; set; } = null!;
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    public ICollection<Transaction> IncomingTransfers { get; set; } = new List<Transaction>();
}
