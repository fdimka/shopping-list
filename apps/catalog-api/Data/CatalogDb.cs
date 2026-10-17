using Microsoft.EntityFrameworkCore;
public class Category { public int Id { get; set; } public string Name { get; set; } = ""; public List<Product> Products { get; set; } = []; }
public class Product { public int Id { get; set; } public string Name { get; set; } = ""; public int CategoryId { get; set; } public Category Category { get; set; } = null!; }
public class CatalogDb(DbContextOptions<CatalogDb> options) : DbContext(options) {
 public DbSet<Category> Categories => Set<Category>(); public DbSet<Product> Products => Set<Product>();
 protected override void OnModelCreating(ModelBuilder model) {
 model.Entity<Category>().Property(c => c.Name).HasMaxLength(100).IsRequired();
 model.Entity<Product>().Property(p => p.Name).HasMaxLength(100).IsRequired();
 model.Entity<Product>().HasOne(p=>p.Category).WithMany(c=>c.Products).HasForeignKey(p=>p.CategoryId);
 model.Entity<Category>().HasData(new Category {Id=1,Name="חלב וגבינות"},new Category {Id=2,Name="בשר"},new Category {Id=3,Name="פירות וירקות"},new Category {Id=4,Name="טואלטיקה"});
 model.Entity<Product>().HasData(
 new Product {Id=1,CategoryId=1,Name="גבינת קוטג"},new Product {Id=2,CategoryId=1,Name="חלב"},new Product {Id=3,CategoryId=1,Name="שמנת חמוצה"},new Product {Id=4,CategoryId=1,Name="גבינת טל העמק"},
 new Product {Id=5,CategoryId=2,Name="נקניקיות"},new Product {Id=6,CategoryId=2,Name="שוקיים"},new Product {Id=7,CategoryId=2,Name="קבב עגל"},
 new Product {Id=8,CategoryId=3,Name="תפוח"},new Product {Id=9,CategoryId=3,Name="מלפפון"},new Product {Id=10,CategoryId=3,Name="אבקדו"},
 new Product {Id=11,CategoryId=4,Name="מי קלון"},new Product {Id=12,CategoryId=4,Name="משחת שניים"});
 }
}
