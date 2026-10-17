using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;
public class CatalogTests {
 [Fact] public async Task SeedsExactHebrewCatalogAndProjectsRelationships() {
  await using var connection = new SqliteConnection("DataSource=:memory:");await connection.OpenAsync();
  await using var db = new CatalogDb(new DbContextOptionsBuilder<CatalogDb>().UseSqlite(connection).Options);
  await db.Database.EnsureCreatedAsync();
  var categories = await new CatalogService(db).GetCategories();
  Assert.Equal(4,categories.Count);Assert.Equal(12,categories.Sum(c=>c.Products.Count));
  Assert.Equal("חלב וגבינות",categories[0].Name);
  Assert.Contains(categories[2].Products,p=>p.Name=="אבקדו");
  Assert.All(categories,c=>Assert.All(c.Products,p=>Assert.Equal(c.Id,p.CategoryId)));
 }
}
