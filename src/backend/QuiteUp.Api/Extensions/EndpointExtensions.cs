using System.Reflection;
using QuiteUp.Api.Common;

namespace QuiteUp.Api.Extensions;

public static class EndpointExtensions
{
    public static IServiceCollection AddEndpoints(this IServiceCollection services)
    {
        var endpointTypes = Assembly.GetExecutingAssembly()
            .GetTypes()
            .Where(t => t is { IsClass: true, IsAbstract: false } && t.IsAssignableTo(typeof(IEndpoint)));

        foreach (var type in endpointTypes)
            services.AddScoped(typeof(IEndpoint), type);

        return services;
    }

    public static WebApplication MapEndpoints(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var endpoints = scope.ServiceProvider.GetRequiredService<IEnumerable<IEndpoint>>();

        foreach (var endpoint in endpoints)
            endpoint.MapEndpoints(app);

        return app;
    }
}
