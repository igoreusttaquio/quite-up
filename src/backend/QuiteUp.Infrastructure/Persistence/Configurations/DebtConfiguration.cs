using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Infrastructure.Persistence.Configurations;

public class DebtConfiguration : IEntityTypeConfiguration<Debt>
{
    public void Configure(EntityTypeBuilder<Debt> builder)
    {
        builder.ToTable("debts");

        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).HasColumnName("id").UseIdentityAlwaysColumn();
        builder.Property(d => d.CreatedAt).HasColumnName("created_at");
        builder.Property(d => d.UpdatedAt).HasColumnName("updated_at");

        builder.Property(d => d.UserId).HasColumnName("user_id");
        builder.Property(d => d.Name).HasColumnName("name").IsRequired().HasMaxLength(100);
        builder.Property(d => d.Type).HasColumnName("type");
        builder.Property(d => d.TotalAmount).HasColumnName("total_amount").HasPrecision(18, 2);
        builder.Property(d => d.PaidAmount).HasColumnName("paid_amount").HasPrecision(18, 2);
        builder.Property(d => d.InterestRate).HasColumnName("interest_rate").HasPrecision(18, 4);
        builder.Property(d => d.InterestPeriod).HasColumnName("interest_period");
        builder.Property(d => d.PaymentMode).HasColumnName("payment_mode");
        builder.Property(d => d.InstallmentCount).HasColumnName("installment_count");
        builder.Property(d => d.InstallmentAmount).HasColumnName("installment_amount").HasPrecision(18, 2);
        builder.Property(d => d.InitialPaidInstallments).HasColumnName("initial_paid_installments");
        builder.Property(d => d.DueDay).HasColumnName("due_day");
        builder.Property(d => d.FirstInstallmentDate).HasColumnName("first_installment_date");
        builder.Property(d => d.PayoffDate).HasColumnName("payoff_date");
        builder.Property(d => d.NeedsReview).HasColumnName("needs_review");
        builder.Property(d => d.IsPaid).HasColumnName("is_paid");
        builder.Property(d => d.Notes).HasColumnName("notes").HasMaxLength(500);

        builder.HasOne(d => d.User)
            .WithMany()
            .HasForeignKey(d => d.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(d => d.UserId).HasDatabaseName("ix_debts_user_id");
    }
}
