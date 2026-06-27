using QuiteUp.Domain.Common;

namespace QuiteUp.Domain.Entities;

public class FinancialGoal : BaseEntity
{
    public long UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }
    public decimal CurrentAmount { get; set; }
    public DateOnly? TargetDate { get; set; }
    public bool IsCompleted { get; set; }

    public User? User { get; set; }
    public ICollection<GoalContribution> Contributions { get; set; } = new List<GoalContribution>();
}
