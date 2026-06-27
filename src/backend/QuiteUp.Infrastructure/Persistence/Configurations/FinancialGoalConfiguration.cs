using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Infrastructure.Persistence.Configurations;

public class FinancialGoalConfiguration : IEntityTypeConfiguration<FinancialGoal>
{
    public void Configure(EntityTypeBuilder<FinancialGoal> builder)
    {
        builder.ToTable("financial_goals");

        builder.HasKey(fg => fg.Id);
        builder.Property(fg => fg.Id).HasColumnName("id").UseIdentityAlwaysColumn();
        builder.Property(fg => fg.CreatedAt).HasColumnName("created_at");
        builder.Property(fg => fg.UpdatedAt).HasColumnName("updated_at");

        builder.Property(fg => fg.UserId).HasColumnName("user_id");
        builder.Property(fg => fg.Name).HasColumnName("name").IsRequired().HasMaxLength(255);
        builder.Property(fg => fg.TargetAmount).HasColumnName("target_amount").HasPrecision(18, 2);
        builder.Property(fg => fg.CurrentAmount).HasColumnName("current_amount").HasPrecision(18, 2);
        builder.Property(fg => fg.TargetDate).HasColumnName("target_date");
        builder.Property(fg => fg.IsCompleted).HasColumnName("is_completed");

        builder.HasIndex(fg => fg.UserId).HasDatabaseName("ix_financial_goals_user_id");
    }
}
