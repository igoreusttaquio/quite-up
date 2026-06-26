using Microsoft.EntityFrameworkCore;
using QuiteUp.Domain.Entities;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    private static readonly List<Category> DefaultCategories =
    [
        new() { Name = "Salário", Type = CategoryType.Income, Icon = "briefcase", Color = "#22c55e", IsDefault = true },
        new() { Name = "Freelance", Type = CategoryType.Income, Icon = "laptop", Color = "#3b82f6", IsDefault = true },
        new() { Name = "Investimentos", Type = CategoryType.Income, Icon = "trending-up", Color = "#8b5cf6", IsDefault = true },
        new() { Name = "Presente", Type = CategoryType.Income, Icon = "gift", Color = "#f59e0b", IsDefault = true },
        new() { Name = "Outros (Receita)", Type = CategoryType.Income, Icon = "plus-circle", Color = "#6b7280", IsDefault = true },

        new() { Name = "Alimentação", Type = CategoryType.Expense, Icon = "utensils", Color = "#ef4444", IsDefault = true },
        new() { Name = "Moradia", Type = CategoryType.Expense, Icon = "home", Color = "#f97316", IsDefault = true },
        new() { Name = "Transporte", Type = CategoryType.Expense, Icon = "car", Color = "#eab308", IsDefault = true },
        new() { Name = "Saúde", Type = CategoryType.Expense, Icon = "heart-pulse", Color = "#ec4899", IsDefault = true },
        new() { Name = "Educação", Type = CategoryType.Expense, Icon = "graduation-cap", Color = "#6366f1", IsDefault = true },
        new() { Name = "Lazer", Type = CategoryType.Expense, Icon = "gamepad-2", Color = "#14b8a6", IsDefault = true },
        new() { Name = "Vestuário", Type = CategoryType.Expense, Icon = "shirt", Color = "#a855f7", IsDefault = true },
        new() { Name = "Assinaturas", Type = CategoryType.Expense, Icon = "repeat", Color = "#64748b", IsDefault = true },
        new() { Name = "Dívidas", Type = CategoryType.Expense, Icon = "credit-card", Color = "#dc2626", IsDefault = true },
        new() { Name = "Outros (Despesa)", Type = CategoryType.Expense, Icon = "minus-circle", Color = "#6b7280", IsDefault = true },
    ];

    public static async Task SeedAsync(ApplicationDbContext context)
    {
        var hasDefaults = await context.Categories.AnyAsync(c => c.IsDefault && c.UserId == null);
        if (hasDefaults) return;

        foreach (var category in DefaultCategories)
            category.CreatedAt = DateTime.UtcNow;

        context.Categories.AddRange(DefaultCategories);
        await context.SaveChangesAsync();
    }
}
