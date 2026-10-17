using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Xunit;
public class HttpTests {
 [Fact] public async Task LiveEndpointAndUnknownRoutesReturnSafeResponses() {
  using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder => {
   builder.UseEnvironment("Testing");builder.UseSetting("ConnectionStrings:Catalog","Server=unused;Database=unused");
  });
  using var client = factory.CreateClient();
  Assert.Equal(HttpStatusCode.OK,(await client.GetAsync("/health/live")).StatusCode);
  var missing = await client.GetAsync("/missing");
  Assert.Equal(HttpStatusCode.NotFound,missing.StatusCode);
  Assert.Equal("application/problem+json",missing.Content.Headers.ContentType?.MediaType);
  Assert.True(missing.Headers.Contains("X-Request-Id"));
 }
}

public class ErrorTests {
 [Theory]
 [InlineData(500)]
 [InlineData(503)]
 public async Task CatalogFailuresReturnSafeProblemDetails(int status) {
  using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder => {
   builder.UseEnvironment("Testing");builder.UseSetting("ConnectionStrings:Catalog","Server=unused;Database=unused");
   builder.ConfigureServices(services => {
    services.RemoveAll<CatalogService>();
    services.AddScoped<CatalogService>(_ => new FailingCatalogService(status));
   });
  });
  var response=await factory.CreateClient().GetAsync("/api/categories");
  Assert.Equal(status,(int)response.StatusCode);
  var body=await response.Content.ReadAsStringAsync();
  Assert.DoesNotContain("private-password",body);
  Assert.Contains("traceId",body);
 }
 private class FailingCatalogService(int status) : CatalogService(null!) {
  public override Task<List<CategoryDto>> GetCategories(CancellationToken token=default) => throw (status==503 ? new TimeoutException("private-password") : new InvalidOperationException("private-password"));
 }
}
