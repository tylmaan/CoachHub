using System.Net;
using System.Net.Http.Json;

namespace CoachHub.Api.IntegrationTests.Infrastructure;

public abstract class ApiTestBase : IClassFixture<CoachHubFactory>
{
    protected CoachHubFactory Factory { get; }

    protected ApiTestBase(CoachHubFactory factory) => Factory = factory;

    protected Task<World> NewWorldAsync() => World.CreateAsync(Factory);

    protected static async Task<T> ReadAsync<T>(HttpResponseMessage response)
    {
        var body = await response.Content.ReadFromJsonAsync<T>();
        body.Should().NotBeNull();
        return body!;
    }

    protected static void ShouldBe(HttpResponseMessage response, HttpStatusCode expected)
    {
        if (response.StatusCode == expected) return;

        var body = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();
        throw new Xunit.Sdk.XunitException(
            $"Expected {(int)expected} {expected} but got {(int)response.StatusCode} {response.StatusCode}. Body: {body}");
    }
}
