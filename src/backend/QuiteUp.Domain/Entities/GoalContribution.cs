using QuiteUp.Domain.Common;

namespace QuiteUp.Domain.Entities;

public class GoalContribution : BaseEntity
{
    public long UserId { get; set; }
    public long FinancialGoalId { get; set; }
    public decimal Amount { get; set; }
    public DateOnly Date { get; set; }
    public string? Notes { get; set; }

    public User? User { get; set; }
    public FinancialGoal? FinancialGoal { get; set; }
}
