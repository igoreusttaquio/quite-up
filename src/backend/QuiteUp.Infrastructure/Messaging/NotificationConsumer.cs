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
using QuiteUp.Domain.Entities;

namespace QuiteUp.Infrastructure.Messaging;

public class NotificationConsumer : BackgroundService
{
    private readonly IConfiguration _configuration;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NotificationConsumer> _logger;
    private IConnection? _connection;
    private IChannel? _channel;

    public NotificationConsumer(
        IConfiguration configuration,
        IServiceScopeFactory scopeFactory,
        ILogger<NotificationConsumer> logger)
    {
        _configuration = configuration;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var exchange = _configuration["RabbitMQ:Exchange"] ?? "quite-up";
        var queue = "notifications";

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
                await _channel.QueueBindAsync(queue, exchange, nameof(DebtPaidOffEvent));

                var consumer = new AsyncEventingBasicConsumer(_channel);
                consumer.ReceivedAsync += HandleMessageAsync;

                await _channel.BasicConsumeAsync(queue, autoAck: false, consumer: consumer);

                _logger.LogInformation("NotificationConsumer connected to RabbitMQ and listening");

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
                _logger.LogError(ex, "Unexpected error in NotificationConsumer, retrying in 30 seconds...");
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
            var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

            switch (type)
            {
                case nameof(DebtPaidOffEvent):
                    var debtEvent = JsonSerializer.Deserialize<DebtPaidOffEvent>(body);
                    if (debtEvent is not null)
                    {
                        context.Notifications.Add(new Notification
                        {
                            UserId = debtEvent.UserId,
                            Title = "Dívida quitada! 🎉",
                            Message = $"Parabéns! Você quitou a dívida \"{debtEvent.DebtName}\" no valor de {debtEvent.TotalAmount:C}.",
                            Type = "success",
                            IsRead = false,
                            ReferenceType = "debt",
                            ReferenceId = debtEvent.DebtId.ToString(),
                        });
                        await context.SaveChangesAsync();
                        _logger.LogInformation("Created notification for DebtPaidOff: {DebtName}", debtEvent.DebtName);
                    }
                    break;
            }

            await _channel!.BasicAckAsync(args.DeliveryTag, multiple: false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process notification {Type}", type);
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
