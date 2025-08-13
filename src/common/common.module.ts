import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PendingUser, PendingUserSchema, User, UserSchema, VehicleDetails, vehicleDetailsSchema } from "./schema/user.schema";
import { ErrorLog, ErrorLogSchema } from "./schema/error_module.schema";
import { ActivityLog, ActivityLogSchema } from "./schema/activity_log.schema";
import { Ride, RideSchema, TemporaryRide, TemporaryRideSchema } from "./schema/ride.schema";
import { Otp, OtpSchema } from "./schema/otp.schema";
import { Payment, PaymentSchema } from "./schema/payment.schema";
import { DriverEarning, DriverEarningSchema } from "./schema/earning.schema";

@Global()
@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: User.name,
                schema: UserSchema
            },
            {
                name: PendingUser.name,
                schema: PendingUserSchema
            },
            {
                name: VehicleDetails.name,
                schema: vehicleDetailsSchema
            },
            {
                name: ErrorLog.name,
                schema: ErrorLogSchema
            },
            {
                name: ActivityLog.name,
                schema: ActivityLogSchema
            },
            {
                name: Ride.name,
                schema: RideSchema
            },
            {
                name: Otp.name,
                schema: OtpSchema
            },
            {
                name: TemporaryRide.name,
                schema: TemporaryRideSchema
            },
            {
                name: Payment.name,
                schema: PaymentSchema
            },
            {
                name: DriverEarning.name,
                schema: DriverEarningSchema
            }
        ])
    ],
    exports: [
        MongooseModule
    ]
})
export class CommonModule { }