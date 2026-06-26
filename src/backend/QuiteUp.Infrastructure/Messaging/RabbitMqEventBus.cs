using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using QuiteUp.Application.Common.Interfaces;

namespace QuiteUp.Infrastructure.Messaging;

public class RabbitMqEventBus : IEventBus, IAsyncDisposable
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<RabbitMqEventBus> _logger;
    private IConnection? _connection;
    private IChannel? _channel;
    private readonly SemaphoreSlim _lock = new(1, 1);
    private bool _initialized;

    public RabbitMqEventBus(IConfiguration configuration, ILogger<RabbitMqEventBus> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task PublishAsync<T>(T @event, CancellationToken cancellationToken = default) where T : class
    {
        try
        {
            if (!_initialized)
                await InitializeAsync(cancellationToken);

            if (_channel is null || !_channel.IsOpen)
            {
                _logger.LogWarning("RabbitMQ channel not available, event {Type} will not be published", typeof(T).Name);
                return;
            }

            var routingKey = typeof(T).Name;
            var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(@event));

            var props = new BasicProperties
            {
                Persistent = true,
                Type = routingKey,
            };

            await _channel.BasicPublishAsync(
                exchange: _exchange,
                routingKey: routingKey,
                mandatory: true,
                basicProperties: props,
                body: body,
                cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to publish event {Type}", typeof(T).Name);
        }
    }

    private string _exchange = string.Empty;

    private async Task InitializeAsync(CancellationToken cancellationToken)
    {
        await _lock.WaitAsync(cancellationToken);
        try
        {
            if (_initialized) return;

            var host = _configuration["RabbitMQ:Host"] ?? "localhost";
            var port = int.Parse(_configuration["RabbitMQ:Port"] ?? "5672");
            var user = _configuration["RabbitMQ:User"] ?? "guest";
            var password = _configuration["RabbitMQ:Password"] ?? "guest";
            _exchange = _configuration["RabbitMQ:Exchange"] ?? "quite-up";

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
            await _channel.ExchangeDeclareAsync(_exchange, ExchangeType.Direct, durable: true);

            _initialized = true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to connect to RabbitMQ. Events will not be published until connection is established.");
        }
        finally
        {
            _lock.Release();
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_channel is not null)
        {
            await _channel.CloseAsync();
            _channel.Dispose();
        }
        if (_connection is not null)
        {
            await _connection.CloseAsync();
            _connection.Dispose();
        }
    }
}
