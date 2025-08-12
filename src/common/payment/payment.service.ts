import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ApiResponse from 'src/common/helpers/api-response';
import Stripe from 'stripe';
import { CreateCustomerDto } from './dto/create-customer.dto';
import Api from 'twilio/lib/rest/Api';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY')!);
  }

  async createCheckoutSession(successUrl: string, cancelUrl: string) {
    const session = await this.stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Camera',
              description: 'DSLR camera',
            },
            unit_amount: 400000,
          },
          quantity: 1,
        },
      ],
      submit_type: 'pay',
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    await this.getAllSubscriptions();
    return session.url;
  }

  async handleWebhook(request: any, sign: any) {
    try {
      const event = await this.stripe.webhooks.constructEvent(
        request.body,
        sign,
        this.configService.get('STRIPE_WEBHOOK_ENDPOINT_SECRET')!,
      );

      switch (event.type) {
        case 'checkout.session.completed':
          console.log('Payment done!', event.data.object);
          break;
        case 'checkout.session.async_payment_failed':
          console.log('Payment failed!', event.data.object);
          break;
        case 'customer.subscription.created':
          console.log('New subscription created!', event.data.object);
          break;
        case 'invoice.payment_succeeded':
          console.log('Invoice payment done!', event.data.object);
          break;
        case 'invoice.payment_failed':
          console.log('Invoice payment falied!', event.data.object);
          break;
        case 'customer.subscription.updated':
          console.log('Subscription updated!', event.data.object);
          break;
        case 'customer.subscription.deleted':
          console.log('Subscription deleted!', event.data.object);
          break;
        case 'charge.refunded':
          console.log('Payment refunded!', event.data.object);
          break;
      }

      return {
        received: true,
      };
    } catch (error) {
      console.log(error);
    }
  }

  async handleRefund(paymentIntentId: string) {
    await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
    });
    return {
      message: 'Refund has been initiated!',
    };
  }

  async createCustomer(createCustomerDto: CreateCustomerDto) {
    const { email, paymentMethodId } = createCustomerDto;

    const customer = await this.stripe.customers.create({
      email,
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return new ApiResponse(
      true,
      'New customer created successfully.',
      HttpStatus.CREATED,
      {
        id: customer.id,
        email: customer.email,
      },
    );
  }

  async getAllSubscriptions(): Promise<ApiResponse<any>> {
    const subscriptions: any = await this.stripe.products.list();

    console.log(subscriptions);

    const subscriptionsData = subscriptions?.data?.map((subscription) => ({
      id: subscription?.id,
      active: subscription?.active,
      default_price: subscription?.default_price,
      description: subscription?.description,
      images: subscription?.images,
      name: subscription?.name,
    }));

    return new ApiResponse(
      true,
      'Subscriptions data fetched successfully.',
      HttpStatus.OK,
      subscriptionsData,
    );
  }

  async createSubscription(customerId: string, priceId: string) {
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
    });

    console.log(subscription);

    return new ApiResponse(
      true,
      'Subscription created successfully.',
      HttpStatus.CREATED,
      {
        subscriptionId: subscription.id,
        status: subscription.status,
        plan: subscription.items.data[0].price.nickname,
        price: Number(subscription.items.data[0]?.price.unit_amount) / 100,
        currency: subscription.items.data[0].price.currency,
      },
    );
  }

  async createSubscriptionWithCheckout(
    priceId: string,
    customerId: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    const subscription = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      submit_type: 'subscribe',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return new ApiResponse(
      true,
      'Subscription created successfully.',
      HttpStatus.CREATED,
      {
        url: subscription.url,
        id: subscription.id,
      },
    );
  }

  async handleUpdateSubscriptionStatus(
    subscriptionId: string,
    priceId: string,
  ) {
    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);
    const subscriptionItemId = subscription.items.data[0].id;
    const updatedSubscription = await this.stripe.subscriptions.update(
      subscriptionId,
      {
        items: [
          {
            id: subscriptionItemId,
            price: priceId,
          },
        ],
        proration_behavior: 'create_prorations',
      },
    );

    return new ApiResponse(
      true,
      'Subscription updated successfully.',
      HttpStatus.OK,
      {
        subscriptionId: updatedSubscription.id,
        status: updatedSubscription.status,
        plan: updatedSubscription.items.data[0].price.nickname,
        price:
          Number(updatedSubscription.items.data[0]?.price.unit_amount) / 100,
        currency: updatedSubscription.items.data[0].price.currency,
      },
    );
  }

  async handleDeleteSubscription(subscriptionId: string) {
    // const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
    return new ApiResponse(
      true,
      'Subscription deleted successfully.',
      HttpStatus.OK,
      {
        subscriptionId: subscription.id,
        status: subscription.status,
        plan: subscription.items.data[0].price.nickname,
        price: Number(subscription.items.data[0]?.price.unit_amount) / 100,
        currency: subscription.items.data[0].price.currency,
      },
    );
  }

  async getUserSubscriptions(customerId: string) {
    const subscriptions : any = await this.stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      expand: ['data.default_payment_method', 'data.items.data.price'],
    });

    const subscriptionsData = subscriptions.data.map((subscription) => {
      return {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.items.data[0]?.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.items.data[0]?.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        priceId: subscription.items.data[0].price.id,
        amount: Number(subscription.items.data[0].price.unit_amount) / 100,
        currency: subscription.items.data[0].price.currency,
        interval: subscription.items.data[0].price.recurring.interval,
        intervalCount:
          subscription.items.data[0].price.recurring.interval_count,
        productId: subscription.items.data[0].price.product,
        latestInvoiceId: subscription.latest_invoice,
      };
    });

    return new ApiResponse(
      true,
      'Subscriptions data fetched successfully.',
      HttpStatus.OK,
      subscriptionsData,
    );
  }
}
