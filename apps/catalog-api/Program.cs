using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Threading.RateLimiting;
var builder = WebApplication.CreateBuilder(args.Where(arg => arg != "--initialize").ToArray());
if (args.Contains("--initialize")) {
 await CatalogInitializer.Initialize(builder.Configuration.GetConnectionString("Catalog") ?? throw new InvalidOperationException("ConnectionStrings__Catalog is required"),builder.Configuration["SQL_APP_PASSWORD"] ?? throw new InvalidOperationException("SQL_APP_PASSWORD is required"));
 return;
}
var connection = builder.Configuration.GetConnectionString("Catalog") ?? throw new InvalidOperationException("ConnectionStrings__Catalog is required");
builder.WebHost.ConfigureKestrel(o => o.AddServerHeader = false);
builder.Services.AddDbContext<CatalogDb>(o => o.UseSqlServer(connection, sql => sql.EnableRetryOnFailure(3).CommandTimeout(10)));
builder.Services.AddScoped<CatalogService>();
builder.Services.AddProblemDetails();
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.WithOrigins(builder.Configuration["FrontendOrigin"] ?? "http://localhost:5173").AllowAnyHeader().WithMethods("GET")));
builder.Services.AddRateLimiter(options => {
 options.RejectionStatusCode = 429;
 options.AddPolicy("catalog", context => RateLimitPartition.GetFixedWindowLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "local", _ => new FixedWindowRateLimiterOptions { PermitLimit = 120, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
 options.OnRejected = async (context, token) => await Results.Problem(statusCode:429,title:"Too many requests").ExecuteAsync(context.HttpContext);
});
var app = builder.Build();
app.Use(async (context,next) => {
 context.Response.Headers["X-Content-Type-Options"]="nosniff";
 context.Response.Headers["X-Frame-Options"]="DENY";
 context.Response.Headers["X-Request-Id"]=context.TraceIdentifier;
 await next();
});
app.UseExceptionHandler(handler => handler.Run(async context => {
 var error = context.Features.Get<IExceptionHandlerFeature>()?.Error;
 var status = error is SqlException or TimeoutException ? 503 : 500;
 await Results.Problem(statusCode:status,title:status==503?"Service unavailable":"Internal server error",extensions:new Dictionary<string,object?>{{"traceId",context.TraceIdentifier}}).ExecuteAsync(context);
}));
app.UseStatusCodePages(async context => {
 await Results.Problem(statusCode:context.HttpContext.Response.StatusCode,extensions:new Dictionary<string,object?>{{"traceId",context.HttpContext.TraceIdentifier}}).ExecuteAsync(context.HttpContext);
});
app.UseCors();
app.UseRateLimiter();
app.MapGet("/api/categories", (CatalogService service,CancellationToken token) => service.GetCategories(token)).RequireRateLimiting("catalog");
app.MapGet("/health/live", () => Results.Ok(new {status="ok"}));
app.MapGet("/health/ready", async (CatalogDb db) => {
 var ready = await db.Database.CanConnectAsync();
 return ready ? Results.Ok(new {status="ok",database="sqlserver",provider=db.Database.ProviderName}) : Results.Problem(statusCode:503,title:"Service unavailable");
});
app.MapGet("/health", async (CatalogDb db) => await db.Database.CanConnectAsync() ? Results.Ok(new {status="ok"}) : Results.Problem(statusCode:503,title:"Service unavailable"));
app.Run();
public partial class Program { }
