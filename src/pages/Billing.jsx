import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Receipt,
  Calendar,
  DollarSign,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/ui/PageHeader';
import { format, addMonths } from 'date-fns';

export default function Billing() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    fetchUser();
  }, []);

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['my-restaurant', user?.restaurant_id],
    queryFn: async () => {
      if (!user?.restaurant_id) return null;
      const restaurants = await base44.entities.Restaurant.filter({ id: user.restaurant_id });
      return restaurants[0] || null;
    },
    enabled: !!user?.restaurant_id,
  });

  const getStatusConfig = (status) => {
    const configs = {
      active: {
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: CheckCircle2,
        label: 'Active',
        description: 'Your subscription is active and all features are unlocked.'
      },
      trial: {
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Clock,
        label: 'Trial',
        description: 'You are currently on a free trial. Subscribe to continue after the trial ends.'
      },
      past_due: {
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: AlertCircle,
        label: 'Past Due',
        description: 'Your payment is past due. Please update your payment method.'
      },
      canceled: {
        color: 'bg-red-50 text-red-700 border-red-200',
        icon: AlertCircle,
        label: 'Canceled',
        description: 'Your subscription has been canceled. Subscribe to regain access.'
      },
    };
    return configs[status] || configs.trial;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Billing" subtitle="Manage your subscription" />
        <Card className="border-gray-100">
          <CardContent className="p-6">
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-4 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = getStatusConfig(restaurant?.subscription_status);
  const StatusIcon = statusConfig.icon;
  const isActive = restaurant?.subscription_status === 'active';
  const nextBillingDate = isActive ? addMonths(new Date(), 1) : null;

  const isTrialOrInactive = ['trial', 'past_due', 'canceled'].includes(restaurant?.subscription_status);

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader 
        title="חיובים ומנוי" 
        subtitle="נהל את המנוי ופרטי התשלום שלך"
      />

      {/* Payment Required Alert */}
      {isTrialOrInactive && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-2">נדרש להשלים את התשלום</h3>
                <p className="text-sm text-amber-700 mb-4">
                  כדי להתחיל להשתמש במערכת, עליך להשלים את תהליך התשלום ולהפעיל את המנוי שלך.
                  המנוי כולל גישה מלאה לכל התכונות של המערכת.
                </p>
                <Button className="bg-[#C5A059] hover:bg-[#B8934D] text-white">
                  <CreditCard className="w-4 h-4 ml-2" />
                  הוסף אמצעי תשלום והפעל מנוי
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Plan */}
      <Card className="border-gray-100">
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your subscription status and details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-2xl font-semibold text-[#0F172A]">MAITRE Pro</h3>
                <Badge variant="outline" className={statusConfig.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-gray-500">{statusConfig.description}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#0F172A]">₪499</p>
              <p className="text-sm text-gray-500">per month</p>
            </div>
          </div>

          {isActive && (
            <div className="bg-[#F5F7FA] rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Next billing date</p>
                  <p className="font-medium text-[#0F172A]">
                    {format(nextBillingDate, 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {isActive ? (
              <>
                <Button variant="outline">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Update Payment Method
                </Button>
                <Button variant="outline" className="text-red-600 hover:text-red-700">
                  Cancel Subscription
                </Button>
              </>
            ) : (
              <Button className="bg-[#C5A059] hover:bg-[#B8934D] text-white">
                <CreditCard className="w-4 h-4 mr-2" />
                Subscribe Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card className="border-gray-100">
        <CardHeader>
          <CardTitle>What's Included</CardTitle>
          <CardDescription>All features included in your plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Unlimited customers',
              'SMS campaigns',
              'WhatsApp campaigns',
              'Email campaigns',
              'Message templates',
              'Customer sign-up page',
              'QR code generation',
              'Campaign scheduling',
              'Analytics dashboard',
              'Priority support',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card className="border-gray-100">
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Your saved payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          {isActive ? (
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-[#0F172A]">•••• •••• •••• 4242</p>
                  <p className="text-sm text-gray-500">Expires 12/25</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Default
              </Badge>
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-gray-500 mb-4">No payment method on file</p>
              <Button className="bg-[#C5A059] hover:bg-[#B8934D] text-white">
                Add Payment Method
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card className="border-gray-100">
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View past invoices and receipts</CardDescription>
        </CardHeader>
        <CardContent>
          {isActive ? (
            <div className="divide-y divide-gray-100">
              {[
                { date: '2024-01-01', amount: 499, status: 'paid' },
                { date: '2023-12-01', amount: 499, status: 'paid' },
                { date: '2023-11-01', amount: 499, status: 'paid' },
              ].map((invoice, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Receipt className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">
                        MAITRE Pro - Monthly
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(invoice.date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-[#0F172A]">₪{invoice.amount}</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Paid
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-gray-500">No billing history yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Note */}
      <div className="bg-[#F5F7FA] rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-[#0F172A]">Secure Payments</p>
          <p className="text-sm text-gray-500">
            All payment information is encrypted and securely processed through Stripe. 
            We never store your full card details on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}