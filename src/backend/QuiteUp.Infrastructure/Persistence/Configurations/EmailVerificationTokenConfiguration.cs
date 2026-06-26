using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Infrastructure.Persistence.Configurations;

public class EmailVerificationTokenConfiguration : IEntityTypeConfiguration<EmailVerificationToken>
{
    public void Configure(EntityTypeBuilder<EmailVerificationToken> builder)
    {
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).UseIdentityAlwaysColumn();
        builder.Property(t => t.TokenHash).IsRequired().HasMaxLength(500);
        builder.HasIndex(t => t.TokenHash);
    }
}
