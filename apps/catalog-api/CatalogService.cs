using Microsoft.EntityFrameworkCore;
public record ProductDto(int Id, string Name, int CategoryId);
public record CategoryDto(int Id, string Name, List<ProductDto> Products);
public class CatalogService(CatalogDb db) {
 public virtual Task<List<CategoryDto>> GetCategories(CancellationToken cancellationToken = default) => db.Categories.AsNoTracking().OrderBy(c => c.Id)
  .Select(c => new CategoryDto(c.Id,c.Name,c.Products.OrderBy(p => p.Id).Select(p => new ProductDto(p.Id,p.Name,p.CategoryId)).ToList())).ToListAsync(cancellationToken);
}
