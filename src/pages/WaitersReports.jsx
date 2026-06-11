import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Download,
  ArrowUp,
  ArrowDown,
  Trophy,
  Award,
  Medal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/ui/PageHeader';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, startOfWeek, startOfMonth, eachWeekOfInterval, eachMonthOfInterval, parseISO } from 'date-fns';

export default function WaitersReports() {
  const [user, setUser] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    fetchUser();
  }, []);

  const { data: waiters = [], isLoading: waitersLoading } = useQuery({
    queryKey: ['waiters', user?.restaurant_id],
    queryFn: async () => {
      if (!user?.restaurant_id) return [];
      return base44.entities.Waiter.filter({ restaurant_id: user.restaurant_id }, '-created_date');
    },
    enabled: !!user?.restaurant_id,
  });

  const { data: allCustomers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['all-customers', user?.restaurant_id],
    queryFn: async () => {
      if (!user?.restaurant_id) return [];
      return base44.entities.Customer.filter({ restaurant_id: user.restaurant_id });
    },
    enabled: !!user?.restaurant_id,
  });

  const isLoading = waitersLoading || customersLoading;

  // Filter customers by date range
  const filteredCustomers = allCustomers.filter(customer => {
    if (!customer.referred_by) return false;
    const createdDate = new Date(customer.created_date);
    if (dateFrom && createdDate < new Date(dateFrom)) return false;
    if (dateTo && createdDate > new Date(dateTo)) return false;
    return true;
  });

  // Calculate stats per waiter
  const waiterStats = waiters.map(waiter => {
    const waiterSignups = filteredCustomers.filter(c => c.referred_by === waiter.id);
    return {
      ...waiter,
      signupsInPeriod: waiterSignups.length,
      customers: waiterSignups
    };
  }).sort((a, b) => b.signupsInPeriod - a.signupsInPeriod);

  // Time series data
  const getTimeSeriesData = () => {
    if (filteredCustomers.length === 0) return [];

    const customerDates = filteredCustomers.map(c => new Date(c.created_date));
    const minDate = dateFrom ? new Date(dateFrom) : new Date(Math.min(...customerDates));
    const maxDate = dateTo ? new Date(dateTo) : new Date(Math.max(...customerDates));

    if (viewMode === 'week') {
      const weeks = eachWeekOfInterval({ start: minDate, end: maxDate }, { weekStartsOn: 0 });
      return weeks.map(weekStart => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        const weekData = {
          period: format(weekStart, 'dd/MM'),
          total: 0
        };

        waiters.forEach(waiter => {
          const count = filteredCustomers.filter(c => 
            c.referred_by === waiter.id &&
            new Date(c.created_date) >= weekStart &&
            new Date(c.created_date) < weekEnd
          ).length;
          weekData[waiter.name] = count;
          weekData.total += count;
        });

        return weekData;
      });
    } else {
      const months = eachMonthOfInterval({ start: minDate, end: maxDate });
      return months.map(monthStart => {
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        
        const monthData = {
          period: format(monthStart, 'MM/yyyy'),
          total: 0
        };

        waiters.forEach(waiter => {
          const count = filteredCustomers.filter(c => 
            c.referred_by === waiter.id &&
            new Date(c.created_date) >= monthStart &&
            new Date(c.created_date) < monthEnd
          ).length;
          monthData[waiter.name] = count;
          monthData.total += count;
        });

        return monthData;
      });
    }
  };

  const timeSeriesData = getTimeSeriesData();

  // Pie chart data
  const pieData = waiterStats
    .filter(w => w.signupsInPeriod > 0)
    .map(waiter => ({
      name: waiter.name,
      value: waiter.signupsInPeriod
    }));

  const COLORS = ['#C5A059', '#0F172A', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Award className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-orange-600" />;
    return <span className="text-gray-400 font-medium">#{index + 1}</span>;
  };

  const exportToCSV = () => {
    const csv = [
      ['דירוג', 'שם מלצר', 'הרשמות בתקופה', 'סה"כ הרשמות', 'תאריך הצטרפות'],
      ...waiterStats.map((w, i) => [
        i + 1,
        w.name,
        w.signupsInPeriod,
        w.signup_count,
        format(new Date(w.created_date), 'dd/MM/yyyy')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waiters-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="דוחות מלצרים"
        subtitle="ניתוח ביצועים והשוואות"
        actions={
          <Button
            onClick={exportToCSV}
            variant="outline"
            disabled={waiterStats.length === 0}
          >
            <Download className="w-4 h-4 ml-2" />
            ייצא לאקסל
          </Button>
        }
      />

      {/* Date Filters */}
      <Card className="border-gray-100">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label htmlFor="date-from">מתאריך</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label htmlFor="date-to">עד תאריך</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                onClick={() => setViewMode('week')}
                className={viewMode === 'week' ? 'bg-[#C5A059] hover:bg-[#B8934D]' : ''}
              >
                שבועי
              </Button>
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                onClick={() => setViewMode('month')}
                className={viewMode === 'month' ? 'bg-[#C5A059] hover:bg-[#B8934D]' : ''}
              >
                חודשי
              </Button>
            </div>
            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
              >
                נקה סינון
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      ) : waiters.length === 0 ? (
        <Card className="border-gray-100">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-[#0F172A] mb-2">אין מלצרים במערכת</h3>
            <p className="text-gray-500 mb-4">התחל בהוספת מלצרים כדי לראות דוחות</p>
            <Link to={createPageUrl('Waiters')}>
              <Button className="bg-[#C5A059] hover:bg-[#B8934D] text-white">
                עבור לניהול מלצרים
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">סה"כ מלצרים</p>
                    <p className="text-3xl font-semibold text-[#0F172A]">{waiters.length}</p>
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
                    <p className="text-sm text-gray-500 mb-1">הרשמות בתקופה</p>
                    <p className="text-3xl font-semibold text-[#0F172A]">{filteredCustomers.length}</p>
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
                    <p className="text-sm text-gray-500 mb-1">ממוצע למלצר</p>
                    <p className="text-3xl font-semibold text-[#0F172A]">
                      {waiters.length > 0 ? Math.round(filteredCustomers.length / waiters.length) : 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">מלצר מוביל</p>
                    <p className="text-lg font-semibold text-[#0F172A] truncate">
                      {waiterStats[0]?.name || '-'}
                    </p>
                    <p className="text-sm text-gray-500">{waiterStats[0]?.signupsInPeriod || 0} הרשמות</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Line Chart - Trends */}
            <Card className="border-gray-100">
              <CardHeader className="border-b border-gray-100">
                <CardTitle>מגמות הרשמות לאורך זמן</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {timeSeriesData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    אין נתונים להצגה בטווח התאריכים שנבחר
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {waiters.slice(0, 5).map((waiter, index) => (
                        <Line
                          key={waiter.id}
                          type="monotone"
                          dataKey={waiter.name}
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Pie Chart - Distribution */}
            <Card className="border-gray-100">
              <CardHeader className="border-b border-gray-100">
                <CardTitle>התפלגות הרשמות לפי מלצר</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {pieData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    אין נתונים להצגה
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bar Chart - Comparison */}
          <Card className="border-gray-100">
            <CardHeader className="border-b border-gray-100">
              <CardTitle>השוואת ביצועים</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {waiterStats.length === 0 ? (
                <div className="h-96 flex items-center justify-center text-gray-500">
                  אין נתונים להצגה
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={waiterStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="signupsInPeriod" name="הרשמות בתקופה" fill="#C5A059" />
                    <Bar dataKey="signup_count" name="סה״כ הרשמות" fill="#0F172A" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Leaderboard Table */}
          <Card className="border-gray-100">
            <CardHeader className="border-b border-gray-100">
              <CardTitle>טבלת דירוג מלצרים</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F5F7FA] border-b border-gray-100">
                  <tr>
                    <th className="text-right text-sm font-semibold text-[#0F172A] px-6 py-4">דירוג</th>
                    <th className="text-right text-sm font-semibold text-[#0F172A] px-6 py-4">שם מלצר</th>
                    <th className="text-right text-sm font-semibold text-[#0F172A] px-6 py-4">הרשמות בתקופה</th>
                    <th className="text-right text-sm font-semibold text-[#0F172A] px-6 py-4">סה"כ הרשמות</th>
                    <th className="text-right text-sm font-semibold text-[#0F172A] px-6 py-4">שיעור השתתפות</th>
                    <th className="text-right text-sm font-semibold text-[#0F172A] px-6 py-4">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {waiterStats.map((waiter, index) => {
                    const percentage = filteredCustomers.length > 0 
                      ? ((waiter.signupsInPeriod / filteredCustomers.length) * 100).toFixed(1)
                      : 0;
                    return (
                      <tr key={waiter.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center w-8">
                            {getRankIcon(index)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Link to={createPageUrl('WaiterProfile') + '?id=' + waiter.id}>
                            <div className="flex items-center gap-3 hover:opacity-70 transition-opacity">
                              <div className="w-10 h-10 rounded-full bg-[#C5A059] flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {waiter.name?.[0]?.toUpperCase() || 'M'}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-[#0F172A]">{waiter.name}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {waiter.signupsInPeriod}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {waiter.signup_count}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-[100px]">
                              <div
                                className="bg-[#C5A059] h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{percentage}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Link to={createPageUrl('WaiterProfile') + '?id=' + waiter.id}>
                            <Button size="sm" variant="outline">
                              צפה בפרופיל
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}