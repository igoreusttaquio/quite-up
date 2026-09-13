using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Infrastructure.Persistence.Configurations;

public class UserProfilePhotoConfiguration : IEntityTypeConfiguration<UserProfilePhoto>
{
    public void Configure(EntityTypeBuilder<UserProfilePhoto> builder)
    {
        builder.ToTable("user_profile_photos");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id").UseIdentityAlwaysColumn();
        builder.Property(p => p.CreatedAt).HasColumnName("created_at");
        builder.Property(p => p.UpdatedAt).HasColumnName("updated_at");

        builder.Property(p => p.UserId).HasColumnName("user_id");
        builder.Property(p => p.FileName).HasColumnName("file_name").HasMaxLength(255);
        builder.Property(p => p.ContentType).HasColumnName("content_type").HasMaxLength(100);
        builder.Property(p => p.FileSize).HasColumnName("file_size");
        builder.Property(p => p.Data).HasColumnName("data");

        builder.HasOne(p => p.User)
            .WithOne()
            .HasForeignKey<UserProfilePhoto>(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(p => p.UserId).HasDatabaseName("ix_user_profile_photos_user_id").IsUnique();
    }
}
