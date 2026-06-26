using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Infrastructure.Persistence.Configurations;

public class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.ToTable("transactions");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("id").UseIdentityAlwaysColumn();
        builder.Property(t => t.CreatedAt).HasColumnName("created_at");
        builder.Property(t => t.UpdatedAt).HasColumnName("updated_at");

        builder.Property(t => t.UserId).HasColumnName("user_id");
        builder.Property(t => t.AccountId).HasColumnName("account_id");
        builder.Property(t => t.DestinationAccountId).HasColumnName("destination_account_id");
        builder.Property(t => t.CategoryId).HasColumnName("category_id");
        builder.Property(t => t.Type).HasColumnName("type");
        builder.Property(t => t.Amount).HasColumnName("amount").HasPrecision(18, 2);
        builder.Property(t => t.Date).HasColumnName("date");
        builder.Property(t => t.Description).HasColumnName("description").HasMaxLength(255);

        builder.HasOne(t => t.Account)
            .WithMany(a => a.Transactions)
            .HasForeignKey(t => t.AccountId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.DestinationAccount)
            .WithMany(a => a.IncomingTransfers)
            .HasForeignKey(t => t.DestinationAccountId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(t => t.Category)
            .WithMany(c => c.Transactions)
            .HasForeignKey(t => t.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(t => t.UserId).HasDatabaseName("ix_transactions_user_id");
        builder.HasIndex(t => new { t.AccountId, t.Date }).HasDatabaseName("ix_transactions_account_id_date");
        builder.HasIndex(t => t.DestinationAccountId).HasDatabaseName("ix_transactions_destination_account_id");
    }
}
