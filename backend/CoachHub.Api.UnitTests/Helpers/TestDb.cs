global using AwesomeAssertions;
global using NSubstitute;
global using CoachHub.Api.UnitTests.Helpers;

using CoachHub.Api.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.UnitTests.Helpers;

public sealed class TestDb : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly DbContextOptions<ApplicationDbContext> _options;

    public ApplicationDbContext Context { get; }

    public TestDb()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(_connection)
            .Options;

        Context = new ApplicationDbContext(_options);
        Context.Database.EnsureCreated();
    }

    public ApplicationDbContext NewContext() => new(_options);

    public void Dispose()
    {
        Context.Dispose();
        _connection.Dispose();
    }
}
