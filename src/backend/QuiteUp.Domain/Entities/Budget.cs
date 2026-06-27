using QuiteUp.Domain.Common;

namespace QuiteUp.Domain.Entities;

public class Budget : BaseEntity
{
    public long UserId { get; set; }
    public long CategoryId { get; set; }
    public decimal Amount { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }

    public User? User { get; set; }
    public Category? Category { get; set; }
}
