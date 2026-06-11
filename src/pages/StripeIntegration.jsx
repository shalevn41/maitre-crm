import React from 'react';
import {
  CreditCard,
  AlertCircle,
  Code,
  ExternalLink,
  Zap,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/ui/PageHeader';

export default function StripeIntegration() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Stripe Integration" 
        subtitle="Set up payment processing for your platform"
      />

      {/* Alert Banner */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">Backend Functions Required</h3>
              <p className="text-sm text-amber-800 mb-3">
                Stripe integration requires backend functions to be enabled in your Base44 app. 
                Backend functions allow you to securely process payments, create subscriptions, 
                and handle webhooks.
              </p>
              <Button variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-100">
                <Zap className="w-4 h-4 mr-2" />
                Enable Backend Functions
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What You'll Be Able to Do */}
      <Card className="border-gray-100">
        <CardHeader>
          <CardTitle>What Stripe Integration Enables</CardTitle>
          <CardDescription>
            Once backend functions are enabled, you'll be able to implement these features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Accept monthly subscriptions (₪499/month)",
              "Automatic payment collection",
              "Subscription status management",
              "Customer portal for billing",
              "Invoice generation",
              "Payment method updates",
              "Webhook handling for events",
              "Subscription cancellations",
              "Trial period management",
              "Revenue reporting"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Implementation Steps */}
      <Card className="border-gray-100">
        <CardHeader>
          <CardTitle>Implementation Steps</CardTitle>
          <CardDescription>
            How to set up Stripe once backend functions are enabled
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            {
              step: "1",
              title: "Enable Backend Functions",
              description: "Go to your Base44 app settings and enable backend functions. This unlocks the ability to create server-side logic."
            },
            {
              step: "2",
              title: "Get Stripe API Keys",
              description: "Sign up at stripe.com and get your API keys (Publishable Key and Secret Key). You'll also need to set up a webhook endpoint."
            },
            {
              step: "3",
              title: "Create Backend Functions",
              description: "Create backend functions for: creating customers, creating subscriptions, handling webhooks, and generating customer portal sessions."
            },
            {
              step: "4",
              title: "Update Frontend",
              description: "Connect your frontend pages (Billing, Checkout) to call the backend functions. Use Stripe.js for the checkout flow."
            },
            {
              step: "5",
              title: "Configure Webhooks",
              description: "Set up Stripe webhooks to listen for events like payment success, subscription canceled, etc."
            },
            {
              step: "6",
              title: "Test & Deploy",
              description: "Test with Stripe's test mode first, then switch to live mode when ready."
            }
          ].map((item, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#C5A059] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">{item.step}</span>
              </div>
              <div>
                <h3 className="font-medium text-[#0F172A] mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Code Example */}
      <Card className="border-gray-100">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-[#C5A059]" />
            <CardTitle>Example Backend Function</CardTitle>
          </div>
          <CardDescription>
            Here's what a subscription creation function would look like
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-[#0F172A] text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`// functions/createSubscription.js

import Stripe from 'stripe';

export default async function createSubscription(context) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  
  const { restaurantId, email, priceId } = context.body;
  
  // Create or retrieve customer
  const customer = await stripe.customers.create({
    email: email,
    metadata: { restaurantId }
  });
  
  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }],
    trial_period_days: 14,
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent']
  });
  
  // Update restaurant record
  await context.base44.entities.Restaurant.update(restaurantId, {
    stripe_customer_id: customer.id,
    stripe_subscription_id: subscription.id,
    subscription_status: 'trial'
  });
  
  return {
    subscriptionId: subscription.id,
    clientSecret: subscription.latest_invoice.payment_intent.client_secret
  };
}`}
          </pre>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card className="border-gray-100">
        <CardHeader>
          <CardTitle>Helpful Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <a
              href="https://stripe.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-[#C5A059] hover:bg-[#C5A059]/5 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-[#0F172A]">Stripe Documentation</p>
                  <p className="text-sm text-gray-500">Complete guide to Stripe API</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>

            <a
              href="https://stripe.com/docs/billing/subscriptions/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-[#C5A059] hover:bg-[#C5A059]/5 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-[#0F172A]">Subscriptions Guide</p>
                  <p className="text-sm text-gray-500">How to implement recurring billing</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>

            <a
              href="https://stripe.com/docs/webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-[#C5A059] hover:bg-[#C5A059]/5 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-[#0F172A]">Webhooks Guide</p>
                  <p className="text-sm text-gray-500">Listen to Stripe events</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-[#C5A059] bg-gradient-to-br from-[#C5A059]/5 to-transparent">
        <CardContent className="p-6">
          <h3 className="font-semibold text-[#0F172A] mb-2 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#C5A059]" />
            Ready to Get Started?
          </h3>
          <p className="text-gray-600 mb-4">
            Contact the Base44 team to enable backend functions for your app, then follow the implementation steps above.
          </p>
          <Button className="bg-[#C5A059] hover:bg-[#B8934D] text-white">
            <Zap className="w-4 h-4 mr-2" />
            Request Backend Functions Access
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}