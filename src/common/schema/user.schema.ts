import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { PaginateModel, Types } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';

export type UserDocument = User & Document;
export type UserModelPaginate = PaginateModel<UserDocument>;

export type VehicleDetailsDocument = VehicleDetails & Document;
@Schema()
export class VehicleDetails {

    @Prop({
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        type : String
    })
    numberPlate: string;

    @Prop({
        required: true,
        trim: true,
        lowercase: true,
        type : String
    })
    type: string;

    @Prop({
        required: true,
        trim: true,
        lowercase: true,
        type : String
    })
    model: string;

}

export const vehicleDetailsSchema = SchemaFactory.createForClass(VehicleDetails);

@Schema()
export class User {

  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop()
  profilePic: string;

  @Prop()
  profilePicPublicId: string;

  @Prop({
    required: true,
  })
  password: string;

  @Prop()
  resetPasswordToken: string;

  @Prop({
    required: true,
    unique: true,
  })
  contactNumber: number;

  @Prop()
  refreshToken: string;

  @Prop({
    required: true,
    default: false,
  })
  isContactNumberVerified: boolean;

  @Prop({
    required: true,
    default: 'user',
  })
  role: 'admin' | 'user' | 'super-admin' | 'driver';

  @Prop({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  })
  location?: {
    type: string;
    coordinates: number[];
  };

  @Prop({
    type : Types.ObjectId,
    ref : VehicleDetails.name
  })
  vehicleDetails?: Types.ObjectId;

  @Prop({
    type : String
  })
  stripeAccountId ?: string ;

}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.plugin(mongoosePaginate);
UserSchema.index({ location: '2dsphere' });

UserSchema.methods.isPasswordCorrect = async function (newPassword: string) {
  return await bcrypt.compare(newPassword, this.password);
};

export type PendingUserDocument = PendingUser & Document;

@Schema({
  timestamps: true,
})
export class PendingUser {
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
  })
  password: string;

  @Prop({
    required: true,
    unique: true,
  })
  contactNumber: number;

  @Prop({
    required: true,
    default: false,
  })
  isVerified: boolean;

  @Prop({
    required: true,
    default: 'user',
  })
  role: 'admin' | 'user' | 'driver';

  @Prop({
    default: Date.now,
    index: {
      expires: 180,
    },
  })
  createdAt: Date;
}

export const PendingUserSchema = SchemaFactory.createForClass(PendingUser);

PendingUserSchema.pre<PendingUserDocument>('save', async function (next) {
  const user = this as any;
  if (!user.isModified('password')) return next();
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});