import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Ride } from "./ride.schema";
import { Types } from "mongoose";

export type PaymentDocument = Payment & Document ;

@Schema({
    timestamps : true
})
export class Payment {
    
    @Prop({
        type : String,
        required : true
    })
    paymentSessionId : string ;

    @Prop({
        ref : Ride.name,
        type : Types.ObjectId,
        required : true
    })
    ride : Types.ObjectId ;

    @Prop({
        type : String,
        required : true
    })
    paymentId : string ;

    @Prop({
        type : String,
        required : true
    })
    paymentIntendId : string ;

    @Prop({
        type : Number,
        required : true
    })
    amount : number ;

    @Prop({
        type : String,
        required : true
    })
    currency : string ;

    @Prop({
        type : String,
        enum : ['paid','refunded'],
        required : true,
        default : 'paid'
    })
    status : string ;

    @Prop({
        type : String,
        required : true
    })
    paymentMethod : string ;

    @Prop({
        type : String
    })
    refundId ?: string 

}

export const PaymentSchema = SchemaFactory.createForClass(Payment);