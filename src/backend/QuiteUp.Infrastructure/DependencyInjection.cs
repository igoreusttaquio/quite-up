using HashidsNet;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Infrastructure.Messaging;
using QuiteUp.Infrastructure.Persistence;
using QuiteUp.Infrastructure.Services;

namespace QuiteUp.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"), npgsqlOptions =>
            {
                npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorCodesToAdd: null);
            });
            options.UseSnakeCaseNamingConvention();
        });

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());
        services.AddScoped<IPasswordHasher, PasswordHasherService>();
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddSingleton<IHashids>(_ => new Hashids(
            configuration["Hashids:Salt"]!,
            int.Parse(configuration["Hashids:MinLength"]!)));

        services.AddScoped<IIdEncoder, IdEncoderService>();
        services.AddSingleton<IEventBus, RabbitMqEventBus>();

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        services.AddHostedService<EmailNotificationConsumer>();

        return services;
    }
}
