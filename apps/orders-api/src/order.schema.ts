import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
@Schema({ _id: false })
export class OrderItem {
  @Prop({ required: true }) productId: number;
  @Prop({ required: true }) categoryId: number;
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) categoryName: string;
  @Prop({ required: true, min: 1, max: 999 }) quantity: number;
}
const ItemSchema = SchemaFactory.createForClass(OrderItem);
@Schema({ timestamps: true, versionKey: false })
export class Order {
  @Prop({ required: true, unique: true }) requestId: string;
  @Prop({ required: true }) fullName: string;
  @Prop({ required: true }) address: string;
  @Prop({ required: true }) email: string;
  @Prop({ type: [ItemSchema], required: true }) items: OrderItem[];
}
export const OrderSchema = SchemaFactory.createForClass(Order);
