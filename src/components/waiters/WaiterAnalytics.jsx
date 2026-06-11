import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Star,
  Award,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

const COLORS = ['#C5A059', '#0F172A', '#64748b', '#94a3b8'];

export default function WaiterAnalytics({ waiter, customers = [], feedbacks = [] }) {
  const [dateRange, setDateRange] = useState({
    from: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });

  // Filter data by date range
  const filteredCustomers = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return customers;
    return customers.filter(c => {
      const customerDate = parseISO(c.created_date);
      return isWithinInterval(customerDate, {
        start: parseISO(dateRange.from),
        end: parseISO(dateRange.to)
      });
    });
  }, [customers, dateRange]);

  const filteredFeedbacks = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return feedbacks;
    return feedbacks.filter(f => {
      const feedbackDate = parseISO(f.created_date);
      return isWithinInterval(feedbackDate, {
        start: parseISO(dateRange.from),
        end: parseISO(dateRange.to)
      });
    });
  }, [feedbacks, dateRange]);

  // Calculate weekly performance
  const weeklyData = useMemo(() => {
    const weeks = {};
    filteredCustomers.forEach(customer => {
      const date = parseISO(customer.created_date);
      const weekStart = format(startOfWeek(date, { locale: he }), 'dd/MM');
      if (!weeks[weekStart]) {
        weeks[weekStart] = 0;
      }
      weeks[weekStart]++;
    });
    return Object.entries(weeks).map(([week, count]) => ({
      week,
      signups: count
    }));
  }, [filteredCustomers]);

  // Calculate monthly performance
  const monthlyData = useMemo(() => {
    const months = {};
    filteredCustomers.forEach(customer => {
      const date = parseISO(customer.created_date);
      const month = format(date, 'MMM yyyy', { locale: he });
      if (!months[month]) {
        months[month] = 0;
      }
      months[month]++;
    });
    return Object.entries(months).map(([month, count]) => ({
      month,
      signups: count
    }));
  }, [filteredCustomers]);

  // Calculate daily signups for trend chart
  const dailySignups = useMemo(() => {
    const days = {};
    filteredCustomers.forEach(customer => {
      const date = format(parseISO(customer.created_date), 'dd/MM');
      days[date] = (days[date] || 0) + 1;
    });
    return Object.entries(days).map(([date, count]) => ({
      date,
      signups: count
    })).slice(-30); // Last 30 days
  }, [filteredCustomers]);

  // Calculate feedback stats
  const feedbackStats = useMemo(() => {
    if (filteredFeedbacks.length === 0) return null;
    const avgRating = filteredFeedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / filteredFeedbacks.length;
    const positive = filteredFeedbacks.filter(f => f.is_positive).length;
    const negative = filteredFeedbacks.length - positive;
    return {
      avgRating: avgRating.toFixed(1),
      total: filteredFeedbacks.length,
      positive,
      negative,
      distribution: [
        { name: 'חיובי', value: positive },
        { name: 'שלילי', value: negative }
      ]
    };
  }, [filteredFeedbacks]);

  // Calculate performance metrics
  const metrics = useMemo(() => {
    const total = filteredCustomers.length;
    const thisMonth = filteredCustomers.filter(c => {
      const date = parseISO(c.created_date);
      return isWithinInterval(date, {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
      });
    }).length;
    const lastMonth = filteredCustomers.filter(c => {
      const date = parseISO(c.created_date);
      return isWithinInterval(date, {
        start: startOfMonth(subMonths(new Date(), 1)),
        end: endOfMonth(subMonths(new Date(), 1))
      });
    }).length;
    const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100) : 0;

    return {
      total,
      thisMonth,
      lastMonth,
      growth: growth.toFixed(1),
      avgPerWeek: (total / (weeklyData.length || 1)).toFixed(1)
    };
  }, [filteredCustomers, weeklyData]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Date Range Filter */}
      <Card className="border-gray-100">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="from">מתאריך</Label>
              <Input
                id="from"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="to">עד תאריך</Label>
              <Input
                id="to"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="mt-1"
              />
            </div>
            <Button
              onClick={() => setDateRange({
                from: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
                to: format(new Date(), 'yyyy-MM-dd')
              })}
              variant="outline"
            >
              <Calendar className="w-4 h-4 ml-2" />
              3 חודשים אחרונים
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">סה"כ הרשמות</p>
                <p className="text-2xl font-bold text-[#0F172A]">{metrics.total}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">החודש</p>
                <p className="text-2xl font-bold text-[#0F172A]">{metrics.thisMonth}</p>
                <div className="flex items-center gap-1 mt-1">
                  {metrics.growth >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-xs ${metrics.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(metrics.growth)}% מהחודש הקודם
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">ממוצע שבועי</p>
                <p className="text-2xl font-bold text-[#0F172A]">{metrics.avgPerWeek}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#C5A059]/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-[#C5A059]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {feedbackStats && (
          <Card className="border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">דירוג ממוצע</p>
                  <p className="text-2xl font-bold text-[#0F172A]">{feedbackStats.avgRating}</p>
                  <p className="text-xs text-gray-500 mt-1">{feedbackStats.total} פידבקים</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Star className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Signups Trend */}
        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle>מגמת הרשמות יומית (30 יום אחרונים)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailySignups}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    direction: 'rtl'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="signups" 
                  stroke="#C5A059" 
                  strokeWidth={2}
                  dot={{ fill: '#C5A059', r: 4 }}
                  name="הרשמות"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Performance */}
        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle>ביצועים חודשיים</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    direction: 'rtl'
                  }}
                />
                <Bar dataKey="signups" fill="#C5A059" radius={[8, 8, 0, 0]} name="הרשמות" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Performance */}
        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle>ביצועים שבועיים</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    direction: 'rtl'
                  }}
                />
                <Bar dataKey="signups" fill="#0F172A" radius={[8, 8, 0, 0]} name="הרשמות" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Feedback Distribution */}
        {feedbackStats && (
          <Card className="border-gray-100">
            <CardHeader>
              <CardTitle>התפלגות פידבקים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={feedbackStats.distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {feedbackStats.distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#22c55e' : '#ef4444'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        direction: 'rtl'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{feedbackStats.positive}</p>
                  <p className="text-xs text-gray-500">פידבקים חיוביים</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{feedbackStats.negative}</p>
                  <p className="text-xs text-gray-500">פידבקים שליליים</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Performance Summary */}
      <Card className="border-gray-100 bg-gradient-to-br from-[#C5A059]/5 to-white">
        <CardHeader>
          <CardTitle>סיכום ביצועים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-2">החודש הנוכחי</p>
              <p className="text-3xl font-bold text-[#0F172A] mb-1">{metrics.thisMonth}</p>
              <p className="text-sm text-gray-600">הרשמות חדשות</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">החודש הקודם</p>
              <p className="text-3xl font-bold text-[#0F172A] mb-1">{metrics.lastMonth}</p>
              <p className="text-sm text-gray-600">הרשמות</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">שיפור</p>
              <div className="flex items-center gap-2">
                <p className={`text-3xl font-bold ${metrics.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.growth}%
                </p>
                {metrics.growth >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
              </div>
              <p className="text-sm text-gray-600">לעומת חודש קודם</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}