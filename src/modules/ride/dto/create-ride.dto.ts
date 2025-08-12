import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class CreateRideDto {

  @ApiProperty({ example: [76.687173,30.706533] })
  @IsNotEmpty()
  readonly pickupLocationCoordinates: [number, number];

  @ApiProperty({ example: [76.7688704, 30.7068928] })
  @IsNotEmpty()
  readonly dropoffLocationCoordinates: [number, number];

  @ApiProperty({ example: "bike" })
  @IsNotEmpty()
  readonly vehicleType: string;

}