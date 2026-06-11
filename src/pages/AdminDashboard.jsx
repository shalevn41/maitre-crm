import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Ban
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import { format, subDays, isAfter } from 'date-fns';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    fetchUser();
  }, []);

  const { data: restaurants = [], isLoading: restaurantsLoading } = useQuery({
    queryKey: ['all-restaurants'],
    queryFn: () => base44.entities.Restaurant.list('-created_date'),
  });

  const { data: allCustomers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['all-customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const { data: allMessages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['all-messages'],
    queryFn: () => base44.entities.Message.list('-created_date', 50),
  });

  const isLoading = restaurantsLoading || customersLoading || messagesLoading;

  // Calculate stats
  const totalRestaurants = restaurants.length;
  const activeRestaurants = restaurants.filter(r => r.subscription_status === 'active').length;
  const totalCustomers = allCustomers.length;
  const newRestaurantsThisWeek = restaurants.filter(r => 
    isAfter(new Date(r.created_date), subDays(new Date(), 7))
  ).length;
  
  // Simulated revenue (499 ILS per active subscription)
  const monthlyRevenue = activeRestaurants * 499;

  const getStatusBadge = (status) => {
    const styles = {
      active: { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
      trial: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
      past_due: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertCircle },
      canceled: { color: 'bg-red-50 text-red-700 border-red-200', icon: Ban },
    };
    const config = styles[status] || styles.trial;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Admin Dashboard"
        subtitle="Platform overview and management"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="p-6 border-gray-100">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Total Restaurants"
              value={totalRestaurants.toLocaleString()}
              subtitle={`+${newRestaurantsThisWeek} this week`}
              icon={Building2}
            />
            <StatCard
              title="Active Subscriptions"
              value={activeRestaurants.toLocaleString()}
              subtitle={`${Math.round((activeRestaurants / totalRestaurants) * 100) || 0}% of total`}
              icon={CheckCircle2}
            />
            <StatCard
              title="Total Customers"
              value={totalCustomers.toLocaleString()}
              subtitle="Across all restaurants"
              icon={Users}
            />
            <StatCard
              title="Monthly Revenue"
              value={`₪${monthlyRevenue.toLocaleString()}`}
              subtitle="From active subscriptions"
              icon={DollarSign}
            />
          </>
        )}
      </div>

      {/* Recent Restaurants & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Restaurants */}
        <Card className="border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Recent Restaurants</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-[#C5A059]">
              <Link to={createPageUrl('AdminRestaurants')}>
                View All
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {restaurantsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
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
            ) : restaurants.length === 0 ? (
              <div className="py-8 text-center">
                <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-sm text-gray-500">No restaurants yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {restaurants.slice(0, 5).map((restaurant) => (
                  <div key={restaurant.id} className="flex items-center gap-3 py-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F5F7FA] flex items-center justify-center flex-shrink-0">
                      {restaurant.logo_url ? (
                        <img src={restaurant.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <Building2 className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">
                        {restaurant.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {restaurant.owner_email}
                      </p>
                    </div>
                    {getStatusBadge(restaurant.subscription_status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Distribution */}
        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Subscription Status</CardTitle>
          </CardHeader>
          <CardContent>
            {restaurantsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { status: 'active', label: 'Active', color: 'bg-green-500' },
                  { status: 'trial', label: 'Trial', color: 'bg-blue-500' },
                  { status: 'past_due', label: 'Past Due', color: 'bg-amber-500' },
                  { status: 'canceled', label: 'Canceled', color: 'bg-red-500' },
                ].map(({ status, label, color }) => {
                  const count = restaurants.filter(r => r.subscription_status === status).length;
                  const percentage = totalRestaurants > 0 ? (count / totalRestaurants) * 100 : 0;
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">{label}</span>
                        <span className="text-sm font-medium text-[#0F172A]">{count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${color} rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Recent Campaigns (All Restaurants)</CardTitle>
        </CardHeader>
        <CardContent>
          {messagesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 py-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : allMessages.length === 0 ? (
            <div className="py-8 text-center">
              <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm text-gray-500">No campaigns sent yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {allMessages.slice(0, 10).map((message) => {
                const restaurant = restaurants.find(r => r.id === message.restaurant_id);
                return (
                  <div key={message.id} className="flex items-center gap-4 py-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F5F7FA] flex items-center justify-center">
                      {restaurant?.logo_url ? (
                        <img src={restaurant.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <Building2 className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">
                        {message.name || 'Untitled Campaign'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {restaurant?.name || 'Unknown'} • {message.recipient_count || 0} recipients • {message.channel}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant="outline" 
                        className={
                          message.status === 'sent' ? 'bg-green-50 text-green-700' :
                          message.status === 'scheduled' ? 'bg-blue-50 text-blue-700' :
                          'bg-gray-50 text-gray-700'
                        }
                      >
                        {message.status}
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(message.created_date), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}