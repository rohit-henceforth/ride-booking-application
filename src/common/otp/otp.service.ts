import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { Otp, OtpDocument } from '../schema/otp.schema';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class OtpService {

    constructor (
        @InjectModel(Otp.name) private otpModel : Model<OtpDocument>
    ){}

    private generateRandomOtp() {
      return Math.floor(1000 + Math.random() * 9000);
    }

    async createOtp(
        type : Otp['type'],
        contact : number,
        userId : Types.ObjectId
    ){

        if(!contact || !userId || !type){
            throw new BadRequestException("All fields are required!")
        }

        const otp = this.generateRandomOtp();

        const newOtp = new this.otpModel({
            contact,
            type,
            otp,
            userId,
            userModel : type === "SIGN_UP" ? "PendingUser" : "User"
        })

        newOtp.save();

        return otp ;

    }

    async verifyOtp (
        otp : string,
        type : Otp['type'],
        contact : number
    ) {

        if(!otp || !type || !contact){
            throw new BadRequestException("All fields are required!")
        }

        const otpDoc : any = await this.otpModel.findOne({
            type,
            contact
        });

        if(!otpDoc){
            return false ;
        }

        const isOtpValid = await otpDoc.isOtpCorrect(otp);

        if(!isOtpValid){
            otpDoc.attempted += 1 ;
            await otpDoc.save();
            return false ;
        }

        await this.otpModel.findByIdAndDelete(otpDoc?._id);

        return true ;

    }

}
