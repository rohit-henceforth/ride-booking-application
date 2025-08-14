import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Request } from 'express';
import { RideService } from 'src/modules/ride/ride.service';
import { InjectModel } from '@nestjs/mongoose';
import { Payment, PaymentDocument } from '../schema/payment.schema';
import { Model } from 'mongoose';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => RideService)) private rideService: RideService,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY')!);
  }

  async createCheckoutSession(rideId: string, amount: number, madeFor: string) {
    const session = await this.stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: 'Ride',
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      submit_type: 'pay',
      mode: 'payment',
      success_url: 'http://localhost:3000/stripe/success',
      cancel_url: 'http://localhost:3000/stripe/cancel',
      metadata: {
        for: madeFor,
        rideId: rideId,
      },
    });
    return session;
  }

  async handleWebhook(request: Request) {
    try {
      const sign = request.headers['stripe-signature'];

      if (!sign) {
        throw new UnauthorizedException('Signature is missing');
      }

      const event = this.stripe.webhooks.constructEvent(
        request.body,
        sign,
        this.configService.get('STRIPE_WEBHOOK_ENDPOINT_SECRET')!,
      );

      switch (event.type) {
        case 'checkout.session.completed':
          this.handlePaymentSuccess(
            event.data.object as Stripe.Checkout.Session,
          );
          break;
        case 'checkout.session.async_payment_failed':
          console.log('Payment failed!', event.data.object);
          break;
        case 'charge.refunded':
          this.handlePaymentRefund(event.data.object as Stripe.Charge);
          break;
      }

      return {
        received: true,
      };
    } catch (error) {
      console.log(error);
    }
  }

  async handlePaymentSuccess(session: Stripe.Checkout.Session) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        session.payment_intent as string,
      );

      if (!paymentIntent) {
        return;
      }

      if (paymentIntent.status !== 'succeeded') {
        return;
      }

      if (!session.metadata) {
        return;
      }

      const newPayment = new this.paymentModel({
        paymentSessionId: session.id,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'paid' : 'refunded',
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method,
      });

      if (session.metadata?.for !== 'book-ride') {
        return;
      }

      if (!session.metadata?.rideId) {
        return;
      }

      this.rideService.createRide(session.metadata?.rideId, newPayment);
    } catch (error) {
      console.log(error);
    }
  }

  async handlePaymentRefund(session: Stripe.Charge) {
    try {
      const refundInfo = await this.stripe.charges.retrieve(session.id, {
        expand: ['refunds'],
      });

      await this.paymentModel.findOneAndUpdate(
        {
          paymentIntentId: session.payment_intent,
        },
        {
          $set: {
            status: 'refunded',
            refundId: refundInfo.refunds?.data[0].id,
          },
        },
      );
    } catch (error) {
      console.log(error);
    }
  }

  async handleRefund(paymentIntentId: string) {
    await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
    });
  }

  async handleCreateConnectAccount(email: string) {
    const account = await this.stripe.accounts.create({
      type: 'express',
      country: 'AU',
      business_type: 'individual',
      email,
      capabilities: {
        transfers: { requested: true },
      },
    });
    return account.id;
  }

  async getOnboardingLink(accountId: string) {
    const accountLink = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: 'http://localhost:3000/stripe/cancel',
      return_url: 'http://localhost:3000/stripe/success',
      type: 'account_onboarding',
    });
    return accountLink.url;
  }

  async getStripeAccount(accountId: string) {
    const account = await this.stripe.accounts.retrieve(accountId);
    return account;
  }

  async handleCreateTransfer(amount: number, accountId: string) {
    await this.stripe.transfers.create({
      amount: amount * 100,
      currency: 'aud',
      destination: accountId,
    });
  }

  async handleCreatePayout(amount: number, accountId: string) {
    await this.stripe.payouts.create(
      {
        amount: Math.round(amount * 100),
        currency: 'aud',
      },
      {
        stripeAccount: accountId,
      },
    );
  }
}
