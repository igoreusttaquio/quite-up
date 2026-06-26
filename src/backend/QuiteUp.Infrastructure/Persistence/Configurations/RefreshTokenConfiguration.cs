using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Infrastructure.Persistence.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.HasKey(rt => rt.Id);
        builder.Property(rt => rt.Id).UseIdentityAlwaysColumn();
        builder.Property(rt => rt.TokenHash).IsRequired().HasMaxLength(500);
        builder.HasIndex(rt => rt.TokenHash);
    }
}
