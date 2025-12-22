import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  let event;

  try {
    const body = await req.text();
    
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return Response.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userEmail = session.metadata.user_email;

        // Update subscription status
        const userSubs = await base44.asServiceRole.entities.UserSubscription.filter({
          user_email: userEmail
        });

        if (userSubs.length > 0) {
          await base44.asServiceRole.entities.UserSubscription.update(userSubs[0].id, {
            stripe_subscription_id: session.subscription,
            status: 'active'
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer);

        if (customer.email) {
          const userSubs = await base44.asServiceRole.entities.UserSubscription.filter({
            stripe_customer_id: subscription.customer
          });

          if (userSubs.length > 0) {
            await base44.asServiceRole.entities.UserSubscription.update(userSubs[0].id, {
              status: subscription.status === 'active' ? 'active' : 
                     subscription.status === 'past_due' ? 'past_due' : 
                     subscription.status === 'canceled' ? 'canceled' : 'expired',
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        const userSubs = await base44.asServiceRole.entities.UserSubscription.filter({
          stripe_subscription_id: subscription.id
        });

        if (userSubs.length > 0) {
          await base44.asServiceRole.entities.UserSubscription.update(userSubs[0].id, {
            status: 'canceled'
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        
        const userSubs = await base44.asServiceRole.entities.UserSubscription.filter({
          stripe_subscription_id: subscription.id
        });

        if (userSubs.length > 0) {
          await base44.asServiceRole.entities.UserSubscription.update(userSubs[0].id, {
            status: 'past_due'
          });
        }
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});