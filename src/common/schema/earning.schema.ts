import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

export type DriverEarningDocument = DriverEarning & Document;

@Schema({
    timestamps : true
})
export class DriverEarning {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  driver: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Ride', required: true })
  ride: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Payment', required: true })
  payment: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ default: 'pending', enum: ['pending', 'paid', 'failed'] })
  status: string;

  @Prop()
  stripeAccountId?: string;

  @Prop()
  stripeTransferId?: string;

  @Prop()
  payoutDate?: Date;
}

export const DriverEarningSchema = SchemaFactory.createForClass(DriverEarning);