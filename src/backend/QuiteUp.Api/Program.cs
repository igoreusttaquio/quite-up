using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using QuiteUp.Api.Extensions;
using QuiteUp.Api.Middleware;
using QuiteUp.Application;
using QuiteUp.Infrastructure;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((ctx, cfg) => cfg
    .ReadFrom.Configuration(ctx.Configuration)
    .WriteTo.Console());

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddEndpoints();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(builder.Configuration["App:Url"]!)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapEndpoints();

Task.Run(async () =>
{
    await Task.Delay(TimeSpan.FromSeconds(5));

    for (var attempt = 1; attempt <= 10; attempt++)
    {
        try
        {
            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<QuiteUp.Infrastructure.Persistence.ApplicationDbContext>();
            await db.Database.MigrateAsync();
            await QuiteUp.Infrastructure.Persistence.DatabaseSeeder.SeedAsync(db);
            Log.Information("Database migrations and seeding completed successfully");
            return;
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Database migration failed (attempt {Attempt}/10). Retrying in {Delay}s...", attempt, attempt * 5);
            await Task.Delay(TimeSpan.FromSeconds(attempt * 5));
        }
    }

    Log.Error("Database migrations failed after 10 attempts. The application will start but the database may not be ready.");
});

app.Run();
