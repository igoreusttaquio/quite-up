using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Infrastructure.Persistence.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).UseIdentityAlwaysColumn();

        builder.Property(c => c.Name).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Icon).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Color).IsRequired().HasMaxLength(7);

        builder.HasIndex(c => c.UserId);
        builder.HasIndex(c => new { c.UserId, c.IsDefault });
    }
}
