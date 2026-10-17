import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { OrderItemDto } from "./order.dto";
interface Category {
  id: number;
  name: string;
  products: { id: number; name: string; categoryId: number }[];
}
@Injectable()
export class CatalogService {
  async validateItems(items: OrderItemDto[]): Promise<OrderItemDto[]> {
    let catalog: Category[];
    try {
      const response = await fetch(
        `${process.env.CATALOG_API_URL || "http://localhost:5000"}/api/categories`,
        { signal: AbortSignal.timeout(5000) },
      );
      if (!response.ok) throw new Error();
      catalog = (await response.json()) as Category[];
      if (!Array.isArray(catalog)) throw new Error();
    } catch {
      throw new ServiceUnavailableException("Catalog unavailable");
    }
    return items.map((item) => {
      const category = catalog.find((c) => c.id === item.categoryId);
      const product = category?.products.find((p) => p.id === item.productId);
      if (
        !category ||
        !product ||
        product.name !== item.name ||
        category.name !== item.categoryName ||
        product.categoryId !== item.categoryId
      )
        throw new BadRequestException("Invalid catalog product");
      return { ...item, name: product.name, categoryName: category.name };
    });
  }
}
