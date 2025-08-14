import {Controller, Get, Post, Req} from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { Request } from "express";

@Controller("stripe")
export class PaymentController {

    constructor(
        private readonly paymentService : PaymentService
    ){}

    @Post("webhook")
    handleStripeWebhook(@Req() request : Request){
        return this.paymentService.handleWebhook(request);
    }

    @Get("success")
    handleSuccess(@Req() request : Request){
        return "Success";
    }

    @Get("cancel")
    handleCancel(@Req() request : Request){
        return "Failed, Try again...";
    }

}
