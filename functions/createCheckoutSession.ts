import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get subscription settings
    const settings = await base44.entities.SubscriptionSettings.list();
    if (!settings.length || !settings[0].stripe_price_id) {
      return Response.json({ error: 'Subscription not configured' }, { status: 400 });
    }

    const subscriptionSettings = settings[0];

    // Get or create user subscription record
    let userSub = await base44.entities.UserSubscription.filter({ 
      user_email: user.email 
    });
    
    let customerId = userSub[0]?.stripe_customer_id;

    // Create Stripe customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_email: user.email }
      });
      customerId = customer.id;

      if (userSub.length > 0) {
        await base44.asServiceRole.entities.UserSubscription.update(userSub[0].id, {
          stripe_customer_id: customerId
        });
      } else {
        await base44.asServiceRole.entities.UserSubscription.create({
          user_email: user.email,
          stripe_customer_id: customerId,
          status: 'trial'
        });
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: subscriptionSettings.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/subscribe`,
      metadata: {
        user_email: user.email
      }
    });

    return Response.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});