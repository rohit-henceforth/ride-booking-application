import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, PaginateModel } from "mongoose";
import * as mongoosePaginate from "mongoose-paginate-v2";

export type ActivityLogDocument = ActivityLog & Document;
export type ActivityPaginateModel = PaginateModel<ActivityLogDocument>;

@Schema({ timestamps: true })
export class ActivityLog {

    @Prop({
        required: true
    })
    message: string;

    @Prop({
        required: true
    })
    action: string;

    @Prop({
        required : true
    })
    userId: mongoose.Types.ObjectId;

}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);

ActivityLogSchema.plugin(mongoosePaginate);