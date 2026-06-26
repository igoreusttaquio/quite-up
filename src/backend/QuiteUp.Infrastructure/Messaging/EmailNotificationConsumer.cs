using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using RabbitMQ.Client.Exceptions;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Events;

namespace QuiteUp.Infrastructure.Messaging;

public class EmailNotificationConsumer : BackgroundService
{
    private readonly IConfiguration _configuration;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EmailNotificationConsumer> _logger;
    private IConnection? _connection;
    private IChannel? _channel;

    public EmailNotificationConsumer(
        IConfiguration configuration,
        IServiceScopeFactory scopeFactory,
        ILogger<EmailNotificationConsumer> logger)
    {
        _configuration = configuration;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var exchange = _configuration["RabbitMQ:Exchange"] ?? "quite-up";
        var queue = "email-notifications";

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var host = _configuration["RabbitMQ:Host"] ?? "localhost";
                var port = int.Parse(_configuration["RabbitMQ:Port"] ?? "5672");
                var user = _configuration["RabbitMQ:User"] ?? "guest";
                var password = _configuration["RabbitMQ:Password"] ?? "guest";

                var factory = new ConnectionFactory
                {
                    HostName = host,
                    Port = port,
                    UserName = user,
                    Password = password,
                    RequestedHeartbeat = TimeSpan.FromSeconds(30),
                };

                _connection = await factory.CreateConnectionAsync();
                _channel = await _connection.CreateChannelAsync();

                await _channel.ExchangeDeclareAsync(exchange, ExchangeType.Direct, durable: true);
                await _channel.QueueDeclareAsync(queue, durable: true, exclusive: false, autoDelete: false);
                await _channel.QueueBindAsync(queue, exchange, nameof(UserRegisteredEvent));
                await _channel.QueueBindAsync(queue, exchange, nameof(ForgotPasswordRequestedEvent));

                var consumer = new AsyncEventingBasicConsumer(_channel);
                consumer.ReceivedAsync += HandleMessageAsync;

                await _channel.BasicConsumeAsync(queue, autoAck: false, consumer: consumer);

                _logger.LogInformation("EmailNotificationConsumer connected to RabbitMQ and listening");

                await Task.Delay(Timeout.Infinite, stoppingToken);
            }
            catch (BrokerUnreachableException ex)
            {
                _logger.LogWarning(ex, "RabbitMQ unavailable, retrying in 10 seconds...");
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
            catch (OperationInterruptedException ex)
            {
                _logger.LogWarning(ex, "RabbitMQ operation interrupted, retrying in 10 seconds...");
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Unexpected error in EmailNotificationConsumer, retrying in 30 seconds...");
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
            finally
            {
                Cleanup();
            }
        }
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

            await _channel!.BasicAckAsync(args.DeliveryTag, multiple: false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process email notification {Type}", type);
            await _channel!.BasicNackAsync(args.DeliveryTag, multiple: false, requeue: true);
        }
    }

    private void Cleanup()
    {
        _channel?.Dispose();
        _channel = null;
        _connection?.Dispose();
        _connection = null;
    }

    public override void Dispose()
    {
        Cleanup();
        base.Dispose();
    }
}
