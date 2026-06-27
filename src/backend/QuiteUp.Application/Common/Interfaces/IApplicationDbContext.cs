using Microsoft.EntityFrameworkCore;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<EmailVerificationToken> EmailVerificationTokens { get; }
    DbSet<PasswordResetToken> PasswordResetTokens { get; }
    DbSet<Account> Accounts { get; }
    DbSet<Category> Categories { get; }
    DbSet<Transaction> Transactions { get; }
    DbSet<Debt> Debts { get; }
    DbSet<DebtPayment> DebtPayments { get; }
    DbSet<Budget> Budgets { get; }
    DbSet<FinancialGoal> FinancialGoals { get; }
    DbSet<GoalContribution> GoalContributions { get; }
    DbSet<Notification> Notifications { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
