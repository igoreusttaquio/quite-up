using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Infrastructure.Persistence.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("categories");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id").UseIdentityAlwaysColumn();
        builder.Property(c => c.CreatedAt).HasColumnName("created_at");
        builder.Property(c => c.UpdatedAt).HasColumnName("updated_at");

        builder.Property(c => c.UserId).HasColumnName("user_id");
        builder.Property(c => c.Name).HasColumnName("name").IsRequired().HasMaxLength(50);
        builder.Property(c => c.Type).HasColumnName("type");
        builder.Property(c => c.Icon).HasColumnName("icon").IsRequired().HasMaxLength(50);
        builder.Property(c => c.Color).HasColumnName("color").IsRequired().HasMaxLength(7);
        builder.Property(c => c.IsDefault).HasColumnName("is_default");

        builder.HasIndex(c => c.UserId).HasDatabaseName("ix_categories_user_id");
        builder.HasIndex(c => new { c.UserId, c.IsDefault }).HasDatabaseName("ix_categories_user_id_is_default");
    }
}
