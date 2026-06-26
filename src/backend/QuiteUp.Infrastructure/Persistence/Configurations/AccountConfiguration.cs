using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Infrastructure.Persistence.Configurations;

public class AccountConfiguration : IEntityTypeConfiguration<Account>
{
    public void Configure(EntityTypeBuilder<Account> builder)
    {
        builder.ToTable("accounts");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasColumnName("id").UseIdentityAlwaysColumn();
        builder.Property(a => a.CreatedAt).HasColumnName("created_at");
        builder.Property(a => a.UpdatedAt).HasColumnName("updated_at");

        builder.Property(a => a.UserId).HasColumnName("user_id");
        builder.Property(a => a.Name).HasColumnName("name").IsRequired().HasMaxLength(100);
        builder.Property(a => a.Type).HasColumnName("type");
        builder.Property(a => a.InitialBalance).HasColumnName("initial_balance").HasPrecision(18, 2);
        builder.Property(a => a.IsActive).HasColumnName("is_active");

        builder.HasIndex(a => a.UserId).HasDatabaseName("ix_accounts_user_id");
    }
}
