import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';
import { User } from './user.schema';

export type RideDocument = Ride & Document ;

@Schema({
  timestamps: true
})
export class Ride {

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: User.name,
  })
  bookedBy: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
  })
  driver?: Types.ObjectId;

  @Prop({
    type : String,
    enum : ['bike', 'car'],
    required : true
  })
  vehicleType : 'bike' | 'car' ;

  @Prop({
    type : Number,
    required : true,
    default : 5
  })
  sentToRadius : number ;

  @Prop({
    type : Number,
    required : true
  })
  distance : number ;

  @Prop({
    type : Number 
  })
  otp ?: number ;

  @Prop({
    type : Number,
    required : true
  })
  fare : number ;

  @Prop({
    type : String,
    required : true,
    enum : ['cash', 'online']
  })
  paymentMode : string ;

  @Prop({
    required: true,
    type: String,
    enum: ['processing', 'accepted', 'started', 'completed', 'cancelled', 'terminated','failed'],
    default: 'processing',
  })
  status: string;

  @Prop({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  })
  pickupLocation: {
    type: string;
    coordinates: number[];
  };

  @Prop({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  })
  dropoffLocation: {
    type: string;
    coordinates: number[];
  };

  @Prop({
    type : String,
    enum : ['user', 'driver'],
  })
  cancelledBy : string ;

}

export const RideSchema = SchemaFactory.createForClass(Ride);

export type TemporaryRideDocument = TemporaryRide & Document ;

@Schema({
  timestamps : true
})
export class TemporaryRide {

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: User.name,
  })
  bookedBy: Types.ObjectId;

  @Prop({
    type : String,
    enum : ['bike', 'car'],
    required : true
  })
  vehicleType : 'bike' | 'car' ;

  @Prop({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  })
  pickupLocation: {
    type: string;
    coordinates: number[];
  };

  @Prop({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  })
  dropoffLocation: {
    type: string;
    coordinates: number[];
  };

  @Prop({
    required : true,
    type : String
  })
  paymentSessionId : string ;

  @Prop({
    required : true,
    type : Number
  })
  distance : number ;

  @Prop({
    required : true,
    type : Number
  })
  fare : number ;

  @Prop({
    default: Date.now,
    index: {
      expires: 86400, // 24hrs in seconds 
    },
  })
  createdAt: Date;

}

export const TemporaryRideSchema = SchemaFactory.createForClass(TemporaryRide);  