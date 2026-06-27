namespace QuiteUp.Application.Events;

public record DebtPaidOffEvent(long UserId, long DebtId, string DebtName, decimal TotalAmount);
