using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Infrastructure.Persistence.Configurations;

public class DebtPaymentConfiguration : IEntityTypeConfiguration<DebtPayment>
{
    public void Configure(EntityTypeBuilder<DebtPayment> builder)
    {
        builder.ToTable("debt_payments");

        builder.HasKey(dp => dp.Id);
        builder.Property(dp => dp.Id).HasColumnName("id").UseIdentityAlwaysColumn();
        builder.Property(dp => dp.CreatedAt).HasColumnName("created_at");
        builder.Property(dp => dp.UpdatedAt).HasColumnName("updated_at");

        builder.Property(dp => dp.UserId).HasColumnName("user_id");
        builder.Property(dp => dp.DebtId).HasColumnName("debt_id");
        builder.Property(dp => dp.Amount).HasColumnName("amount").HasPrecision(18, 2);
        builder.Property(dp => dp.PaymentDate).HasColumnName("payment_date");
        builder.Property(dp => dp.IsEarlyPayment).HasColumnName("is_early_payment");
        builder.Property(dp => dp.Discount).HasColumnName("discount").HasPrecision(18, 2);
        builder.Property(dp => dp.Notes).HasColumnName("notes").HasMaxLength(500);

        builder.HasOne(dp => dp.Debt)
            .WithMany(d => d.Payments)
            .HasForeignKey(dp => dp.DebtId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(dp => dp.User)
            .WithMany()
            .HasForeignKey(dp => dp.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(dp => dp.DebtId).HasDatabaseName("ix_debt_payments_debt_id");
        builder.HasIndex(dp => dp.UserId).HasDatabaseName("ix_debt_payments_user_id");
    }
}
