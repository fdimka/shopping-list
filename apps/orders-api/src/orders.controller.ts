import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Post,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreateOrderDto } from "./order.dto";
import { Order } from "./order.schema";
import { CatalogService } from "./catalog.service";
function snapshot(
  value: Pick<CreateOrderDto, "fullName" | "address" | "email" | "items">,
) {
  return JSON.stringify({
    fullName: value.fullName,
    address: value.address,
    email: value.email,
    items: value.items
      .map((i) => ({
        productId: i.productId,
        categoryId: i.categoryId,
        name: i.name,
        categoryName: i.categoryName,
        quantity: i.quantity,
      }))
      .sort((a, b) => a.productId - b.productId),
  });
}
@Controller("api/orders")
export class OrdersController {
  constructor(
    @InjectModel(Order.name) private readonly orders: Model<Order>,
    private readonly catalog: CatalogService,
  ) {}
  @Post() async create(@Body() dto: CreateOrderDto) {
    if (new Set(dto.items.map((i) => i.productId)).size !== dto.items.length)
      throw new BadRequestException("Duplicate products");
    const previous = await this.orders
      .findOne({ requestId: dto.requestId })
      .exec();
    if (previous) return this.replay(previous, dto);
    const items = await this.catalog.validateItems(dto.items);
    try {
      const order = await this.orders.create({ ...dto, items });
      return { id: order._id.toString() };
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        const existing = await this.orders
          .findOne({ requestId: dto.requestId })
          .exec();
        if (existing) return this.replay(existing, dto);
      }
      throw error;
    }
  }
  private replay(existing: Order & { _id: unknown }, dto: CreateOrderDto) {
    if (snapshot(existing) !== snapshot(dto))
      throw new ConflictException(
        "Request already saved with different details",
      );
    return { id: String(existing._id) };
  }
}
