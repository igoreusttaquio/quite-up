using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Infrastructure.Persistence.Configurations;

public class BudgetConfiguration : IEntityTypeConfiguration<Budget>
{
    public void Configure(EntityTypeBuilder<Budget> builder)
    {
        builder.ToTable("budgets");

        builder.HasKey(b => b.Id);
        builder.Property(b => b.Id).HasColumnName("id").UseIdentityAlwaysColumn();
        builder.Property(b => b.CreatedAt).HasColumnName("created_at");
        builder.Property(b => b.UpdatedAt).HasColumnName("updated_at");

        builder.Property(b => b.UserId).HasColumnName("user_id");
        builder.Property(b => b.CategoryId).HasColumnName("category_id");
        builder.Property(b => b.Amount).HasColumnName("amount").HasPrecision(18, 2);
        builder.Property(b => b.Month).HasColumnName("month");
        builder.Property(b => b.Year).HasColumnName("year");

        builder.HasOne(b => b.Category)
            .WithMany()
            .HasForeignKey(b => b.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(b => b.UserId).HasDatabaseName("ix_budgets_user_id");
    }
}
