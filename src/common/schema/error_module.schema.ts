import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, PaginateModel } from "mongoose";
import * as mongoosePaginate from "mongoose-paginate-v2";

export type ErrorLogDocument = ErrorLog & Document ;
export type ErrorPaginateModel = PaginateModel<ErrorLogDocument> ;

@Schema({timestamps : true})
export class ErrorLog{

    @Prop({
        required : true
    })
    message : string ;

    @Prop({
        required : true
    })
    statusCode : number ;

    @Prop({
        required : true
    })
    path : string ;

    @Prop({
        required : true
    })
    method : string ;

    @Prop({
        required : true
    })
    stack?: string ;

    @Prop()
    userId : mongoose.Types.ObjectId ;

}

export const ErrorLogSchema = SchemaFactory.createForClass(ErrorLog);

ErrorLogSchema.plugin(mongoosePaginate);