import { Type, Transform } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;
export class OrderItemDto {
  @IsInt() @Min(1) productId: number;
  @IsInt() @Min(1) categoryId: number;
  @IsString() @Transform(trim) @MinLength(1) @MaxLength(100) name: string;
  @IsString()
  @Transform(trim)
  @MinLength(1)
  @MaxLength(100)
  categoryName: string;
  @IsInt() @Min(1) @Max(999) quantity: number;
}
export class CreateOrderDto {
  @IsUUID("4") requestId: string;
  @IsString()
  @Transform(trim)
  @MaxLength(100)
  @Matches(
    /^[\u05D0-\u05EA][\u05D0-\u05EA\u0591-\u05C7'\u05F3\u05F4"-]*(?: +[\u05D0-\u05EA][\u05D0-\u05EA\u0591-\u05C7'\u05F3\u05F4"-]*)+$/u,
  )
  fullName: string;
  @IsString()
  @Transform(trim)
  @MinLength(5)
  @MaxLength(300)
  @Matches(/^[\u05D0-\u05EA\u0591-\u05C7\u05F3\u05F40-9 .,\/'"()\-]+$/u)
  @Matches(/[\u05D0-\u05EA]/u)
  address: string;
  @IsString()
  @Transform(trim)
  @MaxLength(254)
  @IsEmail({ allow_utf8_local_part: false })
  email: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
