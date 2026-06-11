import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Users,
  MessageSquare,
  TrendingUp,
  Calendar,
  Plus,
  ArrowRight,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import AICampaignSuggestions from '@/components/campaigns/AICampaignSuggestions';
import { format, subDays, isAfter } from 'date-fns';

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
        // If not authenticated, redirect to login
        window.location.href = createPageUrl('Landing');
      }
    };
    fetchUser();
  }, []);

  const { data: restaurant, isLoading: restaurantLoading } = useQuery({
    queryKey: ['my-restaurant', user?.restaurant_id],
    queryFn: async () => {
      if (!user?.restaurant_id) return null;
      const restaurants = await base44.entities.Restaurant.filter({ id: user.restaurant_id });
      return restaurants[0] || null;
    },
    enabled: !!user?.restaurant_id,
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers', user?.restaurant_id],
    queryFn: async () => {
      if (!user?.restaurant_id) return [];
      return base44.entities.Customer.filter({ restaurant_id: user.restaurant_id });
    },
    enabled: !!user?.restaurant_id,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', user?.restaurant_id],
    queryFn: async () => {
      if (!user?.restaurant_id) return [];
      return base44.entities.Message.filter({ restaurant_id: user.restaurant_id }, '-created_date', 10);
    },
    enabled: !!user?.restaurant_id,
  });

  const { data: waiters = [] } = useQuery({
    queryKey: ['waiters', user?.restaurant_id],
    queryFn: async () => {
      if (!user?.restaurant_id) return [];
      return base44.entities.Waiter.filter({ restaurant_id: user.restaurant_id }, '-signup_count', 3);
    },
    enabled: !!user?.restaurant_id,
  });

  const isLoading = restaurantLoading || customersLoading || messagesLoading;

  // Calculate stats
  const totalCustomers = customers.length;
  const newCustomersThisMonth = customers.filter(c => 
    isAfter(new Date(c.created_date), subDays(new Date(), 30))
  ).length;
  const avgCheckAmount = restaurant?.avg_check_amount || 150;
  const estimatedRevenue = totalCustomers * avgCheckAmount;
  const sentMessages = messages.filter(m => m.status === 'sent').length;
  const scheduledMessages = messages.filter(m => m.status === 'scheduled').length;

  const getStatusBadge = (status) => {
    const styles = {
      sent: 'bg-green-50 text-green-700 border-green-200',
      scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
      draft: 'bg-gray-50 text-gray-700 border-gray-200',
      failed: 'bg-red-50 text-red-700 border-red-200',
      sending: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    return styles[status] || styles.draft;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <CheckCircle2 className="w-3 h-3" />;
      case 'scheduled': return <Clock className="w-3 h-3" />;
      case 'failed': return <AlertCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  const getChannelLabel = (channel) => {
    return { sms: 'SMS', whatsapp: 'WhatsApp', email: 'Email' }[channel] || channel;
  };

  // Show loading state while user is being fetched
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  // If user exists but no restaurant, show setup prompt
  if (!user.restaurant_id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4" dir="rtl">
        <div className="w-20 h-20 rounded-2xl bg-[#F5F7FA] flex items-center justify-center mb-6">
          <svg viewBox="0 0 40 40" className="w-12 h-12">
            <path d="M8 32 L20 8 L32 32" fill="none" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 20 L20 32 L26 20" fill="none" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-[#0F172A] mb-2">ברוכים הבאים ל-MAITRE</h2>
        <p className="text-gray-500 mb-6 max-w-md">
          המסעדה שלך עדיין לא הוגדרה. אנא השלם את תהליך ההקמה.
        </p>
        <Button asChild className="bg-[#C5A059] hover:bg-[#B8934D] text-white">
          <Link to={createPageUrl('Register')}>
            השלם הגדרה
            <ArrowRight className="w-4 h-4 mr-2" />
          </Link>
        </Button>
      </div>
    );
  }

  const needsPayment = restaurant && ['trial', 'past_due', 'canceled'].includes(restaurant.subscription_status);

  return (
    <div className="space-y-6" dir="rtl">
      {needsPayment && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-medium text-red-900 mb-1">נדרש תשלום להפעלת המערכת</p>
                <p className="text-sm text-red-700">
                  {restaurant.subscription_status === 'trial' 
                    ? 'עליך להשלים את תהליך התשלום כדי להתחיל להשתמש במערכת באופן מלא.'
                    : 'המנוי שלך אינו פעיל. אנא עדכן את פרטי התשלום כדי להמשיך.'
                  }
                </p>
              </div>
              <Link to={createPageUrl('Billing')}>
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  עבור לתשלום
                  <ArrowRight className="w-4 h-4 mr-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
      
      <PageHeader 
        title={`ברוך שובך${restaurant?.name ? `, ${restaurant.name}` : ''}`}
        subtitle="סטטיסטיקות והתקדמות העסק שלך"
        actions={
          <Button asChild className="bg-[#C5A059] hover:bg-[#B8934D] text-white">
            <Link to={createPageUrl('Campaigns') + '?new=true'}>
              <Plus className="w-4 h-4 ml-2" />
              קמפיין חדש
            </Link>
          </Button>
        }
      />

      {/* ROI Stats Grid - Top Priority */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card className="border-[#C5A059]/30 bg-gradient-to-br from-amber-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">הכנסה משוערת מהמערכת</p>
                    <p className="text-3xl font-bold text-[#C5A059]">₪{estimatedRevenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {totalCustomers} לקוחות × ₪{avgCheckAmount} ממוצע
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[#C5A059]/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-[#C5A059]" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <StatCard
              title="לקוחות חדשים החודש"
              value={newCustomersThisMonth.toLocaleString()}
              subtitle={`מתוך ${totalCustomers} סה"כ`}
              icon={Users}
            />
            
            <StatCard
              title="סך הלקוחות במאגר"
              value={totalCustomers.toLocaleString()}
              subtitle="בסיס הנתונים שלך"
              icon={TrendingUp}
            />
          </>
        )}
      </div>

      {/* AI Campaign Suggestions */}
      {/* Quick Actions */}
      <Card className="border-gray-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">פעולות מהירות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link 
              to={createPageUrl('Campaigns') + '?new=true'}
              className="flex items-center gap-3 p-4 rounded-xl bg-[#F5F7FA] hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <Plus className="w-5 h-5 text-[#C5A059]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#0F172A]">קמפיין חדש</p>
                <p className="text-xs text-gray-500">שלח הודעה</p>
              </div>
            </Link>
            <Link 
              to={createPageUrl('Customers') + '?add=true'}
              className="flex items-center gap-3 p-4 rounded-xl bg-[#F5F7FA] hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <Users className="w-5 h-5 text-[#C5A059]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#0F172A]">הוסף לקוח</p>
                <p className="text-xs text-gray-500">הוספה ידנית</p>
              </div>
            </Link>
            <Link 
              to={createPageUrl('Waiters')}
              className="flex items-center gap-3 p-4 rounded-xl bg-[#F5F7FA] hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <Award className="w-5 h-5 text-[#C5A059]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#0F172A]">מלצרים</p>
                <p className="text-xs text-gray-500">ניהול צוות</p>
              </div>
            </Link>
            <Link 
              to={createPageUrl('Automations')}
              className="flex items-center gap-3 p-4 rounded-xl bg-[#F5F7FA] hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <TrendingUp className="w-5 h-5 text-[#C5A059]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#0F172A]">אוטומציות</p>
                <p className="text-xs text-gray-500">מאיץ רווחים</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      <AICampaignSuggestions 
        restaurantId={user?.restaurant_id}
        restaurantName={restaurant?.name}
      />

      {/* Waiter Leaderboard */}
      {waiters.length > 0 && (
        <Card className="border-[#C5A059]/30 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#C5A059]" />
                <CardTitle>לוח המצטיינים - מלצרים</CardTitle>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-[#C5A059]">
                <Link to={createPageUrl('Waiters')}>
                  צפה בהכל
                  <ArrowRight className="w-3 h-3 mr-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {waiters.map((waiter, index) => (
                <div key={waiter.id} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[#0F172A]">{waiter.name}</p>
                    <p className="text-sm text-gray-500">{waiter.signup_count} הרשמות</p>
                  </div>
                  {index === 0 && <Award className="w-5 h-5 text-yellow-500" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="הודעות נשלחו"
          value={sentMessages.toLocaleString()}
          subtitle="כל הזמנים"
          icon={Send}
        />
        <StatCard
          title="מתוזמנות"
          value={scheduledMessages.toLocaleString()}
          subtitle="קמפיינים עתידיים"
          icon={Calendar}
        />
        <StatCard
          title="מנוי"
          value={restaurant?.subscription_status === 'active' ? 'פעיל' : 'לא פעיל'}
          subtitle={restaurant?.subscription_status === 'active' ? 'כל התכונות זמינות' : 'גישה מוגבלת'}
          icon={TrendingUp}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Campaigns */}
        <Card className="border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">קמפיינים אחרונים</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-[#C5A059]">
              <Link to={createPageUrl('Campaigns')}>
                צפה בהכל
                <ArrowRight className="w-3 h-3 mr-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {messagesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="py-8 text-center">
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-sm text-gray-500">אין קמפיינים עדיין</p>
                <Button asChild variant="link" className="text-[#C5A059] mt-1">
                  <Link to={createPageUrl('Campaigns') + '?new=true'}>צור את הקמפיין הראשון</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {messages.slice(0, 5).map((message) => (
                  <div key={message.id} className="flex items-center gap-3 py-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F5F7FA] flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-[#C5A059]" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">
                        {message.name || 'Untitled Campaign'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getChannelLabel(message.channel)} • {message.recipient_count || 0} recipients
                      </p>
                    </div>
                    <Badge variant="outline" className={getStatusBadge(message.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(message.status)}
                        {message.status}
                      </span>
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Customers */}
        <Card className="border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">לקוחות אחרונים</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-[#C5A059]">
              <Link to={createPageUrl('Customers')}>
                צפה בהכל
                <ArrowRight className="w-3 h-3 mr-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {customersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : customers.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-sm text-gray-500">אין לקוחות עדיין</p>
                <Button asChild variant="link" className="text-[#C5A059] mt-1">
                  <Link to={createPageUrl('Customers')}>הוסף את הלקוח הראשון</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {customers.slice(0, 5).map((customer) => (
                  <div key={customer.id} className="flex items-center gap-3 py-3">
                    <div className="w-10 h-10 rounded-full bg-[#C5A059] flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {customer.full_name?.[0]?.toUpperCase() || 'C'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">
                        {customer.full_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {customer.email || customer.phone || 'No contact info'}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">
                      {format(new Date(customer.created_date), 'MMM d')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      </div>
      );
      }