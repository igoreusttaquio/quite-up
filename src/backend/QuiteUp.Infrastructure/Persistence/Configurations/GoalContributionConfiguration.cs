using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Infrastructure.Persistence.Configurations;

public class GoalContributionConfiguration : IEntityTypeConfiguration<GoalContribution>
{
    public void Configure(EntityTypeBuilder<GoalContribution> builder)
    {
        builder.ToTable("goal_contributions");

        builder.HasKey(gc => gc.Id);
        builder.Property(gc => gc.Id).HasColumnName("id").UseIdentityAlwaysColumn();
        builder.Property(gc => gc.CreatedAt).HasColumnName("created_at");
        builder.Property(gc => gc.UpdatedAt).HasColumnName("updated_at");

        builder.Property(gc => gc.UserId).HasColumnName("user_id");
        builder.Property(gc => gc.FinancialGoalId).HasColumnName("financial_goal_id");
        builder.Property(gc => gc.Amount).HasColumnName("amount").HasPrecision(18, 2);
        builder.Property(gc => gc.Date).HasColumnName("date");
        builder.Property(gc => gc.Notes).HasColumnName("notes").HasMaxLength(500);

        builder.HasOne(gc => gc.FinancialGoal)
            .WithMany(fg => fg.Contributions)
            .HasForeignKey(gc => gc.FinancialGoalId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(gc => gc.FinancialGoalId).HasDatabaseName("ix_goal_contributions_financial_goal_id");
    }
}
