import { Controller, Get, Post, Param, Delete, Req, Headers, RawBodyRequest, Body, Put } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Controller('stripe')
export class PaymentController {

  constructor(
    private readonly paymentService: PaymentService,
  ) {}

  @Get("create-checkout-session")
  handleCreatePaymentSession(){
    return this.paymentService.createCheckoutSession(
      "http://localhost:3000/stripe/success",
      "http://localhost:3000/stripe/cancel"
    );
  }

  @Get("success")
  handlePaymentSucess(){
    return "Thank you for placing order..."
  }

  @Get("cancel")
  handlePaymentCancel(){
    return "Forgot to add something in cart? Add and come back to place order..."
  }

  @Post("webhook")
  handleStripeWebhook(@Req() request : RawBodyRequest<Request> ,@Headers('stripe-signature') sign){
    return this.paymentService.handleWebhook(request,sign);
  }

  @Delete("refund/:intentId")
  handleRefund(@Param('intentId') intentId : string){
    this.paymentService.handleRefund(intentId);
  }

  @Get("subscriptions-data")
  handleGetSubscriptionsData(){
    return this.paymentService.getAllSubscriptions();
  }

  @Post("create-customer")
  handleCreateCustomer(@Body() createCustomerDto : CreateCustomerDto){
    return this.paymentService.createCustomer(createCustomerDto);
  }

  @Post("create-subscription")
  handleCreateSubscription(@Body() createSubscriptionDto : CreateSubscriptionDto){
    return this.paymentService.createSubscription(createSubscriptionDto.customerId,createSubscriptionDto.priceId);
  }

  @Post("create-subscription-by-checkout")
  handleCreateSubscriptionByCheckout(@Body() createSubscriptionDto : CreateSubscriptionDto){
    return this.paymentService.createSubscriptionWithCheckout(
      createSubscriptionDto.priceId,
      createSubscriptionDto.customerId,
      "http://localhost:3000/stripe/success",
      "http://localhost:3000/stripe/cancel"
    );
  }

  @Put("update-subscription")
  handleUpdateSubscription(@Body() updateSubscriptionDto : UpdateSubscriptionDto){
    return this.paymentService.handleUpdateSubscriptionStatus(updateSubscriptionDto.subscriptionId,updateSubscriptionDto.priceId);
  }

  @Delete("delete-subscription/:subscriptionId")
  handleDeleteSubscription(@Param('subscriptionId') subscriptionId : string){
    return this.paymentService.handleDeleteSubscription(subscriptionId);
  }

  @Get("customer-subscriptions/:customerId")
  handleGetCustomerSubscriptions(@Param('customerId') customerId : string){
    return this.paymentService.getUserSubscriptions(customerId);
  }
  
}
