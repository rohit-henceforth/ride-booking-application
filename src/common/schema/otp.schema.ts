import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import * as bcrypt from "bcrypt" ;

@Schema({
    timestamps : true
})
export class Otp{

    @Prop({
        required : true
    })
    contact : string ;

    @Prop({
        required : true
    })
    otp : string ;

    @Prop({
        required : true,
        default : 0
    })
    attempted : number ;

    @Prop({
        required : true,
        enum : ["SIGN_UP", "LOGIN", "RESET_PASSWORD"],
    })
    type : "SIGN_UP" | "LOGIN" | "RESET_PASSWORD" ;

    @Prop({
        required : true ,
        enum : ['User','PendingUser'],
        default : 'User'
    })
    userModel : string ;

    @Prop({
        type : Types.ObjectId,
        refPath : "userModel"
    })
    userId : Types.ObjectId ;

    @Prop({
        default : Date.now,
        index : { 
            expires : 180
        }
    })
    createdAt : Date ;

}

export type OtpDocument = Otp & Document ;
export const OtpSchema = SchemaFactory.createForClass(Otp);

OtpSchema.pre<OtpDocument>("save", async function (next) {
    const user = this as any;
    if (!user.isModified('otp')) return next();
    const salt = await bcrypt.genSalt();
    this.otp = await bcrypt.hash(this.otp, salt);
    next();
})

OtpSchema.methods.isOtpCorrect = async function(newOtp : string){
    return await bcrypt.compare(newOtp,this.otp)
}