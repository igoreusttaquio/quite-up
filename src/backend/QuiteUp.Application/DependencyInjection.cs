using FluentValidation;
using NetDevPack.SimpleMediator;
using Microsoft.Extensions.DependencyInjection;
using QuiteUp.Application.Common.Behaviors;

namespace QuiteUp.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddSimpleMediator();
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

        return services;
    }
}
