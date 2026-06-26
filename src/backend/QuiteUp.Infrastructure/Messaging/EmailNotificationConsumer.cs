using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Events;

namespace QuiteUp.Infrastructure.Messaging;

public class EmailNotificationConsumer : BackgroundService
{
    private readonly IConnection _connection;
    private readonly IChannel _channel;
    private readonly string _exchange;
    private readonly string _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EmailNotificationConsumer> _logger;

    public EmailNotificationConsumer(
        IConfiguration configuration,
        IServiceScopeFactory scopeFactory,
        ILogger<EmailNotificationConsumer> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;

        var host = configuration["RabbitMQ:Host"] ?? "localhost";
        var port = int.Parse(configuration["RabbitMQ:Port"] ?? "5672");
        var user = configuration["RabbitMQ:User"] ?? "guest";
        var password = configuration["RabbitMQ:Password"] ?? "guest";
        _exchange = configuration["RabbitMQ:Exchange"] ?? "quite-up";
        _queue = "email-notifications";

        var factory = new ConnectionFactory
        {
            HostName = host,
            Port = port,
            UserName = user,
            Password = password,

        };

        _connection = factory.CreateConnectionAsync().GetAwaiter().GetResult();
        _channel = _connection.CreateChannelAsync().GetAwaiter().GetResult();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await _channel.ExchangeDeclareAsync(_exchange, ExchangeType.Direct, durable: true, cancellationToken: stoppingToken);
        await _channel.QueueDeclareAsync(_queue, durable: true, exclusive: false, autoDelete: false, cancellationToken: stoppingToken);

        await _channel.QueueBindAsync(_queue, _exchange, nameof(UserRegisteredEvent), cancellationToken: stoppingToken);
        await _channel.QueueBindAsync(_queue, _exchange, nameof(ForgotPasswordRequestedEvent), cancellationToken: stoppingToken);

        var consumer = new AsyncEventingBasicConsumer(_channel);
        consumer.ReceivedAsync += HandleMessageAsync;

        await _channel.BasicConsumeAsync(_queue, autoAck: false, consumer: consumer, cancellationToken: stoppingToken);

        await Task.Delay(Timeout.Infinite, stoppingToken);
    }

    private async Task HandleMessageAsync(object sender, BasicDeliverEventArgs args)
    {
        var body = Encoding.UTF8.GetString(args.Body.Span);
        var type = args.BasicProperties.Type;

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

            switch (type)
            {
                case nameof(UserRegisteredEvent):
                    var registered = JsonSerializer.Deserialize<UserRegisteredEvent>(body);
                    if (registered is not null)
                        await emailService.SendEmailVerificationAsync(registered.Email, registered.Name, registered.Token);
                    break;

                case nameof(ForgotPasswordRequestedEvent):
                    var forgot = JsonSerializer.Deserialize<ForgotPasswordRequestedEvent>(body);
                    if (forgot is not null)
                        await emailService.SendPasswordResetAsync(forgot.Email, forgot.Name, forgot.Token);
                    break;
            }

            await _channel.BasicAckAsync(args.DeliveryTag, multiple: false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process email notification {Type}", type);
            await _channel.BasicNackAsync(args.DeliveryTag, multiple: false, requeue: true);
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        await _channel.CloseAsync(cancellationToken);
        await _connection.CloseAsync(cancellationToken);
        await base.StopAsync(cancellationToken);
    }

    public override void Dispose()
    {
        _channel?.Dispose();
        _connection?.Dispose();
        base.Dispose();
    }
}
