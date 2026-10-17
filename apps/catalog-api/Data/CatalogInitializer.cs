using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
public static class CatalogInitializer {
 public static async Task Initialize(string connection, string password) {
  if (password.Length < 16) throw new InvalidOperationException("SQL_APP_PASSWORD must contain at least 16 characters");
  await using var db = new CatalogDb(new DbContextOptionsBuilder<CatalogDb>().UseSqlServer(connection, sql=>sql.EnableRetryOnFailure()).Options);
  await db.Database.EnsureCreatedAsync();
  // The fixed login identifier is never taken from a request. Escape the DDL password literal.
  var escaped = password.Replace("'","''");
  var sql = $"IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'shopping_catalog') CREATE LOGIN [shopping_catalog] WITH PASSWORD = N'{escaped}'; IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'shopping_catalog') CREATE USER [shopping_catalog] FOR LOGIN [shopping_catalog]; GRANT SELECT ON dbo.Categories TO [shopping_catalog]; GRANT SELECT ON dbo.Products TO [shopping_catalog];";
  await using var session = new SqlConnection(connection);
  await session.OpenAsync();
  await using var command = new SqlCommand(sql,session);
  await command.ExecuteNonQueryAsync();
 }
}
